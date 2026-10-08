# Scaling & Orientation Tool - plugin per WebODM
# Copyright (C) 2026 Luca Mandolesi
# SPDX-License-Identifier: AGPL-3.0-or-later
# Rilasciato con la stessa licenza di WebODM (GNU AGPL v3): vedi il file LICENSE.
"""Georeferenziazione del modello gia' scalato e orientato (pura Python, nessuna dipendenza).

L'utente indica il punto A del modello (default: l'origine) con le sue coordinate assolute
(Est, Nord, quota opzionale) in un sistema EPSG proiettato in metri, e facoltativamente un secondo
punto B con le sue coordinate: la direzione A->B fissa l'orientamento (rotazione attorno a Z).
I punti sono memorizzati nel sistema ORIGINALE della nuvola, come tutti gli altri punti del plugin,
quindi la georeferenziazione segue scala, asse Z e origine anche se vengono cambiati dopo.

    assoluto = scala * Rg * (p - A) + t              (Rg = Rz(phi) * R, R come in transform_math)

Il modello e' piccolo e le coordinate assolute enormi (UTM: milioni di metri): visualizzatore e
renderizzatori lavorano nel sistema "vista" = assoluto - offset, con offset = (Est_A, Nord_A, Z_A),
e solo alla scrittura dei file si riaggiunge l'offset. La stessa formula e' in public/georef.js.
"""
import math
import os

try:
    from . import transform_math as tm          # importato come parte del plugin
except ImportError:
    import transform_math as tm                 # importato dai worker (cartella del plugin nel path)

# Sistemi proiettati in metri piu' usati (EPSG, descrizione), a gruppi. WebODM accetta qualunque
# codice EPSG: per gli altri c'e' il campo libero. Solo sistemi in metri: il modello e' metrico.
EPSG_GROUPS = [
    ('Italia', [
        (6707, 'RDN2008 / UTM 32N'),
        (6708, 'RDN2008 / UTM 33N'),
        (6709, 'RDN2008 / UTM 34N'),
        (7791, 'RDN2008 / TM32'),
        (7792, 'RDN2008 / TM33'),
        (7793, 'RDN2008 / TM34'),
        (6875, 'RDN2008 / Italy zone (E-N)'),
        (3003, 'Monte Mario / Italy zone 1 (Gauss-Boaga Ovest)'),
        (3004, 'Monte Mario / Italy zone 2 (Gauss-Boaga Est)'),
        (23032, 'ED50 / UTM 32N'),
        (23033, 'ED50 / UTM 33N'),
    ]),
    ('Europa', [
        (25832, 'ETRS89 / UTM 32N'),
        (25833, 'ETRS89 / UTM 33N'),
        (25834, 'ETRS89 / UTM 34N'),
        (25830, 'ETRS89 / UTM 30N'),
        (25831, 'ETRS89 / UTM 31N'),
        (3035, 'ETRS89 / LAEA Europe'),
        (2154, 'RGF93 / Lambert-93 (Francia)'),
        (27700, 'OSGB36 / British National Grid'),
        (31467, 'DHDN / Gauss-Kruger 3 (Germania)'),
        (2056, 'CH1903+ / LV95 (Svizzera)'),
        (31256, 'MGI / Austria GK East'),
    ]),
    ('Mondo (UTM WGS84)', [
        (32630, 'WGS 84 / UTM 30N'),
        (32631, 'WGS 84 / UTM 31N'),
        (32632, 'WGS 84 / UTM 32N'),
        (32633, 'WGS 84 / UTM 33N'),
        (32634, 'WGS 84 / UTM 34N'),
        (32635, 'WGS 84 / UTM 35N'),
        (32636, 'WGS 84 / UTM 36N'),
        (32732, 'WGS 84 / UTM 32S'),
        (3857, 'WGS 84 / Pseudo-Mercator (web)'),
    ]),
]
KNOWN_EPSG = set(code for _, items in EPSG_GROUPS for code, _ in items)
EPSG_RANGE = (2000, 99999)             # codici EPSG proiettati plausibili; il controllo vero e' crs_error()
MAX_COORD = 1e8                        # nessun sistema in metri esce da qui
MIN_BASELINE = 1e-6                    # metri: A e B piu' vicini di cosi' coincidono
ASSUMED_VERTICAL = 0.001               # direzione A->B quasi verticale (|orizzontale| < 0.1 % del totale)


def _num(value, name):
    try:
        x = float(value)
    except (TypeError, ValueError):
        raise ValueError('%s: serve un numero' % name)
    if not math.isfinite(x) or abs(x) > MAX_COORD:
        raise ValueError('%s non valido' % name)
    return x


def _abs_point(value, name):
    """[Est, Nord] o [Est, Nord, quota]: la quota puo' mancare (None, '' o assente)."""
    if not isinstance(value, (list, tuple)) or len(value) < 2:
        raise ValueError('%s: servono almeno Est e Nord' % name)
    z = value[2] if len(value) > 2 else None
    z = None if z is None or (isinstance(z, str) and not z.strip()) else _num(z, name + ' (quota)')
    return [_num(value[0], name + ' (Est)'), _num(value[1], name + ' (Nord)'), z]


def sanitize(data):
    """Valida i dati inviati dal client. Ritorna il dizionario che viene salvato su disco."""
    if not isinstance(data, dict):
        raise ValueError('Dati non validi')
    try:
        epsg = int(data.get('epsg'))
    except (TypeError, ValueError):
        raise ValueError('Scegli il sistema di coordinate (codice EPSG)')
    if not (EPSG_RANGE[0] <= epsg <= EPSG_RANGE[1]):
        raise ValueError('Codice EPSG non valido')
    out = {'epsg': epsg, 'a': tm._vec3(data.get('a'), 'Punto A'), 'abs_a': _abs_point(data.get('abs_a'), 'Punto A'),
           'b': None, 'abs_b': None}
    if out['a'] is None:
        raise ValueError('Manca il punto A del modello')
    if data.get('b') is not None:
        out['b'] = tm._vec3(data.get('b'), 'Punto B')
        out['abs_b'] = _abs_point(data.get('abs_b'), 'Punto B')
    return out


def _rows_matrix(rows, trans):
    m = [[r[0], r[1], r[2], t] for r, t in zip(rows, trans)]
    m.append([0.0, 0.0, 0.0, 1.0])
    return m


def build(params, geo):
    """Georeferenziazione completa, dati i parametri di scala/orientamento (transform.json) e `geo`
    (risultato di sanitize). Ritorna un dizionario:
      matrix_abs   4x4 modello originale -> coordinate assolute (liste di righe)
      matrix_view  4x4 modello originale -> coordinate "vista" (assoluto - offset)
      offset       [Est, Nord, quota] da sommare alle coordinate vista per avere le assolute
      rotation_deg rotazione attorno a Z applicata all'orientamento attuale (positiva = antioraria)
      checks       confronti tra le misure del modello e quelle dei punti assoluti
      warnings     incongruenze tra modello e coordinate (da confermare)
      notes        osservazioni informative
    """
    s, R, o = tm.build(params)
    A = geo['a']
    abs_a = geo['abs_a']
    warnings, notes, checks = [], [], {}
    phi = 0.0

    if geo.get('b'):
        d = [geo['b'][i] - A[i] for i in range(3)]
        local = [s * sum(R[i][j] * d[j] for j in range(3)) for i in range(3)]       # A->B nel sistema attuale
        dx_abs = geo['abs_b'][0] - abs_a[0]
        dy_abs = geo['abs_b'][1] - abs_a[1]
        h_local = math.hypot(local[0], local[1])
        h_abs = math.hypot(dx_abs, dy_abs)
        if h_abs < MIN_BASELINE:
            raise ValueError('Le coordinate di A e B coincidono: non si puo\' dedurre un orientamento')
        if h_local < MIN_BASELINE or h_local < ASSUMED_VERTICAL * math.sqrt(sum(x * x for x in local)):
            raise ValueError('I punti A e B del modello sono sulla stessa verticale: scegline uno spostato in orizzontale')
        phi = math.atan2(dy_abs, dx_abs) - math.atan2(local[1], local[0])
        checks['distance_model'] = h_local
        checks['distance_abs'] = h_abs
        checks['ratio'] = h_abs / h_local
        if abs(checks['ratio'] - 1.0) > 0.005:
            warnings.append("La distanza orizzontale tra A e B nel modello (%.3f m) e' diversa da quella delle "
                            "coordinate (%.3f m): %.2f %%. Controlla la scala del modello o le coordinate."
                            % (h_local, h_abs, (checks['ratio'] - 1.0) * 100))
        if abs_a[2] is not None and geo['abs_b'][2] is not None:
            checks['dz_model'] = local[2]
            checks['dz_abs'] = geo['abs_b'][2] - abs_a[2]
            if abs(checks['dz_model'] - checks['dz_abs']) > max(0.05, 0.005 * h_abs):
                warnings.append("Dislivello tra A e B: %.3f m nel modello, %.3f m nelle coordinate."
                                % (checks['dz_model'], checks['dz_abs']))
        phi = (phi + math.pi) % (2 * math.pi) - math.pi
    c, sn = math.cos(phi), math.sin(phi)
    ex, ey, ez = R
    ex_g = [c * ex[i] - sn * ey[i] for i in range(3)]          # Rz(phi) * R: ruota il piano XY, Z resta
    ey_g = [sn * ex[i] + c * ey[i] for i in range(3)]
    rows = [[s * v for v in ex_g], [s * v for v in ey_g], [s * v for v in ez]]

    dot = lambda r, p: sum(r[i] * p[i] for i in range(3))
    trans = [abs_a[0] - dot(rows[0], A), abs_a[1] - dot(rows[1], A)]
    if abs_a[2] is not None:
        trans.append(abs_a[2] - dot(rows[2], A))
        offset = [abs_a[0], abs_a[1], abs_a[2]]
    else:
        trans.append(-dot(rows[2], o))                           # quota: resta quella del sistema attuale
        offset = [abs_a[0], abs_a[1], 0.0]
        notes.append('Quota di A non indicata: le quote restano relative all\'origine del modello.')
    matrix_abs = _rows_matrix(rows, trans)
    matrix_view = _rows_matrix(rows, [trans[i] - offset[i] for i in range(3)])
    return {'matrix_abs': matrix_abs, 'matrix_view': matrix_view, 'offset': offset, 'epsg': geo['epsg'],
            'rotation_deg': math.degrees(phi), 'checks': checks, 'warnings': warnings, 'notes': notes}


def load(work, params):
    """Georeferenziazione salvata nel task (`work` = cartella scaling_tool) calcolata sui parametri
    di trasformazione attuali, oppure None se il task non e' georiferito."""
    try:
        from . import safe_io
    except ImportError:
        import safe_io
    rec = safe_io.read_json(os.path.join(work, 'georef.json'))
    if not isinstance(rec, dict):
        return None
    return build(params, sanitize(rec))


def info_text(geo):
    """Testo che accompagna i file esportati: come tornare alle coordinate assolute."""
    o = geo['offset']
    return ('Sistema di coordinate: EPSG:%d\n'
            'Le coordinate dei file con scena ridotta (mesh OBJ, ortofoto non TIFF) sono relative:\n'
            '  assoluto = coordinata + (%.4f, %.4f, %.4f)   [Est, Nord, quota]\n'
            'La nuvola di punti georiferita e il GeoTIFF sono gia\' in coordinate assolute.\n'
            'Rotazione applicata attorno a Z: %.4f gradi.\n' % (geo['epsg'], o[0], o[1], o[2], geo['rotation_deg']))
