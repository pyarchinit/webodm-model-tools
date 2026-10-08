#!/usr/bin/env python3
# Scaling & Orientation Tool - plugin per WebODM
# Copyright (C) 2026 Luca Mandolesi
# SPDX-License-Identifier: AGPL-3.0-or-later
# Rilasciato con la stessa licenza di WebODM (GNU AGPL v3): vedi il file LICENSE.
"""Scatta un'ortofoto della mesh texturizzata allineata con una camera ortografica virtuale
(processo separato). La camera e' definita come in Blender:

  --rot=rx,ry,rz   rotazione di Eulero XYZ in gradi. A rotazione nulla la camera guarda verso -Z
                   (dall'alto) con +Y in alto nell'immagine; (90,0,0) guarda verso +Y con Z in alto.
  --pos=x,y,z      posizione nel sistema allineato (metri): e' il centro dell'inquadratura
  --width/--height dimensioni dell'inquadratura in metri (la "scala ortografica" di Blender)
  --clip           non riprende cio' che sta dietro la camera (serve per le sezioni)
  --res-cm         centimetri per pixel, oppure  --scale=N --dpi=D  per un disegno in scala 1:N

Senza --pos/--width/--height l'inquadratura e' tutto il modello, ritagliato sui bordi vuoti.

1. applica alla mesh OBJ la trasformazione salvata + la rotazione della camera
2. scarta le facce fuori dall'inquadratura (o dietro la camera)
3. rende con odm_orthophoto (lo stesso programma usato da ODM), che guarda lungo -Z
4. ritaglia, comprime e scrive le coordinate in metri (gdal_translate)

Scrive in <assets>/scaling_tool/ortho/ :  <nome>.tif (+ .tfw)  .png  .pdf (se in scala)  _preview.jpg  .json
Lo stato e' in <assets>/scaling_tool/ortho_status.json
"""
import argparse
import glob
import json
import math
import os
import shutil
import sys
import time
import traceback

# Viste con nome = rotazioni di Eulero XYZ in gradi (come in Blender). Stesse in public/main.js.
PRESETS = {
    'front':  ((90, 0, 0),   'Prospetto frontale (guarda verso +Y)'),
    'back':   ((90, 0, 180), 'Prospetto posteriore (guarda verso -Y)'),
    'left':   ((90, 0, -90), 'Prospetto laterale (guarda verso +X)'),
    'right':  ((90, 0, 90),  'Prospetto laterale (guarda verso -X)'),
    'top':    ((0, 0, 0),    "Pianta (dall'alto)"),
    'bottom': ((180, 0, 0),  'Vista dal basso'),
}
MAX_MEGAPIXEL = 300          # oltre, odm_orthophoto rischia di esaurire la memoria
CLOUD_MAX_MEGAPIXEL = 120    # la nuvola viene disegnata in memoria (8 byte per pixel)
PNG_MAX_MEGAPIXEL = 120      # oltre, si consegna solo il TIFF
ANNOTATE_MAX_MEGAPIXEL = 120  # le annotazioni passano da Pillow
JPG_MAX_MEGAPIXEL = 40       # il JPEG passa da Pillow, che tiene tutta l'immagine in memoria
PREVIEW_SIDE = 1600


def camera_axes(rot):
    """Righe (destra, alto, verso l'osservatore) della camera: sono le colonne di
    R = Rz * Ry * Rx. La camera guarda lungo -(terza riga). Uguale a cameraAxes() in main.js."""
    rx, ry, rz = [math.radians(v) for v in rot]
    cx, sx, cy, sy, cz, sz = math.cos(rx), math.sin(rx), math.cos(ry), math.sin(ry), math.cos(rz), math.sin(rz)
    R = [[cz * cy, cz * sy * sx - sz * cx, cz * sy * cx + sz * sx],
         [sz * cy, sz * sy * sx + cz * cx, sz * sy * cx - cz * sx],
         [-sy,     cy * sx,                cy * cx]]
    return [[0.0 if abs(R[i][j]) < 1e-12 else R[i][j] for i in range(3)] for j in range(3)]


def preset_of(rot):
    """Nome della vista predefinita con la stessa orientazione, oppure None."""
    axes = camera_axes(rot)
    for key, (preset_rot, _) in PRESETS.items():
        ref = camera_axes(preset_rot)
        if all(abs(axes[i][j] - ref[i][j]) < 1e-6 for i in range(3) for j in range(3)):
            return key
    return None


def view_matrix4(axes, matrix):
    """V * M come matrice 4x4 (liste di righe), V = righe di `axes`."""
    out = [[sum(axes[i][k] * matrix[k][j] for k in range(3)) for j in range(4)] for i in range(3)]
    out.append([0.0, 0.0, 0.0, 1.0])
    return out


def axis_label(vec):
    """'+X' per (1,0,0) ecc.; per direzioni oblique le tre componenti."""
    for i, name in enumerate('XYZ'):
        if abs(abs(vec[i]) - 1) < 1e-9:
            return ('+' if vec[i] > 0 else '-') + name
    return '(%.3f, %.3f, %.3f)' % tuple(vec)


def frame_clip_obj(src, dst, rect, zlo, zhi, status, p0, p1):
    """Tiene solo le facce che toccano l'inquadratura `rect` = (xmin, ymin, xmax, ymax) e che hanno
    tutti i vertici con z' tra `zlo` e `zhi` (clip end e clip start; None = nessun limite). I vertici rimasti inutilizzati vengono
    schiacciati in un punto dentro l'inquadratura, cosi' odm_orthophoto (che dimensiona l'immagine
    su TUTTI i vertici) rende solo la zona richiesta e non serve rinumerare nulla.
    Ritorna il numero di facce tenute."""
    xs, ys, zs = [], [], []
    with open(src, 'r', encoding='utf-8', errors='surrogateescape') as f:
        for line in f:
            if line.startswith('v '):
                p = line.split()
                xs.append(float(p[1])); ys.append(float(p[2])); zs.append(float(p[3]))
    n = len(xs)
    used = bytearray(n)
    keep = bytearray()
    status.update('Selezione delle facce inquadrate', p0)

    def indices(line):
        out = []
        for tok in line.split()[1:]:
            i = int(tok.split('/')[0])
            out.append(i - 1 if i > 0 else n + i)
        return out

    kept = 0
    with open(src, 'r', encoding='utf-8', errors='surrogateescape') as f:
        for line in f:
            if not line.startswith('f '):
                continue
            idx = indices(line)
            ok = True
            if zhi is not None and any(zs[i] > zhi for i in idx):
                ok = False
            elif zlo is not None and any(zs[i] < zlo for i in idx):
                ok = False
            elif rect is not None:
                xmin, ymin, xmax, ymax = rect
                if (all(xs[i] < xmin for i in idx) or all(xs[i] > xmax for i in idx) or
                        all(ys[i] < ymin for i in idx) or all(ys[i] > ymax for i in idx)):
                    ok = False
            keep.append(1 if ok else 0)
            if ok:
                kept += 1
                for i in idx:
                    used[i] = 1
    if not kept:
        return 0

    # punto di raccolta dei vertici scartati: dentro l'inquadratura, alla quota piu' bassa tenuta
    if rect is not None:
        cx, cy = (rect[0] + rect[2]) / 2.0, (rect[1] + rect[3]) / 2.0
    else:
        k = next(i for i in range(n) if used[i])
        cx, cy = xs[k], ys[k]
    cz = min(zs[i] for i in range(n) if used[i])
    dead = 'v %.6f %.6f %.6f\n' % (cx, cy, cz)

    status.update('Scrittura della mesh inquadrata', (p0 + p1) / 2.0)
    vi = fi = 0
    with open(src, 'r', encoding='utf-8', errors='surrogateescape') as f, \
            open(dst, 'w', encoding='utf-8', errors='surrogateescape') as o:
        for line in f:
            if line.startswith('v '):
                o.write(line if used[vi] else dead)
                vi += 1
            elif line.startswith('f '):
                if keep[fi]:
                    o.write(line)
                fi += 1
            else:
                o.write(line)
    return kept


def image_size(path, gdalinfo):
    try:
        from PIL import Image
        Image.MAX_IMAGE_PIXELS = None
        with Image.open(path) as im:
            return im.size
    except Exception:
        import subprocess
        exe, env = gdalinfo
        info = json.loads(subprocess.check_output([exe, '-json', path], env=env).decode('utf-8', 'replace'))
        return tuple(info['size'])


def content_window(small_png, full_w, full_h):
    """Finestra (xoff, yoff, w, h) in pixel pieni che contiene la parte non trasparente."""
    from PIL import Image
    Image.MAX_IMAGE_PIXELS = None
    with Image.open(small_png) as im:
        im = im.convert('RGBA')
        box = im.split()[3].point(lambda a: 255 if a > 8 else 0).getbbox()
        sw, sh = im.size
    if not box:
        return None
    fx, fy = full_w / float(sw), full_h / float(sh)
    pad = int(max(full_w, full_h) * 0.01) + 2
    x0 = max(0, int(box[0] * fx) - pad)
    y0 = max(0, int(box[1] * fy) - pad)
    x1 = min(full_w, int(box[2] * fx + 0.999) + pad)
    y1 = min(full_h, int(box[3] * fy + 0.999) + pad)
    return x0, y0, x1 - x0, y1 - y0


def make_preview(src_png, dst_jpg):
    from PIL import Image
    Image.MAX_IMAGE_PIXELS = None
    with Image.open(src_png) as im:
        im = im.convert('RGBA')
        im.thumbnail((PREVIEW_SIDE, PREVIEW_SIDE))
        bg = Image.new('RGB', im.size, (255, 255, 255))
        bg.paste(im, mask=im.split()[3])
        bg.save(dst_jpg, quality=85)


def make_jpeg(src_png, dst_jpg, dpi=None):
    """JPEG a piena risoluzione su fondo bianco (il JPEG non ha trasparenza)."""
    from PIL import Image
    Image.MAX_IMAGE_PIXELS = None
    with Image.open(src_png) as im:
        im = im.convert('RGBA')
        bg = Image.new('RGB', im.size, (255, 255, 255))
        bg.paste(im, mask=im.split()[3])
    opts = {'quality': 92, 'optimize': True}
    if dpi:
        opts['dpi'] = (dpi, dpi)
    bg.save(dst_jpg, **opts)


def write_world_files(out, name, epsg, warnings):
    """Accanto al PNG (name.wld, scritto da GDAL) e al JPEG (name.jgw, stessa riga di numeri) mette il
    file .prj con il sistema di coordinate, cosi' i programmi GIS li aprono gia' georiferiti.
    Ritorna i nomi dei file creati."""
    from export_worker import find_tool
    import subprocess
    made = []
    wld = os.path.join(out, name + '.wld')
    if os.path.isfile(wld):
        made.append(name + '.wld')
        if os.path.isfile(os.path.join(out, name + '.jpg')):
            shutil.copy2(wld, os.path.join(out, name + '.jgw'))
            made.append(name + '.jgw')
    exe, env = find_tool('gdalsrsinfo')
    if exe:
        try:
            wkt = subprocess.check_output([exe, '-o', 'wkt_esri', 'EPSG:%d' % epsg], env=env, timeout=60)
            if not wkt.strip():
                raise RuntimeError('risposta vuota di gdalsrsinfo')
            with open(os.path.join(out, name + '.prj'), 'wb') as f:
                f.write(wkt.strip() + b'\n')
            made.append(name + '.prj')
        except Exception as e:
            warnings.append('File .prj non creato (%s)' % str(e)[:60])
    return made


def triple(text):
    parts = [float(v) for v in text.split(',')]
    if len(parts) != 3:
        raise argparse.ArgumentTypeError('servono tre numeri separati da virgola')
    return parts


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--assets', required=True)
    ap.add_argument('--plugin-dir', required=True)
    ap.add_argument('--rot', required=True, type=triple)
    ap.add_argument('--pos', type=triple)
    ap.add_argument('--width', type=float)
    ap.add_argument('--height', type=float)
    ap.add_argument('--source', choices=('mesh', 'cloud'), default='mesh')
    ap.add_argument('--point-size', type=int, default=0)        # nuvola: lato del punto in pixel, 0 = automatico
    ap.add_argument('--clip-start', type=float)                 # metri davanti alla camera
    ap.add_argument('--clip-end', type=float)
    ap.add_argument('--res-cm', type=float)
    ap.add_argument('--scale', type=float)
    ap.add_argument('--dpi', type=float)
    ap.add_argument('--annotate', action='store_true')          # scala metrica + punti di georeferenziazione
    args = ap.parse_args()

    try:
        os.nice(10)
    except (AttributeError, OSError):
        pass

    sys.path.insert(0, args.plugin_dir)
    import transform_math
    import georef
    from export_worker import (SUBDIR, Status, find_cloud, find_obj, find_tool, link_or_copy,
                               run_tool, transform_obj)

    work = os.path.join(args.assets, SUBDIR)
    out = os.path.join(work, 'ortho')
    tmp = os.path.join(work, 'ortho_tmp')
    # ortho.log e' gia' aperto dal processo che ci ha lanciati (stdout): qui un file diverso
    log = os.path.join(work, 'ortho_tools.log')
    status = Status(os.path.join(work, 'ortho_status.json'))
    name = None

    try:
        in_scale = bool(args.scale and args.dpi)
        res_cm = args.scale * 2.54 / args.dpi if in_scale else args.res_cm
        if not res_cm or res_cm <= 0:
            raise RuntimeError('Risoluzione mancante')
        res = 100.0 / res_cm                         # pixel per metro
        framed = args.pos is not None and args.width and args.height
        clipping = args.clip_start is not None or args.clip_end is not None
        if clipping and args.pos is None:
            raise RuntimeError('Per il clip serve la posizione della camera')
        if args.clip_start is not None and args.clip_end is not None and args.clip_end <= args.clip_start:
            raise RuntimeError('Clip end deve essere maggiore di clip start')
        from_cloud = args.source == 'cloud'
        max_megapixel = CLOUD_MAX_MEGAPIXEL if from_cloud else MAX_MEGAPIXEL

        with open(os.path.join(work, 'transform.json'), encoding='utf-8') as f:
            params = json.load(f)
        gdal_translate = find_tool('gdal_translate')
        if framed and not gdal_translate[0]:
            raise RuntimeError("gdal_translate non trovato: non posso ritagliare sull'inquadratura")
        if from_cloud:
            cloud = find_cloud(args.assets)
            if not cloud:
                raise RuntimeError('Nuvola di punti (LAZ/LAS) non trovata in questo task')
            pdal_exe, pdal_env = find_tool('pdal')
            if not pdal_exe:
                raise RuntimeError('pdal non trovato: serve per preparare la nuvola di punti')
        else:
            obj = find_obj(args.assets)
            if not obj:
                raise RuntimeError('Mesh texturizzata (OBJ) non trovata in questo task')
            ortho_exe, ortho_env = find_tool('odm_orthophoto')
            builtin = not ortho_exe or bool(os.environ.get('SCALING_TOOL_BUILTIN'))   # (variabile: solo per i test) senza odm_orthophoto (WebODM in Docker) disegna mesh_render.py
            if builtin and not gdal_translate[0]:
                raise RuntimeError("Ne' odm_orthophoto ne' gdal_translate sono disponibili: "
                                   "lo scatto dalla mesh non e' possibile, quello dalla nuvola di punti si'")

        shutil.rmtree(tmp, ignore_errors=True)
        os.makedirs(tmp)
        os.makedirs(out, exist_ok=True)
        open(log, 'wb').close()

        axes = camera_axes(args.rot)
        preset = preset_of(args.rot)
        name = time.strftime('ortho_%Y%m%d_%H%M%S')
        while os.path.exists(os.path.join(out, name + '.json')):
            name += 'b'
        # task georiferito: si lavora nel sistema "vista" (assoluto - offset), con numeri piccoli come nel
        # visualizzatore; l'offset si riaggiunge solo alle coordinate scritte nei file. Solo la pianta
        # (guarda verso -Z, Y in alto = Nord) e' una carta: le altre viste non hanno coordinate geografiche.
        geo = georef.load(work, params)
        epsg = geo['epsg'] if geo and preset == 'top' else None
        off = geo['offset'] if geo else [0.0, 0.0, 0.0]
        M = view_matrix4(axes, geo['matrix_view'] if geo else transform_math.matrix4(params))

        # --- 1. inquadratura e clip nelle coordinate della camera (x' destra, y' alto, z' verso chi guarda)
        rect = zlo = zhi = None
        if args.pos is not None:
            cam = [sum(axes[i][k] * args.pos[k] for k in range(3)) for i in range(3)]
            if args.clip_start is not None:
                zhi = cam[2] - args.clip_start        # piu' vicino di cosi' alla camera: escluso
            if args.clip_end is not None:
                zlo = cam[2] - args.clip_end          # piu' lontano di cosi': escluso
            if framed:
                rect = (cam[0] - args.width / 2.0, cam[1] - args.height / 2.0,
                        cam[0] + args.width / 2.0, cam[1] + args.height / 2.0)

        def check_size(width_m, height_m):
            est_w, est_h = int(round(width_m * res)), int(round(height_m * res))
            megapixel = est_w * est_h / 1e6
            if megapixel > max_megapixel:
                min_cm = res_cm * (megapixel / max_megapixel) ** 0.5
                raise RuntimeError(
                    'Immagine troppo grande: %d x %d pixel (%.0f megapixel, massimo %d) per %.1f x %.1f m. '
                    'Usa almeno %.2g cm/pixel, oppure una scala o un\'inquadratura piu\' piccola'
                    % (est_w, est_h, megapixel, max_megapixel, width_m, height_m, min_cm * 1.02))
            if est_w < 2 or est_h < 2:
                raise RuntimeError('Immagine di meno di 2 pixel: aumenta la risoluzione o l\'inquadratura')
            return est_w, est_h

        nothing = ('La camera non inquadra nessuna parte del modello: controlla posizione, rotazione, '
                   'dimensioni dell\'inquadratura e clip start/end')
        raw = os.path.join(tmp, 'raw.tif')
        point_px = None
        builtin_note = None

        if from_cloud:
            # --- 2a. PDAL porta la nuvola nel sistema della camera e la ritaglia; poi la disegniamo noi
            if framed:
                est_w, est_h = check_size(args.width, args.height)
            las = os.path.join(tmp, 'cloud.las')
            flat = ' '.join('%.15g' % v for row in M for v in row)
            cmd = [pdal_exe, 'translate', cloud, las, 'transformation']
            opts = ['--filters.transformation.matrix=' + flat]
            if rect is not None or zlo is not None or zhi is not None:
                big = 1e9
                bx = (rect[0], rect[2]) if rect else (-big, big)
                by = (rect[1], rect[3]) if rect else (-big, big)
                bz = (zlo if zlo is not None else -big, zhi if zhi is not None else big)
                cmd.append('crop')
                opts.append('--filters.crop.bounds=([%.6f,%.6f],[%.6f,%.6f],[%.6f,%.6f])' % (bx + by + bz))
            opts += ['--writers.las.minor_version=2', '--writers.las.dataformat_id=3']      # non compresso, con RGB
            for ax in 'xyz':
                opts += ['--writers.las.scale_%s=0.0001' % ax, '--writers.las.offset_%s=auto' % ax]
            run_tool(cmd + opts, pdal_env, status, 'Preparazione della nuvola di punti', 10, log)
            import cloud_render
            header = cloud_render.read_las_header(las)
            if header['count'] == 0:
                raise RuntimeError(nothing)
            if not framed:
                est_w, est_h = check_size(header['max'][0] - header['min'][0], header['max'][1] - header['min'][1])
            (xmin, ymin, xmax, ymax), full_w, full_h, n_points, point_px = cloud_render.render(
                las, raw, rect, res, args.point_size or None, status, 25, 68)
            os.remove(las)
        else:
            # --- 2b. mesh nel sistema della camera, ritagliata, resa da odm_orthophoto
            src_dir = os.path.dirname(obj)
            for pat in ('*.mtl', '*.jpg', '*.jpeg', '*.png'):
                for fp in glob.glob(os.path.join(src_dir, pat)):
                    link_or_copy(fp, os.path.join(tmp, os.path.basename(fp)))
            tmp_obj = os.path.join(tmp, 'model.obj')
            lo, hi = transform_obj(obj, tmp_obj, M, status, 2, 25, 'Preparazione mesh')
            est_w, est_h = check_size(*((args.width, args.height) if framed else (hi[0] - lo[0], hi[1] - lo[1])))
            if rect is not None or zlo is not None or zhi is not None:
                clipped = os.path.join(tmp, 'model_clip.obj')
                if not frame_clip_obj(tmp_obj, clipped, rect, zlo, zhi, status, 26, 34):
                    raise RuntimeError(nothing)
                os.remove(tmp_obj)
                os.rename(clipped, tmp_obj)
            corners_file = os.path.join(tmp, 'corners.txt')
            if builtin:
                import mesh_render
                got = mesh_render.render(tmp_obj, raw, rect, res, status, 35, 68)
                if got is None:
                    raise RuntimeError(nothing)
                (xmin, ymin, xmax, ymax), full_w, full_h, n_tri = got
                builtin_note = 'mesh resa dal renderizzatore interno (%d triangoli)' % n_tri
            else:
                run_tool([ortho_exe, '-inputFiles', tmp_obj, '-logFile', os.path.join(tmp, 'odm_orthophoto.log'),
                          '-outputFile', raw, '-resolution', '%.6f' % res, '-outputCornerFile', corners_file],
                         ortho_env, status, 'Rendering', 35, log)
                if not os.path.isfile(raw):
                    raise RuntimeError("odm_orthophoto non ha prodotto l'immagine")
                with open(corners_file) as f:
                    xmin, ymin, xmax, ymax = [float(v) for v in f.read().split()[:4]]
                full_w, full_h = image_size(raw, find_tool('gdalinfo'))

        # --- 4. ritaglio, coordinate in metri, compressione
        files, warnings = [], []
        if builtin_note:
            warnings.append(builtin_note)
        georef_points = None             # punti di controllo disegnati sull'immagine
        tif = os.path.join(out, name + '.tif')
        x0, y0, w, h = 0, 0, full_w, full_h

        if gdal_translate[0]:
            exe, env = gdal_translate
            quiet = ['--config', 'GDAL_PAM_ENABLED', 'NO']
            if framed:
                # riga 0 = Y massima, colonna 0 = X minima (verificato su odm_orthophoto).
                # La finestra puo' uscire dall'immagine resa: gdal riempie di trasparente.
                x0, y0 = int(round((rect[0] - xmin) * res)), int(round((ymax - rect[3]) * res))
                w, h = est_w, est_h
            else:
                small = os.path.join(tmp, 'small.png')
                k = min(1.0, 1024.0 / max(full_w, full_h))
                run_tool([exe] + quiet + ['-of', 'PNG', '-outsize', str(max(1, int(full_w * k))),
                                          str(max(1, int(full_h * k))), raw, small],
                         env, status, 'Ricerca dei bordi vuoti', 70, log)
                try:
                    x0, y0, w, h = content_window(small, full_w, full_h) or (x0, y0, w, h)
                except ImportError:
                    warnings.append('Pillow assente: bordi vuoti non ritagliati')
            ulx, uly = xmin + x0 / res, ymax - y0 / res
            if epsg:
                ulx, uly = ulx + off[0], uly + off[1]
            lrx, lry = ulx + w / res, uly - h / res
            srcwin = ['-srcwin', str(x0), str(y0), str(w), str(h)]
            if args.annotate:
                # scala metrica e punti di georeferenziazione disegnati sull'immagine gia' ritagliata:
                # da qui in poi tutti i formati partono da quella
                if w * h / 1e6 > ANNOTATE_MAX_MEGAPIXEL:
                    warnings.append('Scala e punti non disegnati (immagine oltre %d megapixel)' % ANNOTATE_MAX_MEGAPIXEL)
                else:
                    try:
                        import annotate
                        cropped = os.path.join(tmp, 'crop.tif')
                        run_tool([exe] + quiet + srcwin + [raw, cropped], env, status,
                                 'Preparazione delle annotazioni', 72, log)
                        status.update('Scala metrica e punti di georeferenziazione', 74)
                        marked = os.path.join(tmp, 'annotated.tif')
                        georef_points = annotate.annotate(cropped, marked, ulx, uly, res, args.scale if in_scale else None)
                        os.remove(cropped)
                        if georef_points['points']:
                            annotate.write_qgis_points(os.path.join(out, name + '.points'), georef_points['points'])
                        else:
                            warnings.append('Immagine troppo piccola per il rettangolo dei punti di controllo')
                        raw, srcwin = marked, []          # gia' ritagliata
                    except ImportError:
                        warnings.append('Pillow assente: scala e punti non disegnati')
            dpi_tags = []
            if in_scale:
                dpi_tags = ['-mo', 'TIFFTAG_XRESOLUTION=%g' % args.dpi, '-mo', 'TIFFTAG_YRESOLUTION=%g' % args.dpi,
                            '-mo', 'TIFFTAG_RESOLUTIONUNIT=2']
            srs_tags = ['-a_srs', 'EPSG:%d' % epsg] if epsg else []
            run_tool([exe] + quiet + srcwin + dpi_tags + srs_tags +
                     ['-a_ullr', '%.6f' % ulx, '%.6f' % uly, '%.6f' % lrx, '%.6f' % lry,
                      '-co', 'COMPRESS=DEFLATE', '-co', 'PREDICTOR=2', '-co', 'TILED=YES',
                      '-co', 'BIGTIFF=IF_SAFER', '-co', 'TFW=YES', raw, tif],
                     env, status, 'Scrittura GeoTIFF', 78, log)
            files.append(name + '.tif')
            if os.path.isfile(os.path.join(out, name + '.tfw')):
                files.append(name + '.tfw')
            if os.path.isfile(os.path.join(out, name + '.points')):
                files.append(name + '.points')
            if w * h / 1e6 <= PNG_MAX_MEGAPIXEL:
                world = ['-co', 'WORLDFILE=YES'] if epsg else []        # name.wld: PNG e JPEG georiferiti in GIS
                run_tool([exe] + quiet + srcwin + world + (['-a_ullr', '%.6f' % ulx, '%.6f' % uly, '%.6f' % lrx, '%.6f' % lry]
                                                           if epsg else []) +
                         ['-of', 'PNG', raw, os.path.join(out, name + '.png')],
                         env, status, 'Scrittura PNG', 85, log)
                files.append(name + '.png')
                if w * h / 1e6 <= JPG_MAX_MEGAPIXEL:
                    try:
                        status.update('Scrittura JPEG', 88)
                        make_jpeg(os.path.join(out, name + '.png'), os.path.join(out, name + '.jpg'),
                                  args.dpi if in_scale else None)
                        files.append(name + '.jpg')
                    except Exception as e:           # Pillow assente o memoria insufficiente: non e' grave
                        warnings.append('JPEG non creato (%s)' % str(e)[:60])
                if epsg:
                    files += write_world_files(out, name, epsg, warnings)
                if in_scale:
                    try:      # PDF con la pagina grande quanto il disegno: stampato al 100% e' in scala
                        run_tool([exe] + quiet + srcwin + ['-of', 'PDF', '-co', 'DPI=%g' % args.dpi,
                                                           raw, os.path.join(out, name + '.pdf')],
                                 env, status, 'Scrittura PDF in scala', 91, log)
                        files.append(name + '.pdf')
                    except RuntimeError as e:
                        warnings.append('PDF non creato (%s)' % str(e)[:80])
            else:
                warnings.append('PNG e PDF non creati (oltre %d megapixel): usa il TIFF' % PNG_MAX_MEGAPIXEL)
            try:
                cropped_small = os.path.join(tmp, 'small_crop.png')
                kk = min(1.0, float(PREVIEW_SIDE) / max(w, h))
                run_tool([exe] + quiet + srcwin + ['-of', 'PNG', '-outsize', str(max(1, int(w * kk))),
                                                   str(max(1, int(h * kk))), raw, cropped_small],
                         env, status, 'Anteprima', 96, log)
                make_preview(cropped_small, os.path.join(out, name + '_preview.jpg'))
                files.append(name + '_preview.jpg')
            except ImportError:
                pass
        else:
            warnings.append('gdal_translate non trovato: TIFF non ritagliato, non compresso e senza coordinate')
            shutil.move(raw, tif)
            files.append(name + '.tif')
            epsg = None
            ulx, uly = xmin, ymax
            lrx, lry = xmin + w / res, ymax - h / res

        meta = {
            'name': name, 'view': preset or 'custom',
            'label': PRESETS[preset][1] if preset else 'Camera personalizzata',
            'source': args.source, 'point_px': point_px,
            'rotation': args.rot, 'position': args.pos, 'framed': bool(framed),
            'clip': [args.clip_start, args.clip_end] if clipping else None,
            'resolution_cm': round(res_cm, 6),
            'scale': args.scale if in_scale else None, 'dpi': args.dpi if in_scale else None,
            'size_px': [w, h], 'size_m': [round(w / res, 4), round(h / res, 4)],
            'paper_cm': [round(w / res * 100 / args.scale, 2), round(h / res * 100 / args.scale, 2)] if in_scale else None,
            'axes': {'right': axis_label(axes[0]), 'up': axis_label(axes[1])},
            'upper_left_m': [round(ulx, 4), round(uly, 4)], 'lower_right_m': [round(lrx, 4), round(lry, 4)],
            'scale_set': abs(float(params.get('scale') or 1.0) - 1.0) > 1e-12,
            'georef': georef_points,
            'epsg': epsg, 'crs_offset': off[:2] if geo else None,
            'files': files, 'created': int(time.time()),
        }
        with open(os.path.join(out, name + '.json'), 'w', encoding='utf-8') as f:
            json.dump(meta, f, indent=2)

        shutil.rmtree(tmp, ignore_errors=True)
        msg = 'Ortofoto pronta: %d x %d pixel, %.2f x %.2f m' % (w, h, w / res, h / res)
        if from_cloud:
            msg += ', %d punti disegnati a %d pixel' % (n_points, point_px)
        if in_scale:
            msg += ', scala 1:%g a %g dpi' % (args.scale, args.dpi)
        if epsg:
            msg += ', georiferita in EPSG:%d' % epsg
        status.update(msg + (' - ' + '; '.join(warnings) if warnings else ''), 100,
                      state='done', files=files, result=name)
    except Exception as e:
        traceback.print_exc()
        shutil.rmtree(tmp, ignore_errors=True)
        if name:                                   # niente file a meta' di uno scatto fallito
            for leftover in glob.glob(os.path.join(out, name + '.*')) + glob.glob(os.path.join(out, name + '_preview.*')):
                try:
                    os.remove(leftover)
                except OSError:
                    pass
        status.update('Errore: %s' % e, state='error')
        sys.exit(1)


if __name__ == '__main__':
    main()
