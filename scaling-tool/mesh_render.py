# Scaling & Orientation Tool - plugin per WebODM
# Copyright (C) 2026 Luca Mandolesi
# SPDX-License-Identifier: AGPL-3.0-or-later
# Rilasciato con la stessa licenza di WebODM (GNU AGPL v3): vedi il file LICENSE.
"""Disegna un'ortofoto dalla mesh texturizzata senza odm_orthophoto (numpy + Pillow).

Serve dove odm_orthophoto non esiste (WebODM in Docker). Riceve l'OBJ gia' portato nel sistema
della camera (x' = destra, y' = alto, z' = verso l'osservatore) e gia' ritagliato da
`frame_clip_obj`: rasterizza ogni triangolo con uno z-buffer (vince il punto piu' vicino
all'osservatore, z' massimo) e legge il colore dalla texture. Stessa convenzione di
cloud_render: colonna 0 = x minima, riga 0 = y massima.

Come cloud_render lavora in due passate: prima la profondita' di ogni pixel, poi il colore dei
frammenti che stanno in cima. I triangoli sono raggruppati per dimensione sullo schermo e
rasterizzati a blocchi con numpy, quindi non c'e' un ciclo Python per triangolo (tranne per
i pochi triangoli molto grandi).
"""
import os

GRID_MAX = 64                # oltre questo lato (in pixel) il triangolo si rasterizza da solo
BATCH = 2000000              # frammenti candidati per blocco
EPS = 1e-4                   # tolleranza baricentrica: niente fessure tra triangoli vicini
GREY = (190, 190, 190)       # faccia senza texture


def _int(tok, count):
    i = int(tok)
    return i - 1 if i > 0 else count + i


def load_obj(path):
    """Ritorna (vertici (n,3), uv (m,2), facce (f,3), facce_uv (f,3) o -1, materiale per faccia, {materiale: file texture})."""
    import numpy as np
    verts, uvs, fv, ft, fm = [], [], [], [], []
    mats, mtllibs, cur = {}, [], -1
    with open(path, 'r', errors='replace') as f:
        for line in f:
            c = line[:2]
            if c == 'v ':
                verts.append(line.split()[1:4])
            elif c == 'vt':
                uvs.append(line.split()[1:3])
            elif c == 'f ':
                vi, ti = [], []
                nv, nt = len(verts), len(uvs)
                for tok in line.split()[1:]:
                    a = tok.split('/')
                    vi.append(_int(a[0], nv))
                    ti.append(_int(a[1], nt) if len(a) > 1 and a[1] else -1)
                for k in range(1, len(vi) - 1):             # i poligoni diventano ventagli di triangoli
                    fv.append((vi[0], vi[k], vi[k + 1]))
                    ft.append((ti[0], ti[k], ti[k + 1]))
                    fm.append(cur)
            elif line.startswith('usemtl'):
                name = line.split(None, 1)[1].strip() if len(line.split(None, 1)) > 1 else ''
                cur = mats.setdefault(name, len(mats))
            elif line.startswith('mtllib'):
                mtllibs.append(line.split(None, 1)[1].strip())
    folder = os.path.dirname(path)
    files = {}                                              # indice materiale -> percorso texture
    for lib in mtllibs:
        mp = os.path.join(folder, lib)
        if not os.path.isfile(mp):
            continue
        name = None
        with open(mp, 'r', errors='replace') as f:
            for line in f:
                low = line.strip()
                if low.startswith('newmtl'):
                    name = low.split(None, 1)[1].strip() if len(low.split(None, 1)) > 1 else ''
                elif low.lower().startswith('map_kd') and name in mats:
                    tex = low.split(None, 1)[1].strip().split()[-1] if len(low.split(None, 1)) > 1 else ''
                    files[mats[name]] = os.path.join(folder, tex)
    V = np.array(verts, dtype=np.float64).reshape(-1, 3)
    UV = np.array(uvs, dtype=np.float64).reshape(-1, 2)
    return (V, UV, np.array(fv, dtype=np.int64).reshape(-1, 3), np.array(ft, dtype=np.int64).reshape(-1, 3),
            np.array(fm, dtype=np.int64), files)


def _grid(np, ids, lo_x, lo_y, hi_x, hi_y, wid, hei, X, Y, Z, F, W):
    """Frammenti dei triangoli `ids` su una griglia (n, hei, wid) a partire da (lo_x, lo_y).
    Ritorna (tri, idx, z, l0, l1, l2) dei soli pixel il cui centro e' dentro il triangolo."""
    a = F[ids]
    x0, x1, x2 = X[a[:, 0]], X[a[:, 1]], X[a[:, 2]]
    y0, y1, y2 = Y[a[:, 0]], Y[a[:, 1]], Y[a[:, 2]]
    z0, z1, z2 = Z[a[:, 0]], Z[a[:, 1]], Z[a[:, 2]]
    det = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0)
    inv = 1.0 / det
    c = lambda v: v[:, None, None]
    px = (lo_x[:, None] + np.arange(wid)[None, :] + 0.5)[:, None, :]
    py = (lo_y[:, None] + np.arange(hei)[None, :] + 0.5)[:, :, None]
    l1 = ((px - c(x0)) * c(y2 - y0) - c(x2 - x0) * (py - c(y0))) * c(inv)
    l2 = (c(x1 - x0) * (py - c(y0)) - (px - c(x0)) * c(y1 - y0)) * c(inv)
    l0 = 1.0 - l1 - l2
    # la griglia puo' essere piu' larga del riquadro (clampato all'inquadratura): oltre non si disegna
    in_box = (px <= (hi_x[:, None] + 0.5)[:, None, :]) & (py <= (hi_y[:, None] + 0.5)[:, :, None])
    t, j, i = np.nonzero((l0 >= -EPS) & (l1 >= -EPS) & (l2 >= -EPS) & in_box)
    l0, l1, l2 = l0[t, j, i], l1[t, j, i], l2[t, j, i]
    idx = (lo_y[t] + j) * W + lo_x[t] + i
    z = l0 * z0[t] + l1 * z1[t] + l2 * z2[t]
    return ids[t], idx, z, l0, l1, l2


def _fragments(np, sel, F, X, Y, Z, W, H):
    """Genera i frammenti dei triangoli `sel` (id di faccia), a blocchi."""
    a = F[sel]
    xs, ys = X[a], Y[a]
    det = (xs[:, 1] - xs[:, 0]) * (ys[:, 2] - ys[:, 0]) - (xs[:, 2] - xs[:, 0]) * (ys[:, 1] - ys[:, 0])
    ok = np.abs(det) > 1e-12                                # di taglio (visti di lato) non si vedono
    lo_x = np.ceil(xs.min(1) - 0.5).astype(np.int64)
    hi_x = np.floor(xs.max(1) - 0.5).astype(np.int64)
    lo_y = np.ceil(ys.min(1) - 0.5).astype(np.int64)
    hi_y = np.floor(ys.max(1) - 0.5).astype(np.int64)
    tiny = ok & ((hi_x < lo_x) | (hi_y < lo_y))             # nessun centro di pixel dentro: disegna il pixel del baricentro
    if tiny.any():
        t = sel[tiny]
        cx = np.floor(xs[tiny].mean(1)).astype(np.int64)
        cy = np.floor(ys[tiny].mean(1)).astype(np.int64)
        keep = (cx >= 0) & (cx < W) & (cy >= 0) & (cy < H)
        if keep.any():
            third = np.full(int(keep.sum()), 1.0 / 3.0)
            zz = (Z[F[t[keep]]]).mean(1)
            yield t[keep], cy[keep] * W + cx[keep], zz, third, third, third
    lo_x, lo_y = np.maximum(lo_x, 0), np.maximum(lo_y, 0)
    hi_x, hi_y = np.minimum(hi_x, W - 1), np.minimum(hi_y, H - 1)
    ok &= ~tiny & (hi_x >= lo_x) & (hi_y >= lo_y)
    if not ok.any():
        return
    wid, hei = hi_x - lo_x + 1, hi_y - lo_y + 1
    side = np.maximum(wid, hei)
    bucket = np.where(side > GRID_MAX, 0, 1 << np.ceil(np.log2(np.maximum(side, 2))).astype(np.int64))
    for s in np.unique(bucket[ok]):
        m = np.nonzero(ok & (bucket == s))[0]
        if s == 0:                                          # triangoli grandi: uno alla volta
            for k in m:
                yield _grid(np, sel[k:k + 1], lo_x[k:k + 1], lo_y[k:k + 1], hi_x[k:k + 1], hi_y[k:k + 1], int(wid[k]), int(hei[k]), X, Y, Z, F, W)
            continue
        step = max(1, BATCH // int(s * s))
        for b in range(0, len(m), step):
            q = m[b:b + step]
            yield _grid(np, sel[q], lo_x[q], lo_y[q], hi_x[q], hi_y[q], int(s), int(s), X, Y, Z, F, W)


def render(obj_path, raw_tif, rect, res, status, p0, p1):
    """Scrive `raw_tif` (RGBA) con la mesh vista dalla camera.
    rect = (xmin, ymin, xmax, ymax) dell'inquadratura, o None per tutto il contenuto.
    Ritorna (rect, larghezza, altezza, numero di triangoli) oppure None se non c'e' niente."""
    import numpy as np
    from PIL import Image
    Image.MAX_IMAGE_PIXELS = None

    status.update('Lettura della mesh', p0)
    V, UV, F, FT, FM, tex_files = load_obj(obj_path)
    if len(F) == 0:
        return None
    used = np.unique(F)
    if rect is None:
        rect = (V[used, 0].min(), V[used, 1].min(), V[used, 0].max(), V[used, 1].max())
    xmin, ymin, xmax, ymax = rect
    W = max(1, int(round((xmax - xmin) * res)))
    H = max(1, int(round((ymax - ymin) * res)))
    X = (V[:, 0] - xmin) * res
    Y = (ymax - V[:, 1]) * res
    Z = V[:, 2]
    n = len(F)

    # 1. per ogni pixel, la quota del frammento piu' vicino all'osservatore
    depth = np.full(W * H, -np.inf, dtype=np.float32)
    done = 0
    chunk = 400000
    for a in range(0, n, chunk):
        sel = np.arange(a, min(n, a + chunk))
        for _t, idx, z, _l0, _l1, _l2 in _fragments(np, sel, F, X, Y, Z, W, H):
            np.maximum.at(depth, idx, z.astype(np.float32))
        done = min(n, a + chunk)
        status.update('Profondita\': %d%%' % (50.0 * done / n), p0 + (p1 - p0) * 0.5 * done / n)

    # 2. il colore: texture per texture, solo dove il frammento e' in cima
    img = np.zeros((W * H, 4), dtype=np.uint8)
    groups = sorted(set(FM.tolist()))
    done = 0
    for g in groups:
        ids_all = np.nonzero(FM == g)[0]
        tex = None
        path = tex_files.get(g)
        if path and os.path.isfile(path):
            try:
                tex = np.asarray(Image.open(path).convert('RGB'))
            except Exception:
                tex = None
        for a in range(0, len(ids_all), chunk):
            sel = ids_all[a:a + chunk]
            for t, idx, z, l0, l1, l2 in _fragments(np, sel, F, X, Y, Z, W, H):
                front = z.astype(np.float32) >= depth[idx]
                if not front.any():
                    continue
                t, idx, l0, l1, l2 = t[front], idx[front], l0[front], l1[front], l2[front]
                ft = FT[t]
                if tex is not None and (ft >= 0).all():
                    u = l0 * UV[ft[:, 0], 0] + l1 * UV[ft[:, 1], 0] + l2 * UV[ft[:, 2], 0]
                    v = l0 * UV[ft[:, 0], 1] + l1 * UV[ft[:, 1], 1] + l2 * UV[ft[:, 2], 1]
                    th, tw = tex.shape[:2]
                    tx = np.clip((u * (tw - 1)).round().astype(np.int64), 0, tw - 1)
                    ty = np.clip(((1.0 - v) * (th - 1)).round().astype(np.int64), 0, th - 1)
                    img[idx, 0:3] = tex[ty, tx]
                else:
                    img[idx, 0:3] = GREY
                img[idx, 3] = 255
            done += len(sel)
            status.update('Colori dalla texture: %d%%' % (50 + 50.0 * done / n), p0 + (p1 - p0) * (0.5 + 0.5 * done / n))
        del tex

    del depth
    img = img.reshape(H, W, 4)
    from cloud_render import fill_holes
    fill_holes(img, 1)                                       # fessure di un pixel tra triangoli
    Image.fromarray(img, 'RGBA').save(raw_tif)
    return rect, W, H, n
