# Scaling & Orientation Tool - plugin per WebODM
# Copyright (C) 2026 Luca Mandolesi
# SPDX-License-Identifier: AGPL-3.0-or-later
# Rilasciato con la stessa licenza di WebODM (GNU AGPL v3): vedi il file LICENSE.
"""Disegna un'ortofoto direttamente dalla nuvola di punti.

Riceve un file LAS NON compresso gia' portato nel sistema della camera (x' = destra, y' = alto,
z' = verso l'osservatore) e gia' ritagliato: lo prepara PDAL in ortho_worker.py. Ogni punto viene
proiettato sul pixel corrispondente e per ogni pixel resta il punto piu' vicino all'osservatore
(z' massimo), come farebbe uno z-buffer. Serve solo numpy; il LAS viene letto direttamente
(l'intestazione e' fissa e i record hanno lunghezza costante), senza laspy.
"""
import math
import struct

CHUNK = 2000000              # punti elaborati per volta
RGB_OFFSET = 28              # nel formato punto 3 (X Y Z 12, attributi 8, tempo GPS 8, poi R G B a 16 bit)


def read_las_header(path):
    with open(path, 'rb') as f:
        head = f.read(375)
    if head[:4] != b'LASF':
        raise RuntimeError('File LAS non valido')
    fmt = head[104] & 0x3F
    if head[104] & 0xC0:
        raise RuntimeError('LAS compresso: atteso un file non compresso')
    count = struct.unpack_from('<I', head, 107)[0]
    if head[25] >= 4 and len(head) >= 255:           # LAS 1.4: contatore a 64 bit
        count = struct.unpack_from('<Q', head, 247)[0] or count
    maxx, minx, maxy, miny, maxz, minz = struct.unpack_from('<6d', head, 179)
    return {
        'offset': struct.unpack_from('<I', head, 96)[0],
        'format': fmt,
        'reclen': struct.unpack_from('<H', head, 105)[0],
        'count': count,
        'scale': struct.unpack_from('<3d', head, 131),
        'shift': struct.unpack_from('<3d', head, 155),
        'min': (minx, miny, minz), 'max': (maxx, maxy, maxz),
    }


def auto_point_size(width, height, count):
    """Lato in pixel del quadratino disegnato per ogni punto: se i punti sono piu' radi dei
    pixel, punti di un solo pixel lascerebbero l'immagine piena di buchi."""
    spacing = math.sqrt(width * height / float(max(count, 1)))      # distanza media tra i punti, in pixel
    return max(1, min(8, int(spacing * 1.3 + 0.7)))                   # i punti non sono su una griglia regolare


def fill_holes(img, passes=2):
    """Chiude i forellini rimasti tra i punti: ogni pixel vuoto che tocca un pixel disegnato ne
    prende il colore. `img` e' (H, W, 4) e viene modificata sul posto; i bordi crescono di
    al massimo `passes` pixel."""
    for _ in range(passes):
        src = img.copy()
        changed = False
        for tgt, nb in ((img[1:], src[:-1]), (img[:-1], src[1:]), (img[:, 1:], src[:, :-1]), (img[:, :-1], src[:, 1:])):
            m = (tgt[:, :, 3] == 0) & (nb[:, :, 3] == 255)
            if m.any():
                tgt[m] = nb[m]
                changed = True
        if not changed:
            break


def render(las_path, raw_tif, rect, res, point_px, status, p0, p1):
    """Scrive `raw_tif` (RGBA) con la nuvola vista dalla camera.
    rect = (xmin, ymin, xmax, ymax) dell'inquadratura, o None per tutto il contenuto.
    Ritorna (rect, larghezza, altezza, numero di punti, lato del punto in pixel)."""
    import numpy as np
    from PIL import Image

    hd = read_las_header(las_path)
    n = hd['count']
    if n == 0:
        return None
    if hd['format'] not in (3, 5):
        raise RuntimeError('Formato punto LAS %d inatteso (serve il 3, con i colori)' % hd['format'])
    if rect is None:
        rect = (hd['min'][0], hd['min'][1], hd['max'][0], hd['max'][1])
    xmin, ymin, xmax, ymax = rect
    W = max(1, int(round((xmax - xmin) * res)))
    H = max(1, int(round((ymax - ymin) * res)))
    k = int(point_px) if point_px else auto_point_size(W, H, n)
    shifts = [(dy, dx) for dy in range(-(k // 2), k - k // 2) for dx in range(-(k // 2), k - k // 2)]

    data = np.memmap(las_path, dtype=np.uint8, mode='r', offset=hd['offset'], shape=(n, hd['reclen']))
    sx, sy, sz = hd['scale']
    ox, oy, oz = hd['shift']

    def chunks():
        for a in range(0, n, CHUNK):
            b = min(n, a + CHUNK)
            xyz = np.ascontiguousarray(data[a:b, 0:12]).view('<i4').reshape(-1, 3)
            col = np.floor((xyz[:, 0] * sx + ox - xmin) * res).astype(np.int64)
            row = np.floor((ymax - (xyz[:, 1] * sy + oy)) * res).astype(np.int64)
            z = (xyz[:, 2] * sz + oz).astype(np.float32)
            yield a, b, row, col, z

    def targets(row, col):
        for dy, dx in shifts:
            r, c = row + dy, col + dx
            ok = (r >= 0) & (r < H) & (c >= 0) & (c < W)
            yield ok, r[ok] * W + c[ok]

    # 1. per ogni pixel, la quota del punto piu' vicino all'osservatore
    depth = np.full(W * H, -np.inf, dtype=np.float32)
    for a, b, row, col, z in chunks():
        for ok, idx in targets(row, col):
            np.maximum.at(depth, idx, z[ok])
        status.update('Proiezione dei punti: %d%%' % (50.0 * b / n), p0 + (p1 - p0) * 0.5 * b / n)

    # 2. il colore di quel punto
    img = np.zeros((W * H, 4), dtype=np.uint8)
    to8 = None
    for a, b, row, col, z in chunks():
        rgb16 = np.ascontiguousarray(data[a:b, RGB_OFFSET:RGB_OFFSET + 6]).view('<u2').reshape(-1, 3)
        if to8 is None:                              # colori a 16 bit pieni oppure 0-255 in un campo a 16 bit
            to8 = 8 if rgb16.size and int(rgb16.max()) > 255 else 0
        rgb = (rgb16 >> to8).astype(np.uint8)
        for ok, idx in targets(row, col):
            front = z[ok] >= depth[idx]
            sel = idx[front]
            img[sel, 0:3] = rgb[ok][front]
            img[sel, 3] = 255
        status.update('Proiezione dei punti: %d%%' % (50 + 50.0 * b / n), p0 + (p1 - p0) * (0.5 + 0.5 * b / n))

    del depth, data
    img = img.reshape(H, W, 4)
    fill_holes(img)
    Image.MAX_IMAGE_PIXELS = None
    Image.fromarray(img, 'RGBA').save(raw_tif)
    return rect, W, H, n, k
