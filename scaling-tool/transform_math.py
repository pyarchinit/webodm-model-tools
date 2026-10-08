# Scaling & Orientation Tool - plugin per WebODM
# Copyright (C) 2026 Luca Mandolesi
# SPDX-License-Identifier: AGPL-3.0-or-later
# Rilasciato con la stessa licenza di WebODM (GNU AGPL v3): vedi il file LICENSE.
"""Matematica della trasformazione (pura Python, nessuna dipendenza).

Dato lo stato definito dall'utente nel sistema di riferimento ORIGINALE della nuvola:
    scale   : fattore (metri / unita' modello)
    up      : vettore che diventera' +Z   (None = Z originale)
    xdir    : direzione che diventera' +X (None = X originale proiettato)
    origin  : punto che diventera' (0,0,0) (None = origine originale)
la trasformazione e':   p' = scale * R * (p - origin)
dove le righe di R sono (ex, ey, ez).  La stessa formula e' replicata in public/main.js.
"""
import math


def _norm(v):
    n = math.sqrt(sum(x * x for x in v))
    if n < 1e-12:
        raise ValueError("vettore nullo")
    return [x / n for x in v]


def _dot(a, b):
    return sum(x * y for x, y in zip(a, b))


def _cross(a, b):
    return [a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0]]


def _vec3(v, name):
    if v is None:
        return None
    if not (isinstance(v, (list, tuple)) and len(v) == 3):
        raise ValueError("%s deve avere 3 componenti" % name)
    out = [float(x) for x in v]
    if not all(math.isfinite(x) for x in out):
        raise ValueError("%s non valido" % name)
    return out


def sanitize(params):
    """Valida e normalizza i parametri provenienti dal client."""
    scale = float(params.get("scale", 1.0) or 1.0)
    if not math.isfinite(scale) or scale <= 0:
        raise ValueError("scale deve essere > 0")
    return {
        "scale": scale,
        "up": _vec3(params.get("up"), "up"),
        "xdir": _vec3(params.get("xdir"), "xdir"),
        "origin": _vec3(params.get("origin"), "origin"),
    }


def build(params):
    """Ritorna (scale, R (3x3 liste), origin)."""
    p = sanitize(params)
    ez = _norm(p["up"]) if p["up"] else [0.0, 0.0, 1.0]

    ex = None
    if p["xdir"]:
        d = p["xdir"]
        k = _dot(d, ez)
        cand = [d[i] - k * ez[i] for i in range(3)]
        if math.sqrt(_dot(cand, cand)) > 1e-9 * max(1.0, math.sqrt(_dot(d, d))):
            ex = _norm(cand)
    if ex is None:
        ref = [1.0, 0.0, 0.0] if abs(ez[0]) < 0.9 else [0.0, 1.0, 0.0]
        k = _dot(ref, ez)
        ex = _norm([ref[i] - k * ez[i] for i in range(3)])
    ey = _cross(ez, ex)
    return p["scale"], [ex, ey, ez], (p["origin"] or [0.0, 0.0, 0.0])


def matrix4(params):
    """Matrice 4x4 (liste di righe) che porta un punto originale nel sistema finale."""
    s, R, o = build(params)
    m = []
    for i in range(3):
        t = -s * sum(R[i][j] * o[j] for j in range(3))
        m.append([s * R[i][0], s * R[i][1], s * R[i][2], t])
    m.append([0.0, 0.0, 0.0, 1.0])
    return m
