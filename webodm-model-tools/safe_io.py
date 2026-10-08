# Scaling & Orientation Tool - plugin per WebODM
# Copyright (C) 2026 Luca Mandolesi
# SPDX-License-Identifier: AGPL-3.0-or-later
# Rilasciato con la stessa licenza di WebODM (GNU AGPL v3): vedi il file LICENSE.
"""Lettura e scrittura dei piccoli file JSON condivisi tra il processo web e i worker.

I file di stato vengono riscritti dal worker piu' volte al secondo mentre il pannello li legge.
Su Windows non si puo' sostituire (ne' aprire) un file nell'istante in cui un altro processo lo
ha aperto: l'operazione fallisce con "Accesso negato" (WinError 5 / 32). Su Linux non succede.
Qui ogni operazione viene quindi ritentata per un breve periodo. Solo libreria standard.
"""
import json
import os
import re
import time

_WIN_PATH = re.compile(r'''[A-Za-z]:[\\/](?:[^\\/\s"'<>|:*?]+[\\/])*([^\\/\s"'<>|:*?]*)''')
_POSIX_PATH = re.compile(r'''(?<![\w.:/])/(?:[^/\s"']+/)+([^/\s"']*)''')


def scrub(text, roots=()):
    """Toglie da un messaggio destinato al pannello i percorsi del server: lo legge chiunque veda il
    task, e dove sta WebODM sul disco non lo riguarda. Le cartelle `roots` (anche con spazi) spariscono,
    degli altri percorsi assoluti resta il solo nome del file. Il messaggio completo resta nei log."""
    text = '%s' % (text,)
    roots = (os.path.normpath(r) for r in roots if r)
    for root in sorted((r for r in roots if len(r) > 3), key=len, reverse=True):    # mai '/' o 'C:\'
        for variant in set((root, root.replace('\\', '/'), root.replace('\\', '\\\\'))):
            text = re.sub(re.escape(variant) + r'[\\/]*', '', text, flags=re.I)
    return _POSIX_PATH.sub(r'\1', _WIN_PATH.sub(r'\1', text))


def _retry(action, patience, errors):
    """Esegue `action` ritentando sugli `errors` finche' non scade `patience` (secondi)."""
    deadline = time.time() + patience
    delay = 0.01
    while True:
        try:
            return action()
        except errors:
            if time.time() >= deadline:
                raise
            time.sleep(delay)
            delay = min(delay * 2, 0.1)


def write_json(path, data, patience=5.0, indent=None):
    """Scrive `data` in `path`. Prima prova la via atomica (file temporaneo + sostituzione);
    se Windows la nega perche' qualcuno sta leggendo, riscrive il file sul posto, cosa che
    Windows consente: il lettore puo' allora vedere un contenuto a meta', e read_json riprova.
    Solleva PermissionError solo se nemmeno questo riesce entro `patience` secondi."""
    folder = os.path.dirname(path)
    if folder:
        os.makedirs(folder, exist_ok=True)
    text = json.dumps(data, indent=indent)
    tmp = '%s.%d.tmp' % (path, os.getpid())
    try:
        with open(tmp, 'w', encoding='utf-8') as f:
            f.write(text)
        os.replace(tmp, path)
        return
    except PermissionError:
        pass

    def in_place():
        with open(path, 'w', encoding='utf-8') as f:
            f.write(text)
    try:
        _retry(in_place, patience, PermissionError)
    finally:
        try:
            os.remove(tmp)
        except OSError:
            pass


def read_json(path, patience=1.0):
    """Ritorna il contenuto, oppure None se il file non esiste o non contiene JSON valido.
    Un file bloccato o letto a meta' di una riscrittura viene riletto per `patience` secondi."""
    def load():
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    try:
        return _retry(load, patience, (PermissionError, ValueError))
    except (OSError, ValueError):
        return None
