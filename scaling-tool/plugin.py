# Scaling & Orientation Tool - plugin per WebODM
# Copyright (C) 2026 Luca Mandolesi
# SPDX-License-Identifier: AGPL-3.0-or-later
# Rilasciato con la stessa licenza di WebODM (GNU AGPL v3): vedi il file LICENSE.
import json
import logging
import os
import re
import shutil
import subprocess
import sys
import time

from rest_framework import status
from rest_framework.response import Response

from app.plugins import PluginBase, MountPoint
from app.plugins.views import TaskView

from . import georef
from . import safe_io
from . import transform_math

PLUGIN_DIR = os.path.dirname(os.path.abspath(__file__))

logger = logging.getLogger('app.logger')

SUBDIR = 'scaling_tool'          # dentro assets/ del task
EXPORT_TIMEOUT = 6 * 3600        # un export "running" piu' vecchio di cosi' e' considerato morto
STALE_AFTER = 120                # ...e uno che non scrive piu' lo stato da tanti secondi pure


def work_dir(task):
    return task.assets_path(SUBDIR)


def transform_file(task):
    return os.path.join(work_dir(task), 'transform.json')


def status_file(task):
    return os.path.join(work_dir(task), 'export_status.json')


def can_edit(request, task):
    user = request.user
    return bool(user and user.is_authenticated and user.has_perm('change_project', task.project))


read_json = safe_io.read_json


def write_json(path, data):
    safe_io.write_json(path, data, indent=2)


def pid_alive(pid):
    if os.name != 'posix':
        return True              # os.kill(pid, 0) e' affidabile solo su POSIX; vale il timeout
    try:
        os.kill(int(pid), 0)
        return True
    except PermissionError:
        return True              # esiste, ma appartiene a un altro utente
    except (OSError, ValueError, TypeError):
        return False


class TransformView(TaskView):
    """GET: legge la trasformazione salvata. PUT: la salva. DELETE: la elimina."""

    def get(self, request, pk=None):
        task = self.get_and_check_task(request, pk)
        data = read_json(transform_file(task))
        return Response({'transform': data, 'can_edit': can_edit(request, task)})

    def put(self, request, pk=None):
        task = self.get_and_check_task(request, pk)
        if not can_edit(request, task):
            return Response({'error': 'Permesso negato'}, status=status.HTTP_403_FORBIDDEN)
        try:
            params = transform_math.sanitize(request.data or {})
            matrix = transform_math.matrix4(params)
        except (ValueError, TypeError) as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        record = dict(params)
        record['matrix'] = matrix
        record['refs'] = request.data.get('refs') if isinstance(request.data.get('refs'), dict) else {}
        record['saved_at'] = int(time.time())
        write_json(transform_file(task), record)
        return Response({'transform': record})

    def delete(self, request, pk=None):
        task = self.get_and_check_task(request, pk)
        if not can_edit(request, task):
            return Response({'error': 'Permesso negato'}, status=status.HTTP_403_FORBIDDEN)
        try:
            os.remove(transform_file(task))
        except OSError:
            pass
        return Response({'ok': True})


def georef_file(task):
    return os.path.join(work_dir(task), 'georef.json')


def crs_error(epsg):
    """Motivo per cui `epsg` non va bene come sistema del modello (che e' in metri), oppure None.
    Con GDAL (sempre presente in WebODM) si controlla che esista, sia proiettato e in metri;
    senza, si accetta e se sbagliato sara' PDAL/GDAL a dirlo."""
    if epsg in georef.KNOWN_EPSG:
        return None
    try:
        from osgeo import osr
    except ImportError:
        return None
    srs = osr.SpatialReference()
    try:
        if srs.ImportFromEPSG(int(epsg)) != 0:
            return 'Codice EPSG:%d sconosciuto' % epsg
        if not srs.IsProjected():
            return "EPSG:%d non e' un sistema proiettato (e' in gradi): scegline uno in metri, per esempio UTM" % epsg
        if abs(srs.GetLinearUnits() - 1.0) > 1e-9:
            return "EPSG:%d non e' in metri" % epsg
    except Exception:
        return 'Codice EPSG:%d non utilizzabile' % epsg
    return None


class GeorefView(TaskView):
    """GET: georeferenziazione salvata + elenco dei sistemi di coordinate. PUT {epsg, a, abs_a, b, abs_b}:
    la salva (A, B nel sistema originale del modello; abs_* = [Est, Nord, quota opzionale]). DELETE: la toglie.
    I numeri della trasformazione (matrici, offset) li calcola sempre il server (vedi georef.py)."""

    def result(self, task, record):
        if not record:
            return None
        params = transform_math.sanitize(read_json(transform_file(task)) or {})
        return georef.build(params, georef.sanitize(record))

    def get(self, request, pk=None):
        task = self.get_and_check_task(request, pk)
        record = read_json(georef_file(task))
        try:
            result = self.result(task, record)
        except (ValueError, TypeError):
            result = None
        return Response({'georef': record, 'result': result, 'can_edit': can_edit(request, task),
                         'groups': [{'name': n, 'items': [{'epsg': c, 'name': d} for c, d in items]}
                                    for n, items in georef.EPSG_GROUPS]})

    def put(self, request, pk=None):
        task = self.get_and_check_task(request, pk)
        if not can_edit(request, task):
            return Response({'error': 'Permesso negato'}, status=status.HTTP_403_FORBIDDEN)
        if not os.path.isfile(transform_file(task)):
            return Response({'error': 'Salva prima la trasformazione di scala e orientamento'},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            record = georef.sanitize(request.data)
            problem = crs_error(record['epsg'])
            if problem:
                raise ValueError(problem)
            result = self.result(task, record)
        except (ValueError, TypeError) as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        record['saved_at'] = int(time.time())
        write_json(georef_file(task), record)
        return Response({'georef': record, 'result': result})

    def delete(self, request, pk=None):
        task = self.get_and_check_task(request, pk)
        if not can_edit(request, task):
            return Response({'error': 'Permesso negato'}, status=status.HTTP_403_FORBIDDEN)
        try:
            os.remove(georef_file(task))
        except OSError:
            pass
        return Response({'ok': True})


def export_running(st, now=None):
    """True se lo stato su disco descrive un lavoro (export o ortofoto) ancora vivo.
    Il worker riscrive lo stato almeno ogni pochi secondi: se non lo fa da STALE_AFTER secondi
    e' morto (chiusura di WebODM, arresto del PC...) anche se il file dice ancora "running".
    Su Windows non si puo' chiedere al sistema se un pid esiste senza strumenti esterni."""
    if st.get('state') != 'running':
        return False
    now = time.time() if now is None else now
    started = st.get('started', 0)
    if now - started > EXPORT_TIMEOUT:
        return False
    if not st.get('pid'):
        return now - started < 60                  # appena lanciato: il worker non ha ancora scritto il suo pid
    if now - (st.get('updated') or started) > STALE_AFTER:
        return False
    return pid_alive(st.get('pid'))


# Lancia il worker come "nipote": il processo intermedio termina subito, cosi' il worker
# non resta figlio (ne' zombie) del processo web di WebODM.
SPAWNER = ("import subprocess, sys; "
           "log = open(sys.argv[1], 'ab'); "
           "subprocess.Popen(sys.argv[2:], stdout=log, stderr=subprocess.STDOUT, "
           "stdin=subprocess.DEVNULL, close_fds=True, start_new_session=True)")


class ExportView(TaskView):
    """POST: avvia l'export in un processo separato. GET: stato dell'export."""

    def get(self, request, pk=None):
        task = self.get_and_check_task(request, pk)
        st = read_json(status_file(task)) or {'state': 'idle'}
        if st.get('state') == 'running' and not export_running(st):
            st['state'] = 'error'
            st['message'] = "Il processo di export si e' interrotto inaspettatamente (vedi export.log)"
        base = '/api/projects/%s/tasks/%s/assets/%s/out/' % (task.project.id, task.id, SUBDIR)
        st['files'] = [{'name': f, 'url': base + f} for f in st.get('files', [])]
        st.pop('pid', None)
        return Response(st)

    def post(self, request, pk=None):
        task = self.get_and_check_task(request, pk)
        if not can_edit(request, task):
            return Response({'error': 'Permesso negato'}, status=status.HTTP_403_FORBIDDEN)
        if not os.path.isfile(transform_file(task)):
            return Response({'error': 'Salva prima una trasformazione'},
                            status=status.HTTP_400_BAD_REQUEST)
        if export_running(read_json(status_file(task)) or {}):
            return Response({'error': "Export gia' in corso"}, status=status.HTTP_409_CONFLICT)

        if not start_worker(task, 'export_worker.py', [], status_file(task), 'export.log'):
            return Response({'error': 'Avvio export fallito'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response({'started': True})


def start_worker(task, script, extra_args, status_path, log_name):
    """Avvia uno script del plugin in un processo separato. Ritorna False se non parte."""
    os.makedirs(work_dir(task), exist_ok=True)
    write_json(status_path, {'state': 'running', 'pid': None, 'started': time.time(),
                             'message': 'Avvio...', 'progress': 0, 'files': []})
    try:
        subprocess.run(
            [sys.executable, '-c', SPAWNER, os.path.join(work_dir(task), log_name),
             sys.executable, os.path.join(PLUGIN_DIR, script),
             '--assets', task.assets_path(''), '--plugin-dir', PLUGIN_DIR] + extra_args,
            check=True, timeout=30)
    except Exception as e:
        logger.warning("scaling-tool: impossibile avviare %s: %s" % (script, e))
        write_json(status_path, {'state': 'error', 'message': 'Avvio fallito: %s' % e, 'files': []})
        return False
    return True


def ortho_status_file(task):
    return os.path.join(work_dir(task), 'ortho_status.json')


def camera_args(data):
    """Valida la camera inviata dal pannello e la traduce negli argomenti di ortho_worker.py.
    Solleva ValueError con un messaggio per l'utente. I confronti sono falsi anche per NaN."""
    def number(value):
        try:
            return float(value)
        except (TypeError, ValueError):
            return float('nan')

    def triple(key, limit, what):
        value = data.get(key)
        if not isinstance(value, (list, tuple)) or len(value) != 3:
            raise ValueError('%s: servono tre numeri' % what)
        out = [number(v) for v in value]
        if not all(-limit <= v <= limit for v in out):
            raise ValueError('%s non valida' % what)
        return out

    # "--opt=valore": un valore negativo non deve sembrare un'altra opzione
    args = ['--rot=%r,%r,%r' % tuple(triple('rotation', 3600, 'Rotazione'))]

    has_pos = data.get('position') is not None
    if has_pos:
        args.append('--pos=%r,%r,%r' % tuple(triple('position', 1e6, 'Posizione')))
    width, height = data.get('width'), data.get('height')
    if width is not None or height is not None:
        width, height = number(width), number(height)
        if not has_pos:
            raise ValueError("Per un'inquadratura serve la posizione della camera")
        if not (0.01 <= width <= 100000) or not (0.01 <= height <= 100000):
            raise ValueError('Inquadratura non valida (larghezza e altezza da 0.01 a 100000 m)')
        args += ['--width=%r' % width, '--height=%r' % height]
    # clip start / clip end, come nella camera di Blender: distanze in metri davanti alla camera
    start, end = data.get('clip_start'), data.get('clip_end')
    if data.get('clip') and start is None and end is None:
        start = 0                       # vecchio interruttore "taglia cio' che sta dietro la camera"
    if start is not None or end is not None:
        if not has_pos:
            raise ValueError('Per il clip serve la posizione della camera')
        for key, value in (('clip-start', start), ('clip-end', end)):
            if value is None:
                continue
            value = number(value)
            if not (-1e6 <= value <= 1e6):
                raise ValueError('Clip start/end non validi')
            args.append('--%s=%r' % (key, value))
        if start is not None and end is not None and not (number(end) > number(start)):
            raise ValueError('Clip end deve essere maggiore di clip start')

    if data.get('annotate'):
        args.append('--annotate')

    source = data.get('source') or 'mesh'
    if source not in ('mesh', 'cloud'):
        raise ValueError('Sorgente non valida (mesh oppure nuvola di punti)')
    args.append('--source=' + source)
    if data.get('point_size') not in (None, '', 0):
        size = number(data.get('point_size'))
        if not (1 <= size <= 16) or size != int(size):
            raise ValueError('Dimensione del punto non valida (da 1 a 16 pixel)')
        args.append('--point-size=%d' % size)

    if data.get('scale') is not None or data.get('dpi') is not None:
        scale, dpi = number(data.get('scale')), number(data.get('dpi'))
        if not (0.1 <= scale <= 100000):
            raise ValueError('Scala non valida (1:N con N da 0.1 a 100000)')
        if not (30 <= dpi <= 2400):
            raise ValueError('DPI non validi (da 30 a 2400)')
        args += ['--scale=%r' % scale, '--dpi=%r' % dpi]
    else:
        res_cm = number(data.get('resolution_cm'))
        if not (0.01 <= res_cm <= 1000):
            raise ValueError('Risoluzione non valida (da 0.01 a 1000 cm/pixel)')
        args.append('--res-cm=%r' % res_cm)
    return args


ORTHO_NAME = re.compile(r'^ortho_[A-Za-z0-9_]{1,60}$')


def ortho_meta(task, name):
    """Metadati di un'ortofoto generata, oppure None (il nome arriva dal client: va validato)."""
    if not isinstance(name, str) or not ORTHO_NAME.match(name):
        return None
    meta = read_json(os.path.join(work_dir(task), 'ortho', name + '.json'))
    return meta if isinstance(meta, dict) else None


class OrthoView(TaskView):
    """POST {source, rotation, position, width, height, clip_start, clip_end, point_size,
    resolution_cm | scale + dpi}: scatta un'ortofoto della mesh o della nuvola di punti con la
    camera virtuale (vedi ortho_worker.py).
    GET: stato + ortofoto esistenti. DELETE ?name=...: elimina un'ortofoto generata."""

    def delete(self, request, pk=None):
        task = self.get_and_check_task(request, pk)
        if not can_edit(request, task):
            return Response({'error': 'Permesso negato'}, status=status.HTTP_403_FORBIDDEN)
        name = request.query_params.get('name')
        meta = ortho_meta(task, name)
        if meta is None:
            return Response({'error': 'Ortofoto non trovata'}, status=status.HTTP_404_NOT_FOUND)
        folder = os.path.join(work_dir(task), 'ortho')
        for fname in os.listdir(folder):
            # solo i file di questa ortofoto: <nome>.<est> e <nome>_preview.<est>
            stem = os.path.splitext(fname)[0]
            if stem in (name, name + '_preview'):
                try:
                    os.remove(os.path.join(folder, fname))
                except OSError:
                    pass
        return Response({'ok': True})

    def get(self, request, pk=None):
        task = self.get_and_check_task(request, pk)
        st = read_json(ortho_status_file(task)) or {'state': 'idle'}
        if st.get('state') == 'running' and not export_running(st):
            st['state'] = 'error'
            st['message'] = "La generazione dell'ortofoto si e' interrotta inaspettatamente (vedi ortho.log)"
        st.pop('pid', None)
        st.pop('files', None)

        folder = os.path.join(work_dir(task), 'ortho')
        base = '/api/projects/%s/tasks/%s/assets/%s/ortho/' % (task.project.id, task.id, SUBDIR)
        results = []
        try:
            names = sorted(f for f in os.listdir(folder) if f.endswith('.json'))
        except OSError:
            names = []
        for fname in names:
            meta = read_json(os.path.join(folder, fname))
            if not isinstance(meta, dict):
                continue
            meta['files'] = [{'name': f, 'url': base + f} for f in meta.get('files', [])
                             if os.path.isfile(os.path.join(folder, f))]
            results.append(meta)
        results.sort(key=lambda m: m.get('created', 0), reverse=True)
        st['results'] = results
        return Response(st)

    def post(self, request, pk=None):
        task = self.get_and_check_task(request, pk)
        if not can_edit(request, task):
            return Response({'error': 'Permesso negato'}, status=status.HTTP_403_FORBIDDEN)
        if not os.path.isfile(transform_file(task)):
            return Response({'error': 'Salva prima una trasformazione'},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            args = camera_args(request.data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        if export_running(read_json(ortho_status_file(task)) or {}):
            return Response({'error': "Ortofoto gia' in elaborazione"}, status=status.HTTP_409_CONFLICT)

        if not start_worker(task, 'ortho_worker.py', args, ortho_status_file(task), 'ortho.log'):
            return Response({'error': 'Avvio fallito'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response({'started': True})


def map_state_file(task):
    return os.path.join(work_dir(task), 'map_ortho.json')


def register_orthophoto(task, path):
    """Dice a WebODM che l'ortofoto del task e' cambiata: stessi passi che WebODM esegue a
    fine elaborazione (Task.extract_assets_and_complete). `path` puo' non esistere piu'."""
    from django.contrib.gis.geos import GEOSGeometry
    from app.cogeo import assure_cogeo
    from app.geoutils import get_raster_bounds_wkt

    extent = None
    if os.path.isfile(path):
        try:
            assure_cogeo(path)          # la Mappa legge a riquadri: serve un Cloud Optimized GeoTIFF
        except Exception as e:
            logger.warning('scaling-tool: conversione COG fallita (%s), la Mappa sara\' piu\' lenta' % e)
        wkt = get_raster_bounds_wkt(path)
        if wkt is not None:
            extent = GEOSGeometry(wkt, srid=4326)
    task.orthophoto_extent = extent
    for method in ('update_available_assets_field', 'update_georef_fields', 'update_epsg_field',
                   'update_orthophoto_bands_field', 'update_size', 'clear_task_assets_cache'):
        if hasattr(task, method):       # i nomi cambiano tra versioni di WebODM
            getattr(task, method)()
    task.save()


def restore_map_ortho(task):
    """Rimette l'ortofoto originale del task al posto di quella pubblicata dal plugin."""
    folder = task.assets_path('odm_orthophoto')
    dest = os.path.join(folder, 'odm_orthophoto.tif')
    backup = os.path.join(folder, 'odm_orthophoto.original.tif')
    if os.path.isfile(dest):
        os.remove(dest)
    if os.path.isfile(backup):
        shutil.move(backup, dest)
    register_orthophoto(task, dest)
    os.remove(map_state_file(task))


class MapOrthoView(TaskView):
    """POST {name}: l'ortofoto in pianta `name` diventa l'ortofoto del task mostrata nella Mappa 2D
    (l'originale viene conservata). DELETE: ripristina l'originale. GET: stato."""

    def paths(self, task):
        folder = task.assets_path('odm_orthophoto')
        return (os.path.join(folder, 'odm_orthophoto.tif'),
                os.path.join(folder, 'odm_orthophoto.original.tif'))

    def state(self, task):
        dest, backup = self.paths(task)
        st = read_json(map_state_file(task)) or {}
        return {'published': st.get('name') if os.path.isfile(dest) else None,
                'published_at': st.get('published_at'), 'has_backup': os.path.isfile(backup),
                'map_url': '/map/project/%s/task/%s/' % (task.project.id, task.id)}

    def get(self, request, pk=None):
        return Response(self.state(self.get_and_check_task(request, pk)))

    def post(self, request, pk=None):
        task = self.get_and_check_task(request, pk)
        if not can_edit(request, task):
            return Response({'error': 'Permesso negato'}, status=status.HTTP_403_FORBIDDEN)
        name = request.data.get('name')
        meta = ortho_meta(task, name)
        if meta is None:
            return Response({'error': 'Ortofoto non trovata'}, status=status.HTTP_404_NOT_FOUND)
        if meta.get('view') != 'top':
            return Response({'error': "Solo un'ortofoto in pianta (dall'alto, senza rotazioni) "
                                      "puo' andare sulla Mappa"}, status=status.HTTP_400_BAD_REQUEST)
        src = os.path.join(work_dir(task), 'ortho', name + '.tif')
        if not os.path.isfile(src):
            return Response({'error': 'File TIFF mancante'}, status=status.HTTP_404_NOT_FOUND)

        dest, backup = self.paths(task)
        new = dest + '.new.tif'
        had_dest = os.path.isfile(dest)
        made_backup = False
        try:
            from . import map_ortho
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            map_ortho.make_map_tif(src, new, meta)
            if had_dest:
                if os.path.isfile(backup):
                    os.remove(dest)                 # era gia' una nostra ortofoto: l'originale e' al sicuro
                else:
                    shutil.move(dest, backup)
                    made_backup = True
            shutil.move(new, dest)
            register_orthophoto(task, dest)
        except Exception as e:
            logger.warning('scaling-tool: pubblicazione sulla Mappa fallita: %s' % e)
            try:                                    # rimette tutto com'era
                if os.path.isfile(new):
                    os.remove(new)
                if made_backup:
                    if os.path.isfile(dest):
                        os.remove(dest)
                    shutil.move(backup, dest)
                    register_orthophoto(task, dest)
            except Exception as e2:
                logger.warning('scaling-tool: ripristino fallito: %s' % e2)
            return Response({'error': 'Non riuscito: %s' % e}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        write_json(map_state_file(task), {'name': name, 'published_at': int(time.time())})
        return Response(self.state(task))

    def delete(self, request, pk=None):
        task = self.get_and_check_task(request, pk)
        if not can_edit(request, task):
            return Response({'error': 'Permesso negato'}, status=status.HTTP_403_FORBIDDEN)
        if not (read_json(map_state_file(task)) or {}).get('name'):
            return Response({'error': 'Nessuna ortofoto pubblicata dal plugin'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            restore_map_ortho(task)
        except Exception as e:
            logger.warning('scaling-tool: ripristino ortofoto fallito: %s' % e)
            return Response({'error': 'Ripristino non riuscito: %s' % e},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(self.state(task))


JS_FILES = ('i18n.js', 'main.js', 'georef.js')   # i18n.js (generato da i18n/) prima di tutti; georef.js e' un modulo di main.js


def asset_version():
    """<versione del manifest>.<mtime piu' recente dei file JS>, letti da disco (non serve riavviare)."""
    try:
        with open(os.path.join(PLUGIN_DIR, 'manifest.json'), encoding='utf-8') as f:
            version = json.load(f).get('version', '0')
        return '%s.%d' % (version, max(os.path.getmtime(os.path.join(PLUGIN_DIR, 'public', n)) for n in JS_FILES))
    except (OSError, ValueError):
        return '0'


class Plugin(PluginBase):
    def include_js_files(self):
        # Chiamato a ogni pagina: la query cambia a ogni deploy, cosi' il browser
        # non usa mai un main.js in cache. La query e' ignorata dal routing di WebODM.
        v = asset_version()
        return [n + '?v=' + v for n in JS_FILES]

    def get_manifest(self):
        # WebODM lo tiene in memoria dal primo accesso: lo rileggiamo, cosi' la pagina
        # Plugin mostra la versione installata anche dopo un aggiornamento senza riavvio
        self.manifest = None
        return super().get_manifest()

    def disable(self):
        """Disabilitando il plugin la Mappa 2D torna com'era: senza il plugin nessuno potrebbe piu'
        ripristinare le ortofoto originali. Errori su un task non fermano gli altri."""
        from app.models import Task
        for task in Task.objects.all().iterator():
            try:
                if (read_json(map_state_file(task)) or {}).get('name'):
                    restore_map_ortho(task)
                    logger.info('scaling-tool: ortofoto originale ripristinata nel task %s' % task.id)
            except Exception as e:
                logger.warning('scaling-tool: ripristino del task %s non riuscito: %s' % (task.id, e))

    def api_mount_points(self):
        return [
            MountPoint('task/(?P<pk>[^/.]+)/transform$', TransformView.as_view()),
            MountPoint('task/(?P<pk>[^/.]+)/georef$', GeorefView.as_view()),
            MountPoint('task/(?P<pk>[^/.]+)/export$', ExportView.as_view()),
            MountPoint('task/(?P<pk>[^/.]+)/ortho$', OrthoView.as_view()),
            MountPoint('task/(?P<pk>[^/.]+)/map-ortho$', MapOrthoView.as_view()),
        ]
