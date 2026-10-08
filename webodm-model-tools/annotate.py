# Scaling & Orientation Tool - plugin per WebODM
# Copyright (C) 2026 Luca Mandolesi
# SPDX-License-Identifier: AGPL-3.0-or-later
# Rilasciato con la stessa licenza di WebODM (GNU AGPL v3): vedi il file LICENSE.
"""Disegna sull'ortofoto la scala metrica e i punti di georeferenziazione.

- un rettangolo con i 4 vertici a coordinate "tonde" (multipli di un passo: 1 m, 0.5 m, ...),
  ognuno con un mirino e le sue coordinate scritte accanto: sono punti di controllo pronti per
  il georeferenziatore di QGIS;
- una barra di scala in basso a sinistra.

Le coordinate sono quelle del piano dell'immagine, in metri: le stesse del GeoTIFF e del file .tfw
(X verso destra, Y verso l'alto). Serve solo Pillow.
"""
import math

STEPS = (1000, 500, 200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01, 0.005, 0.002, 0.001)
RED = (214, 28, 28, 255)
BLACK = (0, 0, 0, 255)
WHITE = (255, 255, 255, 255)


def nice_floor(value):
    """Il piu' grande numero della serie 1-2-5 x 10^k che non supera `value`."""
    if value <= 0:
        return 0.0
    k = math.floor(math.log10(value))
    for m in (5, 2, 1):
        if m * 10 ** k <= value * (1 + 1e-9):
            return m * 10 ** k
    return 10 ** k


def control_rectangle(xmin, xmax, ymin, ymax):
    """Rettangolo con i vertici a multipli di un passo "tondo", dentro l'area data.
    Tra i passi possibili sceglie il piu' grande (coordinate piu' tonde) il cui rettangolo copre
    almeno l'85% dell'area del migliore. Ritorna (x0, y0, x1, y1, passo) oppure None."""
    found = []
    for step in STEPS:
        x0, x1 = math.ceil(xmin / step - 1e-9) * step, math.floor(xmax / step + 1e-9) * step
        y0, y1 = math.ceil(ymin / step - 1e-9) * step, math.floor(ymax / step + 1e-9) * step
        if x1 - x0 > step * 1e-6 and y1 - y0 > step * 1e-6:
            found.append(((x1 - x0) * (y1 - y0), (x0, y0, x1, y1, step)))
    if not found:
        return None
    best = max(area for area, _ in found)
    return next(rect for area, rect in found if area >= 0.85 * best)        # STEPS e' in ordine decrescente


def fmt(value, step=1.0):
    """Numero con i decimali che servono per il passo usato (almeno 2)."""
    decimals = max(2, int(math.ceil(-math.log10(step) - 1e-9))) if step < 1 else 2
    text = '%.*f' % (decimals, value)
    return '0.' + '0' * decimals if float(text) == 0 else text       # mai "-0.00"


def load_font(size):
    from PIL import ImageFont
    for name in ('DejaVuSans.ttf', 'arial.ttf', 'LiberationSans-Regular.ttf'):
        try:
            return ImageFont.truetype(name, size)
        except (OSError, IOError):
            pass
    try:
        return ImageFont.load_default(size)          # Pillow >= 10.1: carattere scalabile incluso
    except TypeError:
        return ImageFont.load_default()


def annotate(src, dst, ulx, uly, res, scale=None):
    """Legge `src`, disegna scala e punti, scrive `dst` (TIFF RGBA).
    ulx, uly = coordinate in metri dell'angolo in alto a sinistra; res = pixel per metro.
    Ritorna {'points': [...], 'rectangle': ..., 'scalebar_m': ...} per i metadati."""
    from PIL import Image, ImageDraw
    Image.MAX_IMAGE_PIXELS = None
    with Image.open(src) as im:
        im = im.convert('RGBA')
    W, H = im.size
    draw = ImageDraw.Draw(im)
    u = max(11, int(round(min(W, H) / 60.0)))            # altezza del testo in pixel: tutto e' proporzionato a questa
    font = load_font(u)
    lw = max(1, u // 7)

    def to_px(x, y):
        return (x - ulx) * res, (uly - y) * res

    def text_size(text):
        box = draw.textbbox((0, 0), text, font=font)
        return box[2] - box[0], box[3] - box[1], box[1]

    def label(text, x, y, anchor='l'):
        """Testo nero su fondino bianco; (x, y) = angolo alto, a sinistra ('l'), destra ('r') o centro ('c')."""
        tw, th, off = text_size(text)
        pad = max(2, u // 4)
        if anchor == 'r':
            x -= tw
        elif anchor == 'c':
            x -= tw / 2.0
        x = min(max(x, pad), W - tw - pad)
        y = min(max(y, pad), H - th - pad)
        draw.rectangle([x - pad, y - pad, x + tw + pad, y + th + pad], fill=WHITE)
        draw.text((x, y - off), text, font=font, fill=BLACK)
        return tw, th

    info = {'points': [], 'rectangle': None, 'scalebar_m': None}

    # ---- rettangolo di controllo, rientrato dal bordo quanto basta per le scritte
    margin = int(2.4 * u)
    rect = control_rectangle(ulx + margin / res, ulx + (W - margin) / res,
                             uly - (H - margin) / res, uly - margin / res)
    if rect:
        x0, y0, x1, y1, step = rect
        (pl, pt), (pr, pb) = to_px(x0, y1), to_px(x1, y0)
        draw.rectangle([pl, pt, pr, pb], outline=WHITE, width=lw + 2)
        draw.rectangle([pl, pt, pr, pb], outline=RED, width=lw)
        corners = (('A', x0, y1, 'l', -1), ('B', x1, y1, 'r', -1), ('C', x1, y0, 'r', 1), ('D', x0, y0, 'l', 1))
        r = 0.55 * u
        for name, x, y, anchor, side in corners:
            px, py = to_px(x, y)
            for color, width in ((WHITE, lw + 2), (RED, lw)):       # mirino: cerchio + croce, con alone bianco
                draw.ellipse([px - r, py - r, px + r, py + r], outline=color, width=width)
                draw.line([px - 1.6 * r, py, px + 1.6 * r, py], fill=color, width=width)
                draw.line([px, py - 1.6 * r, px, py + 1.6 * r], fill=color, width=width)
            text = '%s  X=%s  Y=%s' % (name, fmt(x, step), fmt(y, step))
            tw, th, _ = text_size(text)
            # scritte nella fascia esterna al rettangolo: sopra per A e B, sotto per C e D
            label(text, px + (0.4 * u if anchor == 'l' else -0.4 * u), py - 1.25 * u - th if side < 0 else py + 1.0 * u, anchor)
            info['points'].append({'name': name, 'x': round(x, 6), 'y': round(y, 6),
                                   'px': round(px, 3), 'py': round(py, 3)})
        # lunghezza dei lati
        top = '%s m' % fmt(x1 - x0, step)
        if text_size(top)[0] < 0.3 * (pr - pl):
            label(top, (pl + pr) / 2.0, pt + 0.5 * u, 'c')
        label('%s m' % fmt(y1 - y0, step), pl + 0.6 * u, (pt + pb) / 2.0, 'l')
        info['rectangle'] = {'x0': round(x0, 6), 'y0': round(y0, 6), 'x1': round(x1, 6), 'y1': round(y1, 6), 'step': step}
        left, bottom = pl + 1.2 * u, pb - 1.2 * u               # la scala sta dentro il rettangolo, in basso a sinistra
    else:
        left, bottom = 1.2 * u, H - 1.2 * u

    # ---- barra di scala
    length = nice_floor(0.25 * W / res)
    if length > 0 and length * res >= 6 * u * 0.5:
        first = int(round(length / 10 ** math.floor(math.log10(length))))
        parts = 4 if first == 2 else 5
        bar_w, bar_h, pad = length * res, 0.45 * u, 0.7 * u
        title = 'Scala 1:%g' % scale if scale else 'Scala metrica'
        end_text = '%g m' % length
        tw_t, th_t, off_t = text_size(title)
        tw_e, th_e, off_e = text_size(end_text)
        box_w = max(bar_w + tw_e / 2.0, tw_t) + 2 * pad
        box_h = th_t + bar_h + th_e + 2 * pad + 0.8 * u
        bx0, by1 = left, bottom
        by0 = by1 - box_h
        draw.rectangle([bx0, by0, bx0 + box_w, by1], fill=WHITE, outline=BLACK, width=max(1, lw // 2))
        draw.text((bx0 + pad, by0 + pad - off_t), title, font=font, fill=BLACK)
        x_bar, y_bar = bx0 + pad, by0 + pad + th_t + 0.4 * u
        seg = bar_w / parts
        for i in range(parts):
            draw.rectangle([x_bar + i * seg, y_bar, x_bar + (i + 1) * seg, y_bar + bar_h],
                           fill=BLACK if i % 2 == 0 else WHITE, outline=BLACK, width=max(1, lw // 2))
        y_txt = y_bar + bar_h + 0.4 * u
        draw.text((x_bar, y_txt - off_e), '0', font=font, fill=BLACK)
        draw.text((x_bar + bar_w - tw_e / 2.0, y_txt - off_e), end_text, font=font, fill=BLACK)
        info['scalebar_m'] = length

    im.save(dst)
    return info


def write_qgis_points(path, points):
    """File di punti di controllo per il georeferenziatore di QGIS (File > Carica punti GCP).
    QGIS usa la riga dell'immagine col segno negativo."""
    with open(path, 'w', encoding='utf-8') as f:
        f.write('mapX,mapY,sourceX,sourceY,enable,dX,dY,residual\n')
        for p in points:
            f.write('%.6f,%.6f,%.3f,%.3f,1,0,0,0\n' % (p['x'], p['y'], p['px'], -p['py']))
