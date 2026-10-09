#!/usr/bin/env python3
# Scaling & Orientation Tool - plugin per WebODM
# Copyright (C) 2026 Luca Mandolesi
# SPDX-License-Identifier: AGPL-3.0-or-later
# Rilasciato con la stessa licenza di WebODM (GNU AGPL v3): vedi il file LICENSE.
"""Applica la trasformazione salvata ai prodotti 3D del task (processo separato).

Uso:  export_worker.py --assets <task>/assets/ --plugin-dir <plugin dir>

Legge   <assets>/scaling_tool/transform.json
Scrive  <assets>/scaling_tool/out/...   e aggiorna   export_status.json
Prodotti:  scaled_model.laz (nuvola di punti; georeferenced_model.laz se il task e' georiferito), scaled_textured_model/ (OBJ+mtl+texture),
           transform_matrix.json, transform_matrix.txt
"""
import argparse
import glob
import json
import os
import shutil
import subprocess
import sys
import time
import traceback

SUBDIR = 'scaling_tool'

CLOUD_CANDIDATES = [
    os.path.join('odm_georeferencing', 'odm_georeferenced_model.laz'),
    os.path.join('odm_georeferencing', 'odm_georeferenced_model.las'),
]
OBJ_CANDIDATES = [
    os.path.join('odm_texturing', 'odm_textured_model_geo.obj'),
    os.path.join('odm_texturing', 'odm_textured_model.obj'),
]


def add_plugin_site_packages(plugin_dir):
    """Rende importabili le dipendenze pip installate da WebODM dentro la cartella del plugin."""
    for root, dirs, _ in os.walk(plugin_dir):
        for d in dirs:
            if d in ('site-packages', 'python_packages'):
                sys.path.insert(0, os.path.join(root, d))
        if root.count(os.sep) - plugin_dir.count(os.sep) >= 2:
            dirs[:] = []


def server_roots(args):
    """Cartelle del server che non devono comparire nei messaggi mostrati nel pannello."""
    import tempfile
    exe = os.path.dirname(os.path.abspath(sys.executable))
    return (args.assets, args.plugin_dir, tempfile.gettempdir(), os.path.expanduser('~'),
            os.path.dirname(os.path.dirname(exe)), exe)


class Status:
    def __init__(self, path, roots=()):
        self.path = path
        self.roots = tuple(roots)       # cartelle del server da non mostrare nei messaggi (safe_io.scrub)
        self.state = {'state': 'running', 'pid': os.getpid(), 'started': time.time(),
                      'message': 'Avvio...', 'progress': 0, 'files': []}
        self.flush()

    def flush(self):
        import safe_io              # stessa cartella di questo script
        final = self.state.get('state') != 'running'
        self.state['updated'] = time.time()      # battito: se smette di arrivare il worker e' morto
        try:
            # un aggiornamento di avanzamento si puo' perdere, l'esito finale no
            safe_io.write_json(self.path, self.state, patience=60.0 if final else 1.0)
        except PermissionError:
            if final:
                raise

    def update(self, message=None, progress=None, **kw):
        if message is not None:
            import safe_io
            self.state['message'] = safe_io.scrub(message, self.roots)
        if progress is not None:
            self.state['progress'] = round(progress, 1)
        self.state.update(kw)
        self.flush()


def transform_cloud(src, dst, matrix, status, p0, p1, epsg=None):
    import numpy as np
    import laspy

    A = np.array([row[:3] for row in matrix[:3]], dtype=np.float64)
    t = np.array([row[3] for row in matrix[:3]], dtype=np.float64)
    k = float(np.linalg.norm(A[0])) or 1.0                  # scala uniforme

    with laspy.open(src) as reader:
        h = reader.header
        n_total = h.point_count
        # nuovo bounding box = trasformata degli 8 angoli del vecchio
        mn, mx = np.array(h.mins), np.array(h.maxs)
        corners = np.array([[x, y, z] for x in (mn[0], mx[0]) for y in (mn[1], mx[1])
                            for z in (mn[2], mx[2])])
        tc = corners @ A.T + t

        hdr = laspy.LasHeader(point_format=h.point_format, version=h.version)
        hdr.offsets = tc.min(axis=0)
        hdr.scales = np.maximum(np.array(h.scales) * k, 1e-5)
        if epsg:
            try:                                # serve pyproj; senza, il codice resta nel file di testo
                import pyproj
                hdr.add_crs(pyproj.CRS.from_epsg(epsg))
            except Exception as e:
                print('CRS non scritto nel file LAZ: %s' % e, flush=True)
        # senza georeferenziazione i VLR (CRS) non vengono copiati: il risultato e' un sistema locale in metri

        done = 0
        with laspy.open(dst, mode='w', header=hdr) as writer:
            for pts in reader.chunk_iterator(1_000_000):
                xyz = np.column_stack((np.asarray(pts.x), np.asarray(pts.y), np.asarray(pts.z)))
                new = xyz @ A.T + t
                # record legato al header di OUTPUT, cosi' laspy non riscala con quello di input
                rec = laspy.ScaleAwarePointRecord(pts.array, pts.point_format, hdr.scales, hdr.offsets)
                rec.X = np.round((new[:, 0] - hdr.offsets[0]) / hdr.scales[0]).astype(np.int32)
                rec.Y = np.round((new[:, 1] - hdr.offsets[1]) / hdr.scales[1]).astype(np.int32)
                rec.Z = np.round((new[:, 2] - hdr.offsets[2]) / hdr.scales[2]).astype(np.int32)
                pts = rec
                writer.write_points(pts)
                done += len(pts)
                status.update('Nuvola di punti: %d / %d' % (done, n_total),
                              p0 + (p1 - p0) * done / max(1, n_total))


def transform_obj(src, dst, matrix, status, p0, p1, label='Mesh OBJ'):
    """Riscrive un OBJ applicando la matrice 4x4 (liste di righe) ai vertici e la sola
    rotazione alle normali. Ritorna (min, max) del risultato."""
    A = [row[:3] for row in matrix[:3]]
    t = [row[3] for row in matrix[:3]]
    k = sum(x * x for x in A[0]) ** 0.5 or 1.0            # scala uniforme
    N = [[x / k for x in row] for row in A]
    lo, hi = [float('inf')] * 3, [float('-inf')] * 3
    size = max(1, os.path.getsize(src))
    read = 0
    last = 0.0
    with open(src, 'r', encoding='utf-8', errors='surrogateescape') as fi, \
            open(dst, 'w', encoding='utf-8', errors='surrogateescape') as fo:
        for line in fi:
            read += len(line)
            if line.startswith('v '):
                parts = line.split()
                p = (float(parts[1]), float(parts[2]), float(parts[3]))
                q = [A[i][0] * p[0] + A[i][1] * p[1] + A[i][2] * p[2] + t[i] for i in range(3)]
                for i in range(3):
                    if q[i] < lo[i]:
                        lo[i] = q[i]
                    if q[i] > hi[i]:
                        hi[i] = q[i]
                fo.write('v %.6f %.6f %.6f%s\n' % (q[0], q[1], q[2],
                                                    (' ' + ' '.join(parts[4:])) if len(parts) > 4 else ''))
            elif line.startswith('vn '):
                parts = line.split()
                p = (float(parts[1]), float(parts[2]), float(parts[3]))
                fo.write('vn %.6f %.6f %.6f\n' % tuple(
                    N[i][0] * p[0] + N[i][1] * p[1] + N[i][2] * p[2] for i in range(3)))
            else:
                fo.write(line)
            if time.time() - last > 1.0:
                last = time.time()
                status.update('%s: %d%%' % (label, 100 * read / size), p0 + (p1 - p0) * read / size)
    return lo, hi


def find_tool(name):
    """Ritorna (eseguibile, env) per uno strumento di ODM/GDAL, oppure (None, None).
    Docker: e' nel PATH. App Windows: e' dentro apps/ODX e richiede il suo ambiente."""
    exe = shutil.which(name)
    if exe:
        return exe, None
    d = os.path.dirname(os.path.abspath(sys.executable))
    for _ in range(4):                       # risale da apps/python39 fino a trovare apps/ODX
        odx = os.path.join(d, 'ODX')
        sbbin = os.path.join(odx, 'SuperBuild', 'install', 'bin')
        osgeo = os.path.join(odx, 'venv', 'Lib', 'site-packages', 'osgeo')
        for folder in (sbbin, osgeo):
            cand = os.path.join(folder, name + '.exe')
            if os.path.isfile(cand):
                env = os.environ.copy()      # stesso ambiente di ODX/win32env.bat
                env['PATH'] = os.pathsep.join([osgeo, sbbin, env.get('PATH', '')])
                env['PDAL_DRIVER_PATH'] = sbbin
                env['GDAL_DATA'] = os.path.join(osgeo, 'data', 'gdal')
                env['GDAL_DRIVER_PATH'] = os.path.join(osgeo, 'gdalplugins')
                # Il processo di WebODM puo' avere PROJ_DATA/PROJ_LIB del proj.db di python39 (piu' vecchio, lo imposta osgeo
                # appena importato) o di un'altra installazione (PostGIS): il PROJ di ODX lo rifiuta e PDAL non scrive
                # nessun EPSG. win32env.bat usa quello di rasterio: sempre lo stesso, e le due variabili insieme.
                for proj in (os.path.join(odx, 'venv', 'Lib', 'site-packages', 'rasterio', 'proj_data'),
                             os.path.join(osgeo, 'data', 'proj')):
                    if os.path.isfile(os.path.join(proj, 'proj.db')):
                        env['PROJ_LIB'] = env['PROJ_DATA'] = proj
                        break
                return cand, env
        d = os.path.dirname(d)
    return None, None


def find_pdal():
    return find_tool('pdal')


def find_cloud(assets):
    return next((os.path.join(assets, c) for c in CLOUD_CANDIDATES
                 if os.path.isfile(os.path.join(assets, c))), None)


def find_obj(assets):
    return next((os.path.join(assets, c) for c in OBJ_CANDIDATES
                 if os.path.isfile(os.path.join(assets, c))), None)


def link_or_copy(src, dst):
    """Hard link (istantaneo, nessuno spazio in piu'); se non e' possibile, copia."""
    try:
        os.link(src, dst)
    except (OSError, AttributeError, NotImplementedError):
        shutil.copy2(src, dst)


def run_tool(cmd, env, status, message, progress, log_path):
    """Esegue un comando aggiornando lo stato ogni secondo. Solleva RuntimeError se fallisce."""
    with open(log_path, 'ab') as lf:
        lf.write((' '.join(cmd) + '\n').encode('utf-8', 'replace'))
        lf.flush()
        proc = subprocess.Popen(cmd, stdout=lf, stderr=subprocess.STDOUT,
                                stdin=subprocess.DEVNULL, env=env)
        t0 = time.time()
        while proc.poll() is None:
            time.sleep(0.5)
            status.update('%s (%d s)' % (message, time.time() - t0), progress)
    if proc.returncode != 0:
        with open(log_path, 'rb') as lf:
            tail = lf.read()[-400:].decode('utf-8', 'replace')
        raise RuntimeError('%s ha fallito (codice %s): %s'
                           % (os.path.basename(cmd[0]), proc.returncode, tail.strip()))


def transform_cloud_pdal(src, dst, matrix, status, p0, epsg=None):
    """Usa il PDAL gia' incluso in WebODM (nessuna dipendenza da installare)."""
    pdal, env = find_pdal()
    if not pdal:
        raise RuntimeError('pdal non trovato')
    flat = ' '.join('%.15g' % v for row in matrix for v in row)
    cmd = [pdal, 'translate', src, dst, 'transformation',
           '--filters.transformation.matrix=' + flat]
    for ax in 'xyz':
        cmd += ['--writers.las.scale_%s=0.0001' % ax, '--writers.las.offset_%s=auto' % ax]
    if epsg:
        cmd.append('--writers.las.a_srs=EPSG:%d' % epsg)
    errlog = dst + '.pdal.log'
    with open(errlog, 'wb') as ef:
        proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=ef,
                                stdin=subprocess.DEVNULL, env=env)
        t0 = time.time()
        while proc.poll() is None:
            time.sleep(1)
            status.update('Nuvola di punti (PDAL): %d s' % (time.time() - t0), p0)
    with open(errlog, 'rb') as ef:
        err = ef.read().decode('utf-8', 'replace')
    os.remove(errlog)
    if proc.returncode != 0 or not os.path.isfile(dst):
        raise RuntimeError('pdal ha fallito (rc=%s): %s' % (proc.returncode, err[-300:]))


def export_cloud(cloud, out, matrix, status, warnings, epsg=None):
    """Ritorna il nome del file prodotto, oppure None. Prova PDAL, poi laspy.
    Con `epsg` la nuvola e' georiferita (coordinate assolute) e si chiama georeferenced_model."""
    base = 'georeferenced_model' if epsg else 'scaled_model'
    dst = os.path.join(out, base + '.laz')
    try:
        transform_cloud_pdal(cloud, dst, matrix, status, 10, epsg)
        return base + '.laz'
    except Exception as e:
        print('PDAL non utilizzabile: %s' % e, flush=True)
        if os.path.exists(dst):
            os.remove(dst)
        pdal_error = str(e)
    try:
        import laspy  # noqa: F401
    except ImportError:
        warnings.append('Nuvola di punti non esportata (%s; laspy assente). '
                        'Applica transform_matrix.txt con CloudCompare/PDAL' % pdal_error)
        return None
    for name in (base + '.laz', base + '.las'):
        dst = os.path.join(out, name)
        try:
            transform_cloud(cloud, dst, matrix, status, 2, 60, epsg)
            return name
        except Exception as e:
            print('laspy -> %s fallito: %s' % (name, e), flush=True)
            if os.path.exists(dst):
                os.remove(dst)
            last = str(e)
    warnings.append('Nuvola di punti non esportata: %s' % last)
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--assets', required=True)
    ap.add_argument('--plugin-dir', required=True)
    args = ap.parse_args()

    try:
        os.nice(10)          # bassa priorita': non deve rallentare WebODM
    except (AttributeError, OSError):
        pass

    sys.path.insert(0, args.plugin_dir)
    add_plugin_site_packages(args.plugin_dir)
    import transform_math
    import georef

    work = os.path.join(args.assets, SUBDIR)
    out = os.path.join(work, 'out')
    status = Status(os.path.join(work, 'export_status.json'), server_roots(args))

    try:
        with open(os.path.join(work, 'transform.json'), encoding='utf-8') as f:
            params = json.load(f)
        matrix = transform_math.matrix4(params)
        # task georiferito: la nuvola va in coordinate assolute, la mesh in coordinate ridotte (assoluto - offset)
        geo = georef.load(work, params)
        cloud_matrix = geo['matrix_abs'] if geo else matrix
        mesh_matrix = geo['matrix_view'] if geo else matrix

        if os.path.isdir(out):
            shutil.rmtree(out)
        os.makedirs(out)
        files = []

        doc = {'description': "p_nuovo = M * [x, y, z, 1]^T, unita' risultante: metri",
               'matrix_row_major': cloud_matrix, 'parameters': {k: params.get(k) for k in
                                                                ('scale', 'up', 'xdir', 'origin')}}
        if geo:
            doc['description'] += (". Task georiferito: M porta in coordinate assolute EPSG:%d; "
                                   "matrix_view_row_major porta in coordinate ridotte (assoluto - offset)" % geo['epsg'])
            doc['georef'] = {'epsg': geo['epsg'], 'offset': geo['offset'], 'rotation_deg': geo['rotation_deg'],
                             'matrix_view_row_major': geo['matrix_view'], 'checks': geo['checks']}
        with open(os.path.join(out, 'transform_matrix.json'), 'w', encoding='utf-8') as f:
            json.dump(doc, f, indent=2)
        with open(os.path.join(out, 'transform_matrix.txt'), 'w') as f:
            f.write('\n'.join(' '.join('%.12g' % v for v in row) for row in cloud_matrix) + '\n')
        files += ['transform_matrix.json', 'transform_matrix.txt']
        if geo:
            with open(os.path.join(out, 'georef_info.txt'), 'w', encoding='utf-8') as f:
                f.write(georef.info_text(geo))
            files.append('georef_info.txt')
        status.update('Matrice salvata', 2, files=files)

        # --- nuvola di punti ---
        cloud = next((os.path.join(args.assets, c) for c in CLOUD_CANDIDATES[:2]
                      if os.path.isfile(os.path.join(args.assets, c))), None)
        warnings = []
        if cloud:
            name = export_cloud(cloud, out, cloud_matrix, status, warnings, geo['epsg'] if geo else None)
            if name:
                files.append(name)
        else:
            warnings.append('Nuvola di punti LAZ/LAS non trovata nel task')
        status.update(files=files, progress=60)

        # --- mesh texturizzata ---
        obj = find_obj(args.assets)
        if obj:
            mdir = os.path.join(out, 'scaled_textured_model')
            os.makedirs(mdir)
            src_dir = os.path.dirname(obj)
            for pat in ('*.mtl', '*.jpg', '*.jpeg', '*.png'):
                for fp in glob.glob(os.path.join(src_dir, pat)):
                    shutil.copy2(fp, mdir)
            transform_obj(obj, os.path.join(mdir, os.path.basename(obj)), mesh_matrix, status, 60, 98)
            if geo:
                shutil.copy2(os.path.join(out, 'georef_info.txt'), mdir)
            # fa scaricare tutto in un unico zip
            base = os.path.join(out, 'scaled_textured_model')
            shutil.make_archive(base, 'zip', mdir)
            shutil.rmtree(mdir)
            files.append('scaled_textured_model.zip')
        else:
            warnings.append('Mesh OBJ texturizzata non trovata nel task')

        msg = 'Completato' + (' - ' + '; '.join(warnings) if warnings else '')
        status.update(msg, 100, state='done', files=files)
    except Exception as e:
        traceback.print_exc()
        status.update('Errore: %s' % e, state='error')
        sys.exit(1)


if __name__ == '__main__':
    main()
