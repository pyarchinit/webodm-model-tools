/*
 * Scaling & Orientation Tool - WebODM plugin
 * Copyright (C) 2026 Luca Mandolesi - SPDX-License-Identifier: AGPL-3.0-or-later
 * Stessa licenza di WebODM (GNU AGPL v3): vedi il file LICENSE.
 *
 * Pannello nel visualizzatore 3D (Potree): misura 2 punti, scala in metri,
 * asse Z (verticale), direzione X, origine. JS puro, nessuna build necessaria.
 *
 * Tutti i punti scelti sono memorizzati nel sistema di riferimento ORIGINALE della nuvola.
 * Trasformazione:  p' = scale * R * (p - origin),  righe di R = (ex, ey, ez)
 * (stessa formula di transform_math.py, usata dall'export lato server).
 */
(function () {
    'use strict';

    var m = location.pathname.match(/\/3d\/project\/(\d+)\/task\/([0-9a-fA-F-]+)/);
    if (!m) return;                       // il plugin agisce solo nella vista 3D
    var PROJECT = m[1], TASK = m[2];
    var API = '/api/plugins/scaling-tool/task/' + TASK;
    // versione passata dal server nella query dello script (vedi plugin.py: asset_version)
    var VERSION = ((document.currentScript && document.currentScript.src || '').match(/[?&]v=(\d+\.\d+\.\d+)/) || [])[1] || 'dev';

    // ---------------------------------------------------------------- lingue (vedi i18n.js)
    // I testi scritti nel codice sono in italiano e fanno da chiave: T('testo {n}', {n: 3}) li restituisce nella
    // lingua scelta (se manca la traduzione resta l'italiano). TS() fa lo stesso per i messaggi che arrivano dal server.
    var I18N = window.ScalingToolI18n || {
        t: function (s, v) { return String(s).replace(/\{(\w+)\}/g, function (a, k) { return v && v[k] != null ? v[k] : a; }); },
        ts: function (s) { return s; }, dir: function () { return 'ltr'; }, langs: [], current: function () { return 'it'; },
        pref: function () { return 'auto'; }, setLang: function () {}, onChange: function () {}
    };
    var T = I18N.t, TS = I18N.ts;
    var bound = [];                  // testi e attributi creati una sola volta: si riscrivono al cambio di lingua
    function tn(key, vars) {
        var n = document.createTextNode(T(key, vars));
        bound.push(function () { n.nodeValue = T(key, vars); });
        return n;
    }
    function ta(el, attr, key) {
        el.setAttribute(attr, T(key));
        bound.push(function () { el.setAttribute(attr, T(key)); });
        return el;
    }

    // ---------------------------------------------------------------- matematica
    function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
    function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
    function len(a) { return Math.sqrt(dot(a, a)); }
    function cross(a, b) {
        return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    }
    function unit(a) { var n = len(a); return n < 1e-12 ? null : [a[0] / n, a[1] / n, a[2] / n]; }

    // Ritorna le righe [ex,ey,ez] di R (come transform_math.build)
    function buildR(p) {
        var ez = (p.up && unit(p.up)) || [0, 0, 1];
        var ex = null;
        if (p.xdir) {
            var k = dot(p.xdir, ez);
            var c = [p.xdir[0] - k * ez[0], p.xdir[1] - k * ez[1], p.xdir[2] - k * ez[2]];
            if (len(c) > 1e-9 * Math.max(1, len(p.xdir))) ex = unit(c);
        }
        if (!ex) {
            var ref = Math.abs(ez[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
            var kk = dot(ref, ez);
            ex = unit([ref[0] - kk * ez[0], ref[1] - kk * ez[1], ref[2] - kk * ez[2]]);
        }
        return [ex, cross(ez, ex), ez];
    }

    // THREE.Matrix4 (originale -> finale)
    function buildMatrix(p) {
        var R = buildR(p), s = p.scale || 1, o = p.origin || [0, 0, 0], r = [];
        for (var i = 0; i < 3; i++) {
            r.push(s * R[i][0], s * R[i][1], s * R[i][2], -s * dot(R[i], o));
        }
        return new THREE.Matrix4().set(
            r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7], r[8], r[9], r[10], r[11], 0, 0, 0, 1);
    }

    // Autovalori/autovettori di una matrice simmetrica 3x3 (Jacobi)
    function eigenSym3(A) {
        var V = [[1, 0, 0], [0, 1, 0], [0, 0, 1]], k;
        for (var sweep = 0; sweep < 60; sweep++) {
            if (Math.abs(A[0][1]) + Math.abs(A[0][2]) + Math.abs(A[1][2]) < 1e-18) break;
            for (var p = 0; p < 2; p++) {
                for (var q = p + 1; q < 3; q++) {
                    if (Math.abs(A[p][q]) < 1e-300) continue;
                    var th = (A[q][q] - A[p][p]) / (2 * A[p][q]);
                    var t = (th >= 0 ? 1 : -1) / (Math.abs(th) + Math.sqrt(th * th + 1));
                    var c = 1 / Math.sqrt(t * t + 1), s = t * c, a, b;
                    for (k = 0; k < 3; k++) { a = A[k][p]; b = A[k][q]; A[k][p] = c * a - s * b; A[k][q] = s * a + c * b; }
                    for (k = 0; k < 3; k++) { a = A[p][k]; b = A[q][k]; A[p][k] = c * a - s * b; A[q][k] = s * a + c * b; }
                    for (k = 0; k < 3; k++) { a = V[k][p]; b = V[k][q]; V[k][p] = c * a - s * b; V[k][q] = s * a + c * b; }
                }
            }
        }
        return {vals: [A[0][0], A[1][1], A[2][2]], V: V};
    }

    // Normale del piano ai minimi quadrati per N>=3 punti
    function fitPlane(pts) {
        var n = pts.length, c = [0, 0, 0], i, j, k;
        pts.forEach(function (p) { c[0] += p[0] / n; c[1] += p[1] / n; c[2] += p[2] / n; });
        var C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
        pts.forEach(function (p) {
            var d = sub(p, c);
            for (i = 0; i < 3; i++) for (j = 0; j < 3; j++) C[i][j] += d[i] * d[j];
        });
        var e = eigenSym3(C), idx = 0;
        for (k = 1; k < 3; k++) if (e.vals[k] < e.vals[idx]) idx = k;
        return {normal: unit([e.V[0][idx], e.V[1][idx], e.V[2][idx]]), centroid: c};
    }

    // ---------------------------------------------------------------- stato
    var S = {
        params: {scale: 1, up: null, xdir: null, origin: null},
        refs: {},
        Tw: null,            // THREE.Matrix4 corrente (originale -> finale)
        marks: [],           // punti nel sistema originale
        mode: null,
        saved: false,
        canEdit: false,
        collapsed: false,
        // camera virtuale ortografica (stile Blender): rotazione XYZ in gradi, posizione e inquadratura in metri
        // src: 'mesh' o 'cloud'; clipStart/clipEnd: metri davanti alla camera, usati solo se clipOn
        cam: {rot: [90, 0, 0], pos: [0, 0, 0], w: 10, h: 10, show: false, look: false,
              src: 'mesh', pointSize: 0, clipOn: false, slice: false, clipStart: 0, clipEnd: 10,
              annotate: false},        // scala metrica + punti di georeferenziazione sull'immagine
        gizmo: null,         // oggetto camera disegnato nella scena
        map: null,           // stato dell'ortofoto pubblicata sulla Mappa 2D
        viewer: null,        // finestra a tutto schermo aperta
        exportKey: '', orthoKey: '',   // ultimo stato mostrato: i sondaggi ridisegnano solo se cambia
        openShots: {},       // scatti dell'elenco aperti (true) o richiusi (false) dall'utente
        panelMoved: false,
        meshCount: 0,        // mesh texturizzate visibili nella scena
        msg: '',
        exportState: null,
        orthoState: null,
        geoHook: null,       // impostato dal modulo georef.js: matrice (16 numeri) originale -> scena, oppure null
        extraMarks: [],      // marcatori disegnati dai moduli: {p (sistema originale), label, color}
        persist: [],         // campi dei moduli che renderBody() stacca e riattacca senza distruggerli
        modules: [],         // istanze dei moduli: {section(body, sec), onReset()}
        ui: null
    };

    var viewer, ready = false;

    function inverse(M) {
        var c = M.clone();
        return c.invert ? c.invert() : new THREE.Matrix4().getInverse(M);   // three r1xx / r8x
    }
    function curToOrig(v3) { return v3.clone().applyMatrix4(inverse(S.Tw)); }
    function origToCur(p) { return new THREE.Vector3(p[0], p[1], p[2]).applyMatrix4(S.Tw); }

    // ---------------------------------------------------------------- viewer
    // Sposta la camera insieme alla nuvola, cosi' il modello resta inquadrato dopo ogni modifica
    function followCamera(oldTw, newTw) {
        try {
            var D = newTw.clone().multiply(inverse(oldTw)), view = viewer.scene.view;
            var pos = view.position.clone().applyMatrix4(D);
            var pivot = view.getPivot().clone().applyMatrix4(D);
            // vista non ancora inizializzata (o area 3D nascosta): meglio non toccarla
            if (!pos.toArray().concat(pivot.toArray()).every(isFinite) || pos.distanceTo(pivot) < 1e-9) return;
            view.position.copy(pos);
            view.lookAt(pivot);
        } catch (e) { /* versione di Potree senza queste API: si usa "Inquadra modello" */ }
    }

    // Oggetti che WebODM aggiunge alla scena oltre alla nuvola: la mesh texturizzata
    // ("Modello con texture") e i modellini delle fotocamere. Vanno mossi insieme alla nuvola.
    function sceneExtras() {
        return viewer.scene.scene.children.filter(function (o) {
            if (o.isLight || o.isCamera) return false;
            var hasMesh = false;
            o.traverse(function (n) { if (n.isMesh) hasMesh = true; });
            return hasMesh;
        });
    }

    // La sola mesh texturizzata (le fotocamere hanno matrixAutoUpdate = false)
    function texturedMeshes() {
        return sceneExtras().filter(function (o) { return o.matrixAutoUpdate !== false && o.visible; });
    }

    // Applica S.Tw a un oggetto partendo dalla sua posa ORIGINALE (memorizzata la prima volta)
    function applyToObject(o) {
        if (o.matrixAutoUpdate === false) {
            // posa scritta direttamente nella matrice (fotocamere). Se WebODM l'ha riscritta
            // (es. cambio dimensione fotocamere) quella nuova diventa la posa originale.
            if (!o.__scOrigM || !o.__scSetM || !o.matrix.equals(o.__scSetM)) o.__scOrigM = o.matrix.clone();
            o.matrix.copy(S.Tw).multiply(o.__scOrigM);
            o.__scSetM = o.matrix.clone();
        } else {
            if (!o.__scOrig) o.__scOrig = {p: o.position.clone(), q: o.quaternion.clone(), s: o.scale.clone()};
            var M0 = new THREE.Matrix4().compose(o.__scOrig.p, o.__scOrig.q, o.__scOrig.s);
            S.Tw.clone().multiply(M0).decompose(o.position, o.quaternion, o.scale);
            o.updateMatrix();
        }
        o.updateMatrixWorld(true);
        o.__scTw = S.Tw;                 // trasformazione gia' applicata a questo oggetto
    }

    function applyTransform() {
        var oldTw = S.Tw;
        var geo = S.geoHook && S.geoHook();                // modello georiferito: scala/Z da params, XY da A e B
        if (geo) { S.Tw = new THREE.Matrix4(); S.Tw.set.apply(S.Tw, geo); } else S.Tw = buildMatrix(S.params);
        if (oldTw) followCamera(oldTw, S.Tw);
        viewer.scene.pointclouds.forEach(function (pc) {
            applyToObject(pc);
            // Potree aggiorna i nodi solo al fotogramma successivo: li allineiamo subito,
            // cosi' un click immediato lavora gia' sulla nuvola trasformata
            (pc.visibleNodes || []).forEach(function (n) {
                if (n.sceneNode) {
                    n.sceneNode.updateMatrix();
                    n.sceneNode.matrixWorld.multiplyMatrices(pc.matrixWorld, n.sceneNode.matrix);
                }
            });
        });
        sceneExtras().forEach(applyToObject);
    }

    // La mesh viene caricata solo quando l'utente la attiva, e le fotocamere possono essere
    // riposizionate da WebODM: controlliamo periodicamente che tutto abbia la trasformazione corrente.
    function syncExtras() {
        if (!S.Tw) return;
        placePanel();
        var n = texturedMeshes().length;
        sceneExtras().forEach(function (o) {
            var stale = o.__scTw !== S.Tw ||
                (o.matrixAutoUpdate === false && o.__scSetM && !o.matrix.equals(o.__scSetM));
            if (stale) applyToObject(o);
        });
        if (n !== S.meshCount) { S.meshCount = n; render(); }
    }

    function pick(clientX, clientY) {
        var el = viewer.renderer.domElement, r = el.getBoundingClientRect();
        var mouse = {x: clientX - r.left, y: clientY - r.top};
        var cam = viewer.scene.getActiveCamera();
        var res = null;
        try {
            res = Potree.Utils.getMousePointCloudIntersection(mouse, cam, viewer, viewer.scene.pointclouds);
        } catch (e) { res = null; }
        if (!res || !res.location) {
            try { res = viewer.inputHandler.getMousePointCloudIntersection(mouse); } catch (e) { res = null; }
        }
        if (res && res.location) return res.location;

        // nessun punto della nuvola (es. nascosta da "Modello con texture"): si prova sulla mesh
        var meshes = texturedMeshes();
        if (!meshes.length) return null;
        var rc = new THREE.Raycaster();
        rc.setFromCamera(new THREE.Vector2(mouse.x / r.width * 2 - 1, -(mouse.y / r.height) * 2 + 1), cam);
        var hits = rc.intersectObjects(meshes, true);
        return hits.length ? hits[0].point : null;
    }

    function installPicking() {
        var el = viewer.renderer.domElement, down = null;
        el.addEventListener('mousedown', function (e) {
            down = e.button === 0 ? {x: e.clientX, y: e.clientY, t: Date.now()} : null;
        }, true);
        el.addEventListener('mouseup', function (e) {
            if (!down || !S.mode || e.button !== 0) return;
            var moved = Math.hypot(e.clientX - down.x, e.clientY - down.y), dt = Date.now() - down.t;
            down = null;
            if (moved > 5 || dt > 700) return;      // era un trascinamento (orbita), non un click
            var loc = pick(e.clientX, e.clientY);
            if (!loc) { S.msg = T('Niente sotto il cursore: clicca su un punto della nuvola o della mesh.'); render(); return; }
            onPick(curToOrig(loc).toArray());
        }, true);
        window.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && S.mode) { S.mode = null; S.msg = T('Modalita\' annullata.'); render(); }
        });
    }

    // ---------------------------------------------------------------- logica modalita'
    var MODES = {
        measure: {label: 'Misura 2 punti', need: 2, hint: 'Clicca il punto A e poi il punto B sulla nuvola.'},
        upLine: {label: 'Verticale: 2 punti', need: 2, hint: 'Clicca un punto in BASSO e uno in ALTO su un elemento verticale (spigolo di muro, palo...).'},
        upPlane: {label: 'Piano di appoggio', need: 3, hint: 'Clicca almeno 3 punti sul pavimento/terreno, poi premi "Calcola".'},
        xdir: {label: 'Direzione X: 2 punti', need: 2, hint: 'Clicca l\'inizio e la fine della direzione che diventera\' l\'asse +X.'},
        origin: {label: 'Origine: 1 punto', need: 1, hint: 'Clicca il punto che diventera\' (0, 0, 0).'}
    };

    function startMode(name) {
        S.mode = S.mode === name ? null : name;
        S.marks = [];
        S.msg = S.mode ? T(MODES[name].hint) + '  ' + T('(Esc per annullare)') : '';
        render();
    }

    function onPick(p) {
        if (MODES[S.mode].onPick) {                // modalita' dei moduli: un solo clic e si torna indietro
            var custom = MODES[S.mode];
            S.mode = null; S.marks = [];
            custom.onPick(p);
            return render();
        }
        var need = MODES[S.mode].need;
        if (S.mode !== 'upPlane' && S.marks.length >= need) S.marks = [];
        S.marks.push(p);
        S.msg = T(MODES[S.mode].hint);

        if (S.mode === 'upLine' && S.marks.length === 2) {
            var d = sub(S.marks[1], S.marks[0]);
            if (!unit(d)) { S.msg = T('I due punti coincidono.'); }
            else { S.params.up = d; changed(T('Asse Z impostato dai 2 punti (usa "Inverti Z" se la nuvola e\' capovolta).')); }
        } else if (S.mode === 'xdir' && S.marks.length === 2) {
            var dx = sub(S.marks[1], S.marks[0]);
            if (!unit(dx)) { S.msg = T('I due punti coincidono.'); }
            else { S.params.xdir = dx; changed(T('Direzione X impostata.')); }
        } else if (S.mode === 'origin' && S.marks.length === 1) {
            S.params.origin = p.slice();
            changed(T('Origine impostata.'));
        }
        render();
    }

    function computePlane() {
        if (S.marks.length < 3) { S.msg = T('Servono almeno 3 punti.'); return render(); }
        var f = fitPlane(S.marks), n = f.normal;
        if (!n) { S.msg = T('Punti allineati: impossibile definire un piano.'); return render(); }
        var cam = curToOrig(viewer.scene.getActiveCamera().position).toArray();
        if (dot(n, sub(cam, f.centroid)) < 0) n = [-n[0], -n[1], -n[2]];   // normale verso l'osservatore
        S.params.up = n;
        changed(T('Asse Z impostato dal piano ({n} punti). Se e\' capovolto usa "Inverti Z".', {n: S.marks.length}));
    }

    function flipUp() {
        if (!S.params.up) return;
        S.params.up = [-S.params.up[0], -S.params.up[1], -S.params.up[2]];
        changed(T('Asse Z invertito.'));
    }

    // Inverte l'asse X (rotazione di 180 gradi attorno a Z: la terna resta destrorsa)
    function flipX() {
        var base = S.params.xdir || buildR(S.params)[0];       // senza X scelto vale l'X attuale
        S.params.xdir = [-base[0], -base[1], -base[2]];
        changed(T('Asse X invertito.'));
    }

    // Rende +X parallela allo schermo: la "destra" della vista attuale (sul piano orizzontale).
    // La facciata che stai guardando diventa il piano XZ di fronte a te, con +Y che entra nello schermo.
    function xParallelToViewer() {
        var cam = viewer.scene.getActiveCamera();
        cam.updateMatrixWorld();
        var right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);   // destra camera, frame attuale
        var o = right.transformDirection(inverse(S.Tw)).toArray();                 // nel frame ORIGINALE
        if (!unit(o)) { S.msg = T('Vista non valida: ruota la camera e riprova.'); return render(); }
        S.params.xdir = o;
        changed(T('Asse X parallelo alla vista (verso destra). Se la vista e\' dall\'alto o dal basso la Z deve gia\' essere impostata.'));
    }

    // Rende +X la direzione che dal modello punta verso chi guarda (camera attuale),
    // misurata sul piano orizzontale: la "faccia" che vedi diventa quella sul lato +X.
    function xToViewer() {
        var view = viewer.scene.view;
        var d = view.position.clone().sub(view.getPivot());     // dal centro vista alla camera, frame attuale
        // direzione nel frame ORIGINALE (inversa della sola parte lineare di Tw)
        var o = d.transformDirection(inverse(S.Tw)).toArray();
        if (!unit(o)) { S.msg = T('Camera sul centro del modello: ruota la vista e riprova.'); return render(); }
        S.params.xdir = o;
        changed(T('Asse X orientato verso di te (proiettato sul piano orizzontale).'));
    }

    function applyScale() {
        if (S.marks.length !== 2 || S.mode !== 'measure') return;
        var real = parseFloat(String(S.ui.real.value).replace(',', '.'));
        if (!(real > 0)) { S.msg = T('Inserisci una distanza reale in metri > 0.'); return render(); }
        var d = len(sub(S.marks[1], S.marks[0]));        // distanza nel sistema ORIGINALE
        if (d < 1e-12) { S.msg = T('I due punti coincidono.'); return render(); }
        S.params.scale = real / d;
        S.refs.scale = {real_m: real, model_units: d};
        changed(T('Scala impostata: 1 unita\' modello = {s} m.', {s: S.params.scale.toPrecision(6)}));
    }

    function changed(msg) {
        S.saved = false;
        S.msg = msg;
        applyTransform();
        render();
    }

    // Conferma dentro la pagina al posto di window.confirm(): nell'app desktop (Electron) dopo una
    // finestra nativa le caselle di testo non ricevono piu' la tastiera finche' non si cambia finestra.
    function askConfirm(text, onYes) {
        var old = document.getElementById('scaling-tool-confirm');
        if (old) old.parentNode.removeChild(old);
        var close = function () { if (el.parentNode) el.parentNode.removeChild(el); window.removeEventListener('keydown', onKey, true); };
        var onKey = function (e) {
            if (e.key === 'Escape') { e.stopPropagation(); close(); }
        };
        var bs = 'padding:6px 14px;margin-left:8px;font-size:12px;cursor:pointer;border:1px solid #888;border-radius:4px;';
        var no = h('button', {type: 'button', style: bs + 'background:#f4f4f4;color:#111;'}, T('Annulla'));
        var yes = h('button', {type: 'button', style: bs + 'background:#2c3e50;color:#fff;border-color:#2c3e50;'}, T('Conferma'));
        no.addEventListener('click', close);
        yes.addEventListener('click', function () { close(); onYes(); });
        var el = h('div', {id: 'scaling-tool-confirm', dir: I18N.dir(), style: 'position:fixed;left:0;top:0;right:0;bottom:0;z-index:2000000;' +
            'background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;font-family:sans-serif;'}, [
            h('div', {style: 'background:#fff;color:#111;max-width:440px;margin:0 16px;padding:16px;border-radius:6px;font-size:13px;' +
                'line-height:1.45;white-space:pre-line;box-shadow:0 4px 20px rgba(0,0,0,.5);'}, [
                text,
                h('div', {style: 'text-align:right;margin-top:14px;'}, [no, yes])
            ])
        ]);
        document.body.appendChild(el);
        window.addEventListener('keydown', onKey, true);
        yes.focus();
    }

    function resetAll() {
        if (S.saved) return askConfirm(T('Eliminare anche la trasformazione salvata per questo task?'), doReset);
        doReset();
    }

    function doReset() {
        var wasSaved = S.saved;
        S.params = {scale: 1, up: null, xdir: null, origin: null};
        S.refs = {}; S.marks = []; S.mode = null; S.saved = false;
        S.modules.forEach(function (mod) { if (mod.onReset) mod.onReset(); });
        applyTransform();
        S.msg = T('Ripristinato il modello originale.');
        if (wasSaved) api('DELETE', API + '/transform').then(render, render); else render();
    }

    // ---------------------------------------------------------------- rete
    function csrf() {
        var c = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
        return c ? decodeURIComponent(c[1]) : '';
    }
    function api(method, url, body) {
        return fetch(url, {
            method: method, credentials: 'same-origin',
            headers: {'Content-Type': 'application/json', 'X-CSRFToken': csrf()},
            body: body ? JSON.stringify(body) : undefined
        }).then(function (r) {
            return r.json().catch(function () { return {}; }).then(function (j) {
                if (r.ok) return j;
                throw (j.error || j.detail || ('HTTP ' + r.status));
            });
        });
    }

    // Ritorna la promessa (rifiutata con il messaggio d'errore): i moduli la concatenano ad altre operazioni
    function saveTransform() {
        var body = {scale: S.params.scale, up: S.params.up, xdir: S.params.xdir,
                    origin: S.params.origin, refs: S.refs};
        return api('PUT', API + '/transform', body).then(function () {
            S.saved = true; S.msg = T('Trasformazione salvata.'); render();
        });
    }

    function save() {
        saveTransform().then(null, function (e) { S.msg = T('Errore nel salvataggio: {e}', {e: TS(e)}); render(); });
    }

    // Esporta. Dove salvare si chiede subito dove il browser lo permette (cartella di destinazione);
    // nell'app desktop (Chromium 83) non esiste la finestra "scegli cartella": al termine dell'export
    // compare l'elenco dei file e ognuno si salva con la finestra "Salva con nome".
    function startExport() {
        if (!S.saved) { S.msg = T('Salva la trasformazione prima di esportare.'); return render(); }
        var go = function (dir) {
            api('POST', API + '/export').then(function () {
                S.exportDir = dir || null; S.exportAsk = true;
                S.exportState = {state: 'running', message: 'Avvio...', progress: 0, files: []};
                S.msg = ''; render(); pollExport();
            }, function (e) { S.msg = T('Export non avviato: {e}', {e: TS(e)}); render(); });
        };
        if (window.showDirectoryPicker) {
            window.showDirectoryPicker({mode: 'readwrite'}).then(go, function (e) {
                if (e && e.name === 'AbortError') return;              // finestra annullata: niente export
                go(null);
            });
        } else go(null);
    }

    function saveExportFile(f, dir, say) {
        if (dir) {
            say(T('Salvataggio di {f}...', {f: f.name}));
            return dir.getFileHandle(f.name, {create: true}).then(function (fh) {
                return fetch(f.url, {credentials: 'same-origin'}).then(function (resp) {
                    if (!resp.ok) throw new Error('HTTP ' + resp.status);
                    return resp.blob();
                }).then(function (blob) {
                    return fh.createWritable().then(function (w) {
                        return w.write(blob).then(function () { return w.close(); });
                    });
                });
            }).then(function () { say(T('Salvato: {f}', {f: f.name})); }, function (e) {
                say(T('Salvataggio non riuscito ({f}): {e}', {f: f.name, e: e && e.message || e}));
            });
        }
        var a = h('a', {href: f.url, download: f.name, style: 'display:none;'});
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        say(T('Scegli dove salvare {f} nella finestra "Salva con nome".', {f: f.name}));
        return Promise.resolve();
    }

    // Finestra "Export pronto": un pulsante Salva per file e Salva tutti
    function exportDoneDialog(files, dir) {
        var old = document.getElementById('scaling-tool-exportdone');
        if (old) old.parentNode.removeChild(old);
        var close = function () { if (el.parentNode) el.parentNode.removeChild(el); };
        var bs = 'padding:5px 12px;font-size:12px;cursor:pointer;border:1px solid #888;border-radius:4px;background:#f4f4f4;color:#111;';
        var note = h('div', {style: 'font-size:11px;color:#2e7d32;min-height:15px;margin-top:8px;'}, '');
        var say = function (t) { note.textContent = t; };
        var rows = files.map(function (f) {
            var b = h('button', {type: 'button', style: bs}, T('Salva...'));
            b.addEventListener('click', function () { saveExportFile(f, dir, say); });
            return h('div', {style: 'display:flex;align-items:center;justify-content:space-between;margin:5px 0;'},
                [h('span', {style: 'word-break:break-all;margin-right:10px;'}, f.name), b]);
        });
        var all = h('button', {type: 'button', style: bs + 'background:#2c3e50;color:#fff;border-color:#2c3e50;'}, T('Salva tutti'));
        all.addEventListener('click', function () {
            files.reduce(function (p, f, i) {
                return p.then(function () { return new Promise(function (ok) { setTimeout(ok, i ? 600 : 0); }); })
                    .then(function () { return saveExportFile(f, dir, say); });
            }, Promise.resolve());
        });
        var shut = h('button', {type: 'button', style: bs + 'margin-left:8px;'}, T('Chiudi'));
        shut.addEventListener('click', close);
        var el = h('div', {id: 'scaling-tool-exportdone', dir: I18N.dir(), style: 'position:fixed;left:0;top:0;right:0;bottom:0;z-index:2000000;' +
            'background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;font-family:sans-serif;'}, [
            h('div', {style: 'background:#fff;color:#111;width:400px;max-width:calc(100% - 32px);padding:16px;border-radius:6px;font-size:13px;' +
                'box-shadow:0 4px 20px rgba(0,0,0,.5);'}, [
                h('div', {style: 'font-weight:bold;margin-bottom:8px;'}, T('Export pronto: dove vuoi salvarlo?'))
            ].concat(rows).concat([note, h('div', {style: 'text-align:right;margin-top:12px;'}, [all, shut])]))
        ]);
        document.body.appendChild(el);
    }

    var pollTimer = null;
    function pollExport() {
        clearTimeout(pollTimer);
        api('GET', API + '/export').then(function (st) {
            var key = JSON.stringify(st), wasRunning = S.exportState && S.exportState.state === 'running';
            S.exportState = st;
            if (key !== S.exportKey) { S.exportKey = key; render(); }
            if (wasRunning && st.state === 'done' && S.exportAsk && (st.files || []).length) {
                S.exportAsk = false;
                exportDoneDialog(st.files, S.exportDir);
            }
            if (st.state === 'running') pollTimer = setTimeout(pollExport, 2000);
        }, function () { pollTimer = setTimeout(pollExport, 4000); });
    }

    // ---------------------------------------------------------------- ortofoto dalla mesh
    // Camera ortografica virtuale, come in Blender: posizione, rotazione di Eulero XYZ in gradi
    // e dimensioni dell'inquadratura. A rotazione nulla guarda verso -Z (dall'alto) con +Y in
    // alto nell'immagine; (90, 0, 0) guarda verso +Y con Z in alto. Vedi ortho_worker.py.
    var CAM_PRESETS = [
        ['Fronte', [90, 0, 0], 'Prospetto frontale: guarda verso +Y (X a destra, Z in alto)'],
        ['Retro', [90, 0, 180], 'Prospetto posteriore: guarda verso -Y'],
        ['Lato +X', [90, 0, -90], 'Prospetto laterale: guarda verso +X'],
        ['Lato −X', [90, 0, 90], 'Prospetto laterale: guarda verso -X'],
        ['Pianta', [0, 0, 0], 'Dall\'alto: X a destra, Y in alto'],
        ['Da sotto', [180, 0, 0], 'Vista dal basso']
    ];

    // Assi della camera = colonne di R = Rz * Ry * Rx (uguale a camera_axes() in ortho_worker.py)
    function cameraAxes(rot) {
        var d = Math.PI / 180, cx = Math.cos(rot[0] * d), sx = Math.sin(rot[0] * d),
            cy = Math.cos(rot[1] * d), sy = Math.sin(rot[1] * d), cz = Math.cos(rot[2] * d), sz = Math.sin(rot[2] * d);
        return {
            right: [cz * cy, sz * cy, -sy],
            up: [cz * sy * sx - sz * cx, sz * sy * sx + cz * cx, cy * sx],
            back: [cz * sy * cx + sz * sx, sz * sy * cx - cz * sx, cy * cx]      // verso l'osservatore
        };
    }

    function modelBox() { return viewer.getBoundingBox(viewer.scene.pointclouds); }

    // Vertici dell'ingombro stretto di ogni nuvola, portati nel sistema allineato. Piu' fedele
    // dello scatolone allineato agli assi di modelBox(), che si gonfia quando il modello e' ruotato.
    function modelCorners() {
        var out = [];
        viewer.scene.pointclouds.forEach(function (pc) {
            var local = (pc.pcoGeometry && pc.pcoGeometry.tightBoundingBox) || pc.boundingBox;
            pc.updateMatrixWorld(true);
            boxCorners(local).forEach(function (c) {
                out.push(new THREE.Vector3(c[0], c[1], c[2]).applyMatrix4(pc.matrixWorld).toArray());
            });
        });
        return out.length ? out : boxCorners(modelBox());
    }

    function boxCorners(box) {
        var out = [];
        [box.min.x, box.max.x].forEach(function (x) {
            [box.min.y, box.max.y].forEach(function (y) {
                [box.min.z, box.max.z].forEach(function (z) { out.push([x, y, z]); });
            });
        });
        return out;
    }

    // Centra la camera sul modello per la rotazione corrente e adatta l'inquadratura.
    // La camera viene messa davanti a tutto, cosi' il taglio non elimina nulla.
    function fitCamera() {
        var ax = cameraAxes(S.cam.rot), lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
        modelCorners().forEach(function (p) {
            [ax.right, ax.up, ax.back].forEach(function (v, i) {
                var d = dot(v, p);
                lo[i] = Math.min(lo[i], d); hi[i] = Math.max(hi[i], d);
            });
        });
        if (!lo.concat(hi).every(isFinite)) return;
        var a = (lo[0] + hi[0]) / 2, b = (lo[1] + hi[1]) / 2, c = hi[2] + 1;
        var r2 = function (v) { return Math.round(v * 100) / 100; };
        S.cam.pos = [0, 1, 2].map(function (i) { return r2(ax.right[i] * a + ax.up[i] * b + ax.back[i] * c); });
        S.cam.w = r2((hi[0] - lo[0]) * 1.02);
        S.cam.h = r2((hi[1] - lo[1]) * 1.02);
        S.cam.clipStart = 0;
        S.cam.clipEnd = r2(c - lo[2] + 1);          // dalla camera fin oltre il punto piu' lontano
        S.cam.fitted = true;
        cameraChanged();
    }

    function orthoResolution() {
        var num = function (el) { var v = parseFloat(String(el.value).replace(',', '.')); return v > 0 ? v : null; };
        if (S.ui.mode.value === 'scale') {
            var n = num(S.ui.scaleN), dpi = num(S.ui.dpi);
            return n && dpi ? {cm: n * 2.54 / dpi, scale: n, dpi: dpi} : null;
        }
        var cm = num(S.ui.res);
        return cm ? {cm: cm} : null;
    }

    function updateOrthoEstimate() {
        var el = S.ui.est, res = orthoResolution();
        S.ui.scaleRow.style.display = S.ui.mode.value === 'scale' ? 'block' : 'none';
        S.ui.res.style.display = S.ui.mode.value === 'scale' ? 'none' : 'block';
        if (!res || !(S.cam.w > 0) || !(S.cam.h > 0)) { el.textContent = ''; return; }
        var w = Math.round(S.cam.w * 100 / res.cm), hh = Math.round(S.cam.h * 100 / res.cm), mp = w * hh / 1e6;
        var txt = T('{w} × {h} pixel', {w: w, h: hh});
        if (res.scale) {
            txt += ', ' + T('{mm} mm/pixel — sul foglio {w} × {h} cm', {mm: (res.cm * 10).toFixed(2),
                w: (S.cam.w * 100 / res.scale).toFixed(1), h: (S.cam.h * 100 / res.scale).toFixed(1)});
        }
        var limit = S.cam.src === 'cloud' ? 120 : 300;
        el.style.color = mp > limit ? '#a00' : '#555';
        el.textContent = txt + (mp > limit ? ' — ' + T('troppo grande (max {n} megapixel)', {n: limit}) : '');
    }

    // Oggetto camera nella scena 3D: il riquadro dell'inquadratura, l'asse di vista e una
    // tacca che indica l'alto dell'immagine (come la camera di Blender).
    function cameraGizmo() {
        if (S.gizmo) return S.gizmo;
        var mat = new THREE.LineBasicMaterial({color: 0xffd400, depthTest: false, depthWrite: false, transparent: true});
        var line = function (pts, loop) {
            var g = new THREE.BufferGeometry().setFromPoints(pts.map(function (p) { return new THREE.Vector3(p[0], p[1], p[2]); }));
            var o = loop ? new THREE.LineLoop(g, mat) : new THREE.Line(g, mat);
            o.renderOrder = 999; o.frustumCulled = false;
            return o;
        };
        var g = new THREE.Group();
        g.add(line([[-0.5, -0.5, 0], [0.5, -0.5, 0], [0.5, 0.5, 0], [-0.5, 0.5, 0]], true));       // inquadratura
        g.add(line([[-0.5, -0.5, 0], [0.5, 0.5, 0]], false));
        g.add(line([[-0.5, 0.5, 0], [0.5, -0.5, 0]], false));
        var axis = line([[0, 0, 0], [0, 0, -1]], false);                                            // direzione di vista
        g.add(axis);
        // piani di clip start e clip end: stessa inquadratura, spostata lungo la direzione di vista
        var clipMat = new THREE.LineBasicMaterial({color: 0x29b6f6, depthTest: false, depthWrite: false, transparent: true});
        var plane = function () {
            var o = line([[-0.5, -0.5, 0], [0.5, -0.5, 0], [0.5, 0.5, 0], [-0.5, 0.5, 0]], true);
            o.material = clipMat;
            g.add(o);
            return o;
        };
        g.userData = {axis: axis, near: plane(), far: plane()};
        g.add(line([[-0.12, 0.5, 0], [0, 0.62, 0], [0.12, 0.5, 0]], false));                        // alto
        g.matrixAutoUpdate = false;
        g.name = 'scaling-tool-camera';
        viewer.scene.scene.add(g);
        S.gizmo = g;
        return g;
    }

    function updateGizmo() {
        if (!S.cam.show && !S.gizmo) return;
        var g = cameraGizmo(), ax = cameraAxes(S.cam.rot), w = S.cam.w || 1, hh = S.cam.h || 1;
        var len = Math.max(w, hh) * 0.5;
        var v = function (a, k) { return new THREE.Vector3(a[0] * k, a[1] * k, a[2] * k); };
        g.matrix.makeBasis(v(ax.right, w), v(ax.up, hh), v(ax.back, 1));      // la profondita' resta in metri
        var on = !!S.cam.clipOn, u = g.userData;
        u.near.visible = u.far.visible = on;
        u.near.position.z = -S.cam.clipStart;
        u.far.position.z = -S.cam.clipEnd;
        u.axis.scale.z = on ? Math.max(S.cam.clipEnd, 0.01) : len;            // col clip l'asse arriva al clip end
        g.matrix.setPosition(S.cam.pos[0], S.cam.pos[1], S.cam.pos[2]);
        g.matrixWorldNeedsUpdate = true;
        g.updateMatrixWorld(true);
        g.visible = !!S.cam.show;
    }

    // "Guarda dalla camera": la vista 3D diventa ortografica, nella direzione della camera e
    // centrata sull'inquadratura. Il rollio (rotazione attorno all'asse di vista) non e'
    // riproducibile dalla vista di Potree: lo mostra il riquadro, che appare ruotato.
    function applyCameraPreview() {
        if (!S.cam.look) return;
        try {
            var ax = cameraAxes(S.cam.rot), view = viewer.scene.view, el = viewer.renderer.domElement;
            var f = [-ax.back[0], -ax.back[1], -ax.back[2]];
            viewer.setCameraMode(Potree.CameraMode.ORTHOGRAPHIC);
            view.pitch = Math.asin(Math.max(-1, Math.min(1, f[2])));
            if (Math.hypot(ax.right[0], ax.right[1]) > 1e-6) view.yaw = Math.atan2(ax.right[1], ax.right[0]);
            var aspect = (el.clientWidth || 1) / (el.clientHeight || 1);
            var radius = Math.max(S.cam.w / 2, S.cam.h / 2 * aspect, 0.01) * 1.15;      // semi-larghezza visibile
            // col clip la vista parte dal piano di clip start, altrimenti da ben piu' indietro
            var backOff = S.cam.clipOn ? -S.cam.clipStart : radius + Math.max(S.cam.w, S.cam.h) * 2;
            view.position.set(S.cam.pos[0] - f[0] * backOff, S.cam.pos[1] - f[1] * backOff, S.cam.pos[2] - f[2] * backOff);
            view.radius = radius;
        } catch (e) { console.warn('[scaling-tool] anteprima camera non disponibile', e); }
    }

    // ---- anteprima della fetta (come il clipping di Blender): nella scena 3D resta visibile solo
    // cio' che sta tra clip start e clip end e dentro l'inquadratura, cioe' quello che finira' nella foto.
    // Nuvola: volume di clip di Potree. Mesh e modelli: sei piani di clip di three.js.
    function removeSlice() {
        try {
            if (S.sliceVol) { viewer.scene.removeVolume(S.sliceVol); S.sliceVol = null; }
            viewer.setClipTask(Potree.ClipTask.NONE);
            viewer.renderer.clippingPlanes = [];
        } catch (e) { console.warn('[scaling-tool] fetta non rimossa', e); }
    }

    function updateSlice() {
        if (!S.cam.slice) return;
        if (!S.cam.clipOn || !(S.cam.clipEnd > S.cam.clipStart)) { removeSlice(); return; }
        try {
            var ax = cameraAxes(S.cam.rot), w = S.cam.w, hh = S.cam.h, d = S.cam.clipEnd - S.cam.clipStart;
            var mid = (S.cam.clipStart + S.cam.clipEnd) / 2, pos = S.cam.pos;
            var c = [0, 1, 2].map(function (i) { return pos[i] - ax.back[i] * mid; });
            var vec = function (a) { return new THREE.Vector3(a[0], a[1], a[2]); };
            if (!S.sliceVol) {
                S.sliceVol = new Potree.BoxVolume();
                S.sliceVol.name = 'scaling-tool-fetta';
                S.sliceVol.clip = true;
                S.sliceVol.visible = false;
                viewer.scene.addVolume(S.sliceVol);
            }
            var v = S.sliceVol;
            v.position.set(c[0], c[1], c[2]);
            v.scale.set(w, hh, d);
            v.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(vec(ax.right), vec(ax.up), vec(ax.back)));
            v.updateMatrixWorld(true);
            viewer.setClipTask(Potree.ClipTask.SHOW_INSIDE);
            var planes = [];
            [[ax.right, w / 2], [ax.up, hh / 2], [ax.back, d / 2]].forEach(function (a) {
                [1, -1].forEach(function (sg) {
                    var n = vec(a[0]).multiplyScalar(-sg);                  // normale verso l'interno
                    var pt = vec(c).add(vec(a[0]).multiplyScalar(sg * a[1]));
                    planes.push(new THREE.Plane(n, -n.dot(pt)));
                });
            });
            viewer.renderer.clippingPlanes = planes;
        } catch (e) { console.warn('[scaling-tool] anteprima fetta non disponibile', e); }
    }

    function setSlice(on) {
        S.cam.slice = !!on;
        if (S.cam.slice) {
            S.cam.show = true;
            if (!S.cam.look) setLook(true);                   // guardata dalla camera si vede com'e' l'immagine
            cameraChanged();
        } else {
            removeSlice();
            cameraChanged();
        }
    }

    function setLook(on) {
        S.cam.look = !!on;
        S.ui.look.checked = S.cam.look;
        if (S.cam.look) applyCameraPreview();
        else { try { viewer.setCameraMode(Potree.CameraMode.PERSPECTIVE); } catch (e) { /* ignora */ } }
    }

    // Da chiamare dopo ogni modifica di S.cam: aggiorna campi, riquadro 3D, stima e anteprima.
    // Non ridisegna il pannello (slider e campi non devono perdere trascinamento e focus).
    function cameraChanged(source) {
        var ui = S.ui;
        ui.rows.forEach(function (row) { row.refresh(source); });
        if (document.activeElement !== ui.w) ui.w.value = S.cam.w;
        if (document.activeElement !== ui.h) ui.h.value = S.cam.h;
        ui.clip.checked = !!S.cam.clipOn;
        [[ui.clipStart, 'clipStart'], [ui.clipEnd, 'clipEnd']].forEach(function (pair) {
            pair[0].disabled = !S.cam.clipOn;
            if (document.activeElement !== pair[0]) pair[0].value = S.cam[pair[1]];
        });
        ui.source.value = S.cam.src;
        ui.annot.checked = !!S.cam.annotate;
        ui.pointRow.style.display = S.cam.src === 'cloud' ? 'flex' : 'none';
        ui.show.checked = !!S.cam.show;
        ui.presets.forEach(function (b) {
            var on = b.__rot.every(function (v, i) { return Math.abs(((v - S.cam.rot[i]) % 360 + 540) % 360 - 180) < 1e-6; });
            b.style.background = on ? '#c8e6c9' : '#f4f4f4';
            b.style.borderColor = on ? '#2e7d32' : '#888';
        });
        if (S.cam.slice && !S.cam.clipOn) S.cam.slice = false;
        ui.sliceBtn.disabled = !S.cam.clipOn;
        ui.sliceBtn.textContent = S.cam.slice ? T('✂ Chiudi anteprima della fetta') : T('✂ Anteprima della fetta');
        ui.sliceBtn.style.background = S.cam.slice ? '#c8e6c9' : '#f4f4f4';
        if (!S.cam.slice && S.sliceVol) removeSlice();
        updateGizmo();
        updateOrthoEstimate();
        applyCameraPreview();
        updateSlice();
    }

    function setPreset(rot) {
        S.cam.rot = rot.slice();
        S.cam.show = true;
        fitCamera();
    }

    // Copia nella camera la vista corrente: stessa direzione, centrata sul punto che stai guardando
    function cameraFromView() {
        var view = viewer.scene.view, half = function (deg) { return Math.round(deg * 2) / 2; };
        S.cam.rot = [half(90 + view.pitch * 180 / Math.PI), 0, half(view.yaw * 180 / Math.PI)];
        var p = view.getPivot();
        if (p.toArray().every(isFinite)) {
            // arretrata lungo l'asse di vista fin fuori dal modello, cosi' il taglio non elimina nulla
            var ax = cameraAxes(S.cam.rot), depth = -Infinity;
            modelCorners().forEach(function (c) { depth = Math.max(depth, dot(ax.back, c)); });
            var k = isFinite(depth) ? depth + 1 - dot(ax.back, p.toArray()) : 0;
            S.cam.pos = [0, 1, 2].map(function (i) { return Math.round((p.toArray()[i] + ax.back[i] * k) * 100) / 100; });
        }
        S.cam.show = true;
        cameraChanged();
    }

    function startOrtho() {
        var res = orthoResolution();
        if (!res) { S.msg = T('Inserisci la risoluzione (cm per pixel) oppure scala e DPI.'); return render(); }
        if (!S.saved) { S.msg = T('Salva la trasformazione prima di generare l\'ortofoto.'); return render(); }
        if (!(S.cam.w > 0) || !(S.cam.h > 0)) { S.msg = T('Imposta larghezza e altezza dell\'inquadratura.'); return render(); }
        if (S.cam.clipOn && !(S.cam.clipEnd > S.cam.clipStart)) {
            S.msg = T('Clip end deve essere maggiore di clip start.'); return render();
        }
        var body = {source: S.cam.src, rotation: S.cam.rot, position: S.cam.pos, width: S.cam.w, height: S.cam.h};
        if (S.cam.clipOn) { body.clip_start = S.cam.clipStart; body.clip_end = S.cam.clipEnd; }
        if (S.cam.src === 'cloud' && S.cam.pointSize) body.point_size = S.cam.pointSize;
        if (S.cam.annotate) body.annotate = true;
        if (res.scale) { body.scale = res.scale; body.dpi = res.dpi; } else { body.resolution_cm = res.cm; }
        api('POST', API + '/ortho', body).then(function () {
            S.orthoState = {state: 'running', message: 'Avvio...', progress: 0, results: (S.orthoState || {}).results || []};
            S.msg = ''; render(); pollOrtho();
        }, function (e) {
            S.msg = T('Ortofoto non avviata: {e}', {e: TS(e)}) + (e === 'HTTP 404' ? ' — ' + T(RESTART_HINT) : '');
            render();
        });
    }

    function deleteOrtho(r) {
        askConfirm(T('Eliminare questa ortofoto ({label}, {w} × {h} pixel)?', {label: T(r.label), w: r.size_px[0], h: r.size_px[1]}), function () {
            api('DELETE', API + '/ortho?name=' + encodeURIComponent(r.name)).then(pollOrtho, function (e) {
                S.msg = T('Eliminazione non riuscita: {e}', {e: TS(e)}); render();
            });
        });
    }

    // ---------------------------------------------------------------- anteprima e salvataggio degli scatti
    // [estensione, descrizione, tipo MIME] nell'ordine in cui vengono proposti
    var SAVE_FORMATS = [
        ['png', 'PNG — sfondo trasparente', 'image/png'],
        ['jpg', 'JPEG — sfondo bianco, file piccolo', 'image/jpeg'],
        ['tif', 'TIFF — con coordinate in metri (GIS, CAD)', 'image/tiff'],
        ['pdf', 'PDF \u2014 in scala, pronto per la stampa', 'application/pdf'],
        ['points', 'Punti di controllo per QGIS (.points)', 'text/plain']
    ];

    // File di uno scatto per estensione: {png: {name, url}, jpg: ..., preview: ...}
    function orthoFiles(r) {
        var out = {};
        (r.files || []).forEach(function (f) {
            if (/_preview\./.test(f.name)) out.preview = f;
            else out[f.name.replace(/^.*\./, '').toLowerCase()] = f;
        });
        return out;
    }

    // ---- come si presentano gli scatti nell'elenco e nella finestra
    // Vista in poche parole: "Prospetto frontale", "Pianta", "Camera 75/0/-25"
    function orthoView(r) {
        if (r.view && r.view !== 'custom') return String(T(r.label)).replace(/\s*[(（].*?[)）]/g, '');
        return T('Camera {rot}', {rot: (r.rotation || []).map(function (v) { return Math.round(v * 10) / 10; }).join('/')});
    }

    // Data e ora dello scatto: solo l'ora se e' di oggi
    function orthoWhen(r) {
        var d = new Date((r.created || 0) * 1000), p = function (n) { return (n < 10 ? '0' : '') + n; };
        var hm = p(d.getHours()) + ':' + p(d.getMinutes());
        return d.toDateString() === new Date().toDateString() ? T('ore {t}', {t: hm}) : p(d.getDate()) + '/' + p(d.getMonth() + 1) + ' ' + hm;
    }

    // Titolo: cosa e' stato fotografato e da dove. "Mesh · Prospetto frontale" / "Nuvola · Pianta"
    function orthoTitle(r) {
        return (r.source === 'cloud' ? T('Nuvola') : T('Mesh')) + ' · ' + orthoView(r);
    }

    // Dettagli: misure, risoluzione o scala, clip e punti di georeferenziazione
    function orthoDetails(r) {
        var unit = r.scale_set ? ' m' : ' ' + T('u.m.'), parts = [
            r.size_m[0].toFixed(1) + ' × ' + r.size_m[1].toFixed(1) + unit,
            r.scale ? T('scala 1:{n} a {dpi} dpi', {n: r.scale, dpi: r.dpi}) : r.resolution_cm + ' cm/pixel',
            r.size_px[0] + ' × ' + r.size_px[1] + ' px'];
        if (r.clip && r.clip.length) parts.push('clip ' + (r.clip[0] == null ? 0 : r.clip[0]) + '–' + (r.clip[1] == null ? '∞' : r.clip[1]) + ' m');
        else if (r.clip) parts.push(T('sezione'));
        if (r.epsg) parts.push('EPSG:' + r.epsg);
        if (r.georef && r.georef.points && r.georef.points.length) parts.push(T('con punti QGIS'));
        return parts.join(' · ');
    }

    // Nome proposto per il salvataggio, es. "prospetto_frontale_1-50_300dpi.png"
    function orthoFileName(r, ext) {
        var base = String((r.label || 'ortofoto') + (r.source === 'cloud' ? ' nuvola' : '')).replace(/\(.*?\)/g, '').toLowerCase()
            .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'ortofoto';
        base += r.scale ? '_1-' + r.scale + '_' + r.dpi + 'dpi' : '_' + String(r.resolution_cm).replace('.', '-') + 'cm';
        return base + '.' + ext;
    }

    // Salva lo scatto nel formato scelto. Nei browser recenti apre la finestra di sistema dove
    // si scelgono cartella, nome e formato. Nell'app desktop di WebODM (Chromium 83) quella
    // finestra non esiste: si avvia un download, che l'app accompagna con "Salva con nome".
    function saveOrtho(r, ext, say) {
        var files = orthoFiles(r), file = files[ext];
        if (!file) return say(T('Formato non disponibile per questo scatto.'));
        var name = orthoFileName(r, ext);
        if (window.showSaveFilePicker) {
            var available = SAVE_FORMATS.filter(function (f) { return files[f[0]]; });
            available.sort(function (a, b) { return (b[0] === ext) - (a[0] === ext); });       // il formato scelto per primo
            var types = available.map(function (f) {
                var accept = {}; accept[f[2]] = ['.' + f[0]];
                return {description: T(f[1]), accept: accept};
            });
            window.showSaveFilePicker({suggestedName: name, types: types}).then(function (handle) {
                // se nella finestra e' stato cambiato il formato, si salva quello
                var chosen = ((handle.name.match(/\.(\w+)$/) || [])[1] || ext).toLowerCase();
                chosen = {jpeg: 'jpg', tiff: 'tif'}[chosen] || chosen;
                var src = files[chosen] || file;
                say(T('Salvataggio in corso...'));
                return fetch(src.url, {credentials: 'same-origin'}).then(function (resp) {
                    if (!resp.ok) throw new Error('HTTP ' + resp.status);
                    return resp.blob();
                }).then(function (blob) {
                    return handle.createWritable().then(function (w) {
                        return w.write(blob).then(function () { return w.close(); });
                    });
                }).then(function () { say(T('Salvato: {f}', {f: handle.name})); });
            }).catch(function (e) {
                if (e && e.name === 'AbortError') return say('');                  // finestra annullata
                say(T('Salvataggio non riuscito: {e}', {e: e && e.message || e}));
            });
            return;
        }
        var a = h('a', {href: file.url, download: name, style: 'display:none;'});
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        say(T('Scegli la cartella nella finestra "Salva con nome" (se non compare, il file e\' nella cartella Download).'));
    }

    function closeViewer() {
        if (!S.viewer) return;
        window.removeEventListener('keydown', S.viewer.onKey, true);
        window.removeEventListener('mousemove', S.viewer.onMove);
        window.removeEventListener('mouseup', S.viewer.onUp);
        window.removeEventListener('resize', S.viewer.onResize);
        if (S.viewer.el.parentNode) S.viewer.el.parentNode.removeChild(S.viewer.el);
        S.viewer = null;
    }

    // Finestra a tutto schermo con l'anteprima dello scatto: zoom, trascinamento, adatta, 1:1 e Salva.
    // Lo zoom `k` e' sempre riferito ai pixel dell'immagine a piena risoluzione (k = 1 -> 1:1),
    // anche mentre e' visualizzata l'anteprima ridotta.
    function openViewer(r) {
        closeViewer();
        var files = orthoFiles(r), fullW = r.size_px[0], fullH = r.size_px[1];
        var big = files.png || files.jpg, megapixel = fullW * fullH / 1e6;
        var v = {k: 1, x: 0, y: 0, natW: 0, fitted: false, drag: null};

        var img = h('img', {draggable: 'false', alt: '', style: 'position:absolute;left:0;top:0;transform-origin:0 0;' +
            'max-width:none;max-height:none;user-select:none;-webkit-user-drag:none;box-shadow:0 0 0 1px #777;' +
            // scacchiera sotto le zone trasparenti
            'background:#fff linear-gradient(45deg,#ddd 25%,transparent 25%,transparent 75%,#ddd 75%) 0 0/20px 20px,' +
            'linear-gradient(45deg,#ddd 25%,transparent 25%,transparent 75%,#ddd 75%) 10px 10px/20px 20px;'});
        var stage = h('div', {style: 'position:relative;flex:1;overflow:hidden;cursor:grab;background:#2b2b2b;'}, img);
        var zoomLabel = h('span', {style: 'display:inline-block;min-width:52px;text-align:center;'}, '');
        var note = h('span', {style: 'margin-left:10px;color:#ffe082;'}, '');
        var say = function (t) { note.textContent = t; };

        var apply = function () {
            if (!v.natW) return;
            img.style.transform = 'translate(' + v.x + 'px,' + v.y + 'px) scale(' + (v.k * fullW / v.natW) + ')';
            zoomLabel.textContent = Math.round(v.k * 100) + '%';
        };
        var fitK = function () {
            return Math.min(stage.clientWidth / fullW, stage.clientHeight / fullH) * 0.96;
        };
        var fit = function () {
            v.k = fitK();
            v.x = (stage.clientWidth - fullW * v.k) / 2;
            v.y = (stage.clientHeight - fullH * v.k) / 2;
            apply();
        };
        // zoom tenendo fermo il punto (cx, cy) della finestra
        var zoomAt = function (cx, cy, k2) {
            k2 = Math.max(Math.min(fitK() * 0.5, 1), Math.min(k2, 8));
            v.x = cx - (cx - v.x) * k2 / v.k;
            v.y = cy - (cy - v.y) * k2 / v.k;
            v.k = k2;
            apply();
        };
        var zoomCenter = function (k2) { zoomAt(stage.clientWidth / 2, stage.clientHeight / 2, k2); };

        img.addEventListener('load', function () {
            v.natW = img.naturalWidth;
            if (!v.fitted) { v.fitted = true; fit(); } else apply();
        });
        img.src = (files.preview || big || {}).url || '';
        if (big && megapixel <= 40) {                    // poi, senza attese, la piena risoluzione
            var hi = new Image();
            hi.onload = function () { if (S.viewer && S.viewer.r === r) img.src = hi.src; };
            hi.src = big.url;
        } else if (files.preview) {
            say(T('Immagine molto grande: qui vedi l\'anteprima ridotta, il file salvato e\' a piena risoluzione.'));
        }

        stage.addEventListener('wheel', function (e) {
            e.preventDefault();
            var b = stage.getBoundingClientRect();
            zoomAt(e.clientX - b.left, e.clientY - b.top, v.k * (e.deltaY < 0 ? 1.2 : 1 / 1.2));
        }, {passive: false});
        stage.addEventListener('mousedown', function (e) {
            if (e.button !== 0) return;
            v.drag = {mx: e.clientX, my: e.clientY, x: v.x, y: v.y};
            stage.style.cursor = 'grabbing';
            e.preventDefault();
        });
        stage.addEventListener('dblclick', fit);

        var bStyle = 'margin:0 3px;padding:5px 10px;border:1px solid #777;border-radius:4px;background:#444;color:#fff;' +
            'cursor:pointer;font-size:13px;';
        var tb = function (label, title, fn, extra) {
            return h('button', {type: 'button', title: title, style: bStyle + (extra || ''), onclick: fn}, label);
        };
        var format = h('select', {title: T('Formato del file'), style: 'margin:0 3px 0 14px;padding:5px;font-size:13px;'},
            SAVE_FORMATS.filter(function (f) { return files[f[0]]; }).map(function (f) {
                return h('option', {value: f[0]}, T(f[1]));
            }));
        var info = '#' + (r.number || '?') + ' \u00B7 ' + orthoWhen(r) + ' \u00B7 ' + orthoTitle(r) + '  \u2014  ' + orthoDetails(r);
        var bar = h('div', {style: 'display:flex;align-items:center;flex-wrap:wrap;padding:8px 10px;background:#1e1e1e;' +
            'color:#eee;font:13px sans-serif;border-bottom:1px solid #555;'}, [
            tb('−', T('Riduci (rotella del mouse)'), function () { zoomCenter(v.k / 1.25); }, 'font-weight:bold;'),
            zoomLabel,
            tb('+', T('Ingrandisci (rotella del mouse)'), function () { zoomCenter(v.k * 1.25); }, 'font-weight:bold;'),
            tb(T('Adatta'), T('Tutta l\'immagine nella finestra (doppio clic)'), fit),
            tb('1:1', T('Dimensione reale: un pixel dell\'immagine = un pixel dello schermo'), function () { zoomCenter(1); }),
            tb(T('Max'), T('Ingrandimento massimo'), function () { zoomCenter(8); }),
            format,
            tb(T('💾 SALVA…'), T('Scegli cartella e nome del file'), function () { saveOrtho(r, format.value, say); },
                'background:#2e7d32;border-color:#2e7d32;font-weight:bold;'),
            note,
            h('span', {style: 'flex:1;'}),
            tb(T('✕ Chiudi'), T('Chiudi (Esc)'), closeViewer)
        ]);
        var foot = h('div', {style: 'padding:5px 10px;background:#1e1e1e;color:#bbb;font:12px sans-serif;border-top:1px solid #555;'},
            info + '   —   ' + T('trascina per spostare, rotella per lo zoom, doppio clic per adattare'));
        var el = h('div', {id: 'scaling-tool-viewer', dir: I18N.dir(), style: 'position:fixed;left:0;top:0;right:0;bottom:0;z-index:1000000;' +
            'display:flex;flex-direction:column;background:#2b2b2b;'}, [bar, stage, foot]);
        document.body.appendChild(el);

        S.viewer = {
            el: el, r: r,
            onKey: function (e) {
                if (e.key === 'Escape') closeViewer();
                else if (e.key === '+' || e.key === '=') zoomCenter(v.k * 1.25);
                else if (e.key === '-') zoomCenter(v.k / 1.25);
                else if (e.key === '0') fit();
                else if (e.key === '1') zoomCenter(1);
                else return;
                e.stopPropagation(); e.preventDefault();
            },
            onMove: function (e) {
                if (!v.drag) return;
                v.x = v.drag.x + e.clientX - v.drag.mx;
                v.y = v.drag.y + e.clientY - v.drag.my;
                apply();
            },
            onUp: function () { v.drag = null; stage.style.cursor = 'grab'; },
            onResize: function () { if (v.natW) fit(); }
        };
        window.addEventListener('keydown', S.viewer.onKey, true);
        window.addEventListener('mousemove', S.viewer.onMove);
        window.addEventListener('mouseup', S.viewer.onUp);
        window.addEventListener('resize', S.viewer.onResize);
    }

    // ---------------------------------------------------------------- ortofoto sulla Mappa 2D
    function loadMapState() {
        api('GET', API + '/map-ortho').then(function (st) { S.map = st; render(); }, function () { S.map = null; });
    }

    function publishToMap(r) {
        var size = r.size_m[0].toFixed(1) + ' × ' + r.size_m[1].toFixed(1) + ' m, ' + r.resolution_cm + ' cm/pixel';
        if (r.epsg) {
            return askConfirm([
                T('Nella Mappa 2D di WebODM comparira\' questa pianta al posto dell\'ortofoto attuale ({size}).', {size: size}),
                T('• E\' georiferita in EPSG:{epsg}: la posizione sul globo e le distanze sono quelle vere.', {epsg: r.epsg}) + '\n' +
                    T('• L\'ortofoto originale NON viene cancellata: puoi rimetterla con "Ripristina ortofoto originale".'),
                T('Vuoi procedere?')
            ].join('\n\n'), function () { doPublishToMap(r); });
        }
        var text = [
            T('ATTENZIONE: stai per sostituire l\'ortofoto di questo task.'),
            T('Nella Mappa 2D di WebODM comparira\' questa pianta ({size}) al posto dell\'ortofoto attuale.', {size: size}),
            T('• L\'ortofoto originale NON viene cancellata: ne resta una copia e puoi rimetterla quando vuoi con "Ripristina ortofoto originale".') + '\n' +
                T('• La posizione sul globo e\' fittizia, perche\' il modello non e\' georeferenziato; le distanze misurate sulla Mappa saranno pero\' in metri reali.') + '\n' +
                T('• Gli scatti della camera restano esportazioni separate e non vengono toccati.'),
            T('Vuoi procedere?')
        ].join('\n\n');
        askConfirm(text, function () { doPublishToMap(r); });
    }

    function doPublishToMap(r) {
        S.msg = T('Pubblicazione sulla Mappa in corso...'); render();
        api('POST', API + '/map-ortho', {name: r.name}).then(function (st) {
            S.map = st; S.msg = T('Fatto: la Mappa 2D ora mostra questa pianta.'); render();
        }, function (e) { S.msg = T('Pubblicazione non riuscita: {e}', {e: TS(e)}) + (e === 'HTTP 404' ? ' — ' + T(RESTART_HINT) : ''); render(); });
    }

    function restoreMap() {
        askConfirm(T('Rimettere nella Mappa 2D l\'ortofoto originale del task?'), function () {
            api('DELETE', API + '/map-ortho').then(function (st) {
                S.map = st; S.msg = T('Ortofoto originale ripristinata.'); render();
            }, function (e) { S.msg = T('Ripristino non riuscito: {e}', {e: TS(e)}); render(); });
        });
    }

    // Il codice Python del plugin viene caricato solo all'avvio di WebODM
    var RESTART_HINT = 'il plugin e\' stato aggiornato: riavvia WebODM per attivare questa funzione.';

    var orthoTimer = null, orthoFailures = 0;
    function pollOrtho() {
        clearTimeout(orthoTimer);
        api('GET', API + '/ortho').then(function (st) {
            orthoFailures = 0;
            var wasRunning = S.orthoState && S.orthoState.state === 'running';
            var okey = JSON.stringify(st);
            S.orthoState = st;
            if (okey !== S.orthoKey) { S.orthoKey = okey; render(); }
            if (wasRunning && st.state === 'done' && st.result) {       // scatto appena finito: anteprima e Salva
                var fresh = (st.results || []).filter(function (r) { return r.name === st.result; })[0];
                if (fresh) openViewer(fresh);
            }
            if (st.state === 'running') orthoTimer = setTimeout(pollOrtho, 1000);
        }, function (e) {
            if (e === 'HTTP 404') {           // server non ancora riavviato: inutile insistere
                S.orthoState = {state: 'error', message: T('Funzione non attiva') + ' — ' + T(RESTART_HINT), results: []};
                return render();
            }
            if (++orthoFailures < 5) orthoTimer = setTimeout(pollOrtho, 4000);
        });
    }

    // ---------------------------------------------------------------- UI
    function h(tag, attrs, kids) {
        var e = document.createElement(tag);
        Object.keys(attrs || {}).forEach(function (k) {
            if (attrs[k] == null || attrs[k] === false) return;      // attributo assente
            if (k === 'style') e.style.cssText = attrs[k];
            else if (k.indexOf('on') === 0) e.addEventListener(k.slice(2), attrs[k]);
            else e.setAttribute(k, attrs[k]);
        });
        [].concat(kids || []).forEach(function (c) {
            if (c == null) return;
            e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
        });
        return e;
    }

    function btn(label, fn, opts) {
        opts = opts || {};
        return h('button', {
            type: 'button', onclick: fn, disabled: opts.disabled ? 'disabled' : null,
            style: 'display:block;width:100%;margin:3px 0;padding:5px 8px;text-align:start;cursor:pointer;' +
                'border:1px solid ' + (opts.active ? '#2e7d32' : '#888') + ';border-radius:4px;' +
                'background:' + (opts.active ? '#c8e6c9' : '#f4f4f4') + ';color:#111;font-size:12px;' +
                (opts.disabled ? 'opacity:.5;cursor:default;' : '')
        }, label);
    }

    function unitLabel() { return S.params.scale !== 1 ? 'm' : T('u.m. (non scalate)'); }
    function fmt(x) { return (Math.abs(x) >= 1000 ? x.toFixed(2) : x.toFixed(3)); }

    function readout() {
        if (S.mode !== 'measure' || S.marks.length < 2) return null;
        var a = origToCur(S.marks[0]), b = origToCur(S.marks[1]);
        var dv = b.clone().sub(a), dh = Math.hypot(dv.x, dv.y), u = unitLabel();
        return h('div', {style: 'margin:4px 0;padding:5px;background:#fffde7;border:1px solid #d4c84a;border-radius:4px;'}, [
            h('div', {style: 'font-weight:bold;'}, T('Distanza 3D: {v}', {v: fmt(dv.length()) + ' ' + u})),
            h('div', {}, T('Orizzontale (XY): {v}', {v: fmt(dh) + ' ' + u})),
            h('div', {}, T('Verticale (ΔZ): {v}', {v: fmt(dv.z) + ' ' + u})),
            h('div', {style: 'margin-top:5px;'}, T('Distanza reale tra A e B (metri):')),
            S.ui.real,
            btn(T('Imposta come scala'), applyScale)
        ]);
    }

    function status() {
        var p = S.params, bits = [];
        bits.push(T('Scala: {v}', {v: p.scale !== 1 ? T('1 u.m. = {s} m', {s: p.scale.toPrecision(5)}) : T('non impostata')}));
        bits.push(T('Asse Z: {v}', {v: p.up ? T('definito') : T('originale')}));
        bits.push(T('Asse X: {v}', {v: p.xdir ? T('definito') : T('originale')}));
        bits.push(T('Origine: {v}', {v: p.origin ? T('definita') : T('originale')}));
        if (S.meshCount) bits.push(T('Mesh: segue la nuvola ✔'));
        bits.push(S.saved ? T('Salvato ✔') : T('Non salvato'));
        return h('div', {style: 'font-size:11px;line-height:1.5;color:#333;margin:6px 0;'},
            bits.map(function (b) { return h('div', {}, b); }));
    }

    function exportBox() {
        var st = S.exportState;
        if (!st || st.state === 'idle') return null;
        var kids = [h('div', {}, (st.state === 'running' ? T('Export: {m}', {m: TS(st.message || '')}) : TS(st.message || '')))];
        if (st.state === 'running') {
            kids.push(h('div', {style: 'height:6px;background:#ddd;border-radius:3px;margin:3px 0;'},
                h('div', {style: 'height:6px;border-radius:3px;background:#2e7d32;width:' + (st.progress || 0) + '%;'})));
        }
        (st.files || []).forEach(function (f) {
            kids.push(h('a', {href: f.url, target: '_blank', download: f.name,
                style: 'display:block;color:#0b57d0;'}, '⬇ ' + f.name));
        });
        return h('div', {style: 'font-size:11px;margin-top:6px;padding:5px;background:#e8f5e9;border-radius:4px;'}, kids);
    }

    // Ridisegna il pannello. Chi sta scrivendo in una casella non deve accorgersene: il ridisegno stacca
    // e riattacca i campi, e staccare un campo col focus lo fa perdere (e il testo smette di arrivare).
    function render() {
        var ui = S.ui, f = document.activeElement, keep = null, range = null;
        if (ui && f && ui.panel.contains(f) && /^(INPUT|SELECT|TEXTAREA)$/.test(f.tagName)) {
            keep = f;
            try { range = [f.selectionStart, f.selectionEnd]; } catch (e) { range = null; }   // i campi numerici non hanno cursore
        }
        renderBody();
        if (keep && keep.parentNode && document.activeElement !== keep) {
            keep.focus();
            if (range && range[0] != null) { try { keep.setSelectionRange(range[0], range[1]); } catch (e) { /* ignora */ } }
        }
    }

    function renderBody() {
        var ui = S.ui;
        if (!ui) return;
        var body = ui.body;
        // non distruggere l'input (perde il valore/focus): lo stacchiamo prima
        [ui.real, ui.camBox].concat(S.persist).forEach(function (el) {
            if (el.parentNode) el.parentNode.removeChild(el);
        });
        body.innerHTML = '';
        ui.toggle.textContent = S.collapsed ? '▸' : '▾';
        body.style.display = S.collapsed ? 'none' : 'block';
        if (S.collapsed) return;

        var sec = function (t) { return h('div', {style: 'font-weight:bold;margin:8px 0 2px;font-size:11px;text-transform:uppercase;color:#555;'}, T(t)); };
        body.appendChild(sec('1. Distanza e scala'));
        body.appendChild(btn(T(MODES.measure.label), function () { startMode('measure'); }, {active: S.mode === 'measure'}));
        var ro = readout(); if (ro) body.appendChild(ro);

        body.appendChild(sec('2. Asse Z (verticale)'));
        body.appendChild(btn(T(MODES.upLine.label), function () { startMode('upLine'); }, {active: S.mode === 'upLine'}));
        body.appendChild(btn(T(MODES.upPlane.label), function () { startMode('upPlane'); }, {active: S.mode === 'upPlane'}));
        if (S.mode === 'upPlane') {
            body.appendChild(btn(T('Calcola dal piano ({n} punti)', {n: S.marks.length}), computePlane, {disabled: S.marks.length < 3}));
        }
        if (S.params.up) body.appendChild(btn(T('⇅ Inverti Z'), flipUp));

        body.appendChild(sec('3. Piano XY e origine'));
        body.appendChild(btn(T(MODES.xdir.label), function () { startMode('xdir'); }, {active: S.mode === 'xdir'}));
        body.appendChild(btn(T('↔ X parallelo alla vista (destra)'), xParallelToViewer));
        body.appendChild(btn(T('◉ X verso di me'), xToViewer));
        body.appendChild(btn(T('⇄ Inverti X'), flipX));
        body.appendChild(btn(T(MODES.origin.label), function () { startMode('origin'); }, {active: S.mode === 'origin'}));

        body.appendChild(status());
        if (S.msg) body.appendChild(h('div', {style: 'font-size:11px;color:#8a4b00;margin:4px 0;'}, S.msg));

        body.appendChild(btn(T('💾 Salva nel task'), save, {disabled: !S.canEdit}));
        body.appendChild(btn(T('⇩ Esporta (LAZ, OBJ, matrice)'), startExport, {disabled: !S.canEdit || !S.saved || (S.exportState && S.exportState.state === 'running')}));
        body.appendChild(btn(T('⌖ Inquadra modello'), function () { viewer.fitToScreen(); }));
        body.appendChild(btn(T('↺ Ripristina originale'), resetAll));
        if (!S.canEdit) body.appendChild(h('div', {style: 'font-size:11px;color:#a00;'}, T('Sola lettura: serve il permesso di modifica del progetto per salvare/esportare.')));
        var eb = exportBox(); if (eb) body.appendChild(eb);
        S.modules.forEach(function (mod) { if (mod.section) mod.section(body, sec); });
        orthoSection(body, sec);
    }

    function orthoSection(body, sec) {
        var ui = S.ui, st = S.orthoState || {}, running = st.state === 'running';
        body.appendChild(sec('5. Ortofoto dalla mesh'));
        body.appendChild(ui.camBox);
        updateOrthoEstimate();
        if (S.params.scale === 1) {
            body.appendChild(h('div', {style: 'font-size:11px;color:#8a4b00;'},
                T('Scala del modello non impostata: metri e scale di stampa non sono reali.')));
        }
        body.appendChild(btn(T('▣ Scatta l\'ortofoto'), startOrtho, {disabled: !S.canEdit || !S.saved || running}));
        if (!S.saved) {
            body.appendChild(h('div', {style: 'font-size:11px;color:#555;'}, T('Serve una trasformazione salvata ("Salva nel task").')));
        }
        if (st.state === 'running' || st.state === 'error') {
            var kids = [h('div', {style: st.state === 'error' ? 'color:#a00;' : ''}, TS(st.message || ''))];
            if (running) {
                kids.push(h('div', {style: 'height:6px;background:#ddd;border-radius:3px;margin:3px 0;'},
                    h('div', {style: 'height:6px;border-radius:3px;background:#2e7d32;width:' + (st.progress || 0) + '%;'})));
            }
            body.appendChild(h('div', {style: 'font-size:11px;margin-top:4px;padding:5px;background:#f3f3f3;border-radius:4px;'}, kids));
        }

        var map = S.map || {};
        if (map.published) {
            body.appendChild(h('div', {style: 'font-size:11px;margin-top:6px;padding:5px;background:#fff8e1;border:1px solid #e0c36a;border-radius:4px;'}, [
                h('div', {style: 'font-weight:bold;'}, T('La Mappa 2D mostra una pianta generata qui')),
                h('a', {href: map.map_url, target: '_blank', style: 'color:#0b57d0;'}, T('Apri la Mappa 2D')),
                map.has_backup ? btn(T('↺ Ripristina ortofoto originale'), restoreMap, {disabled: !S.canEdit}) : null
            ]));
        }

        // Scatti fatti: del piu' vecchio al piu' recente si numerano #1, #2...; in elenco il piu' recente sta in alto.
        // Ogni scatto e' una riga compatta (miniatura + titolo + dettagli); il piu' recente e' aperto, gli altri si aprono con un clic.
        var results = (st.results || []).slice();
        results.sort(function (a, b) { return (a.created || 0) - (b.created || 0); });
        results.forEach(function (r, i) { r.number = i + 1; });
        results.reverse();
        if (results.length) {
            body.appendChild(h('div', {style: 'font-weight:bold;font-size:11px;margin:8px 0 2px;color:#555;'},
                T('SCATTI FATTI ({n}) — clic su una riga per aprirla', {n: results.length})));
        }
        results.forEach(function (r, index) {
            var byExt = {};
            (r.files || []).forEach(function (f) { byExt[f.name.replace(/^.*?(_preview)?\.(\w+)$/, '$1.$2')] = f; });
            var preview = byExt['_preview.jpg'];
            var onMap = map.published === r.name;
            var open = S.openShots[r.name] !== undefined ? S.openShots[r.name] : index === 0;
            var toggleRow = function () { S.openShots[r.name] = !open; render(); };

            var head = h('div', {title: open ? T('Richiudi') : T('Apri'), onclick: toggleRow,
                style: 'display:flex;align-items:center;cursor:pointer;'}, [
                preview ? h('img', {src: preview.url + '?t=' + r.created, alt: '',
                    style: 'width:44px;height:44px;object-fit:contain;flex:none;margin-right:6px;border:1px solid #bbb;background:#fff;'}) : null,
                h('div', {style: 'flex:1;min-width:0;'}, [
                    h('div', {style: 'font-weight:bold;'}, '#' + r.number + ' · ' + orthoWhen(r) + ' · ' + orthoTitle(r)),
                    h('div', {style: 'color:#444;'}, orthoDetails(r))]),
                h('span', {style: 'margin-left:4px;color:#555;'}, open ? '▾' : '▸')]);

            var kids = [head];
            if (onMap) kids.push(h('div', {style: 'color:#8a4b00;font-weight:bold;margin-top:3px;'}, T('Questa e\' l\'ortofoto mostrata nella Mappa 2D')));
            if (open) {
                if (preview) {
                    kids.push(h('img', {src: preview.url + '?t=' + r.created, title: T('Apri a tutto schermo'),
                        onclick: function () { openViewer(r); },
                        style: 'width:100%;margin:5px 0 3px;border:1px solid #bbb;background:#fff;cursor:zoom-in;'}));
                }
                kids.push(btn(T('💾 Apri a tutto schermo e salva…'), function () { openViewer(r); }));
                var links = [];
                (r.files || []).forEach(function (f) {
                    if (/_preview\./.test(f.name)) return;
                    links.push(h('a', {href: f.url, target: '_blank', download: f.name,
                        style: 'display:inline-block;margin-right:8px;color:#0b57d0;'}, '⬇ ' + f.name.replace(/^.*\./, '.')));
                });
                kids.push(h('div', {title: T('Scarica direttamente un formato')}, links));
                if (r.view === 'top' && !onMap) {
                    kids.push(btn(T('🗺 Mostra nella Mappa 2D (sostituisce l\'ortofoto)'), function () { publishToMap(r); },
                        {disabled: !S.canEdit}));
                }
                kids.push(h('a', {href: '#', style: 'color:#a00;', onclick: function (e) { e.preventDefault(); deleteOrtho(r); }}, T('Elimina questo scatto')));
            }
            body.appendChild(h('div', {style: 'font-size:11px;margin-top:5px;padding:5px;background:' + (open ? '#e8f5e9' : '#f1f6f1') +
                ';border:1px solid #cfe3cf;border-radius:4px;'}, kids));
        });
    }

    function buildUI() {
        var real = h('input', {type: 'text', inputmode: 'decimal',
            style: 'width:100%;box-sizing:border-box;padding:4px;margin:3px 0;'});
        ta(real, 'placeholder', 'es. 2.50');
        var toggle = h('span', {style: 'cursor:pointer;margin-right:6px;'}, '▾');
        var langSel = h('select', {style: 'flex:none;margin:0 6px;font-size:10px;width:78px;padding:0;color:#111;background:#fff;font-weight:normal;'},
            [h('option', {value: 'auto'}, tn('Lingua del sistema'))].concat(I18N.langs.map(function (l) {
                return h('option', {value: l[0]}, l[1]);
            })));
        ta(langSel, 'title', 'Lingua');
        langSel.value = I18N.pref();
        langSel.addEventListener('change', function () { I18N.setLang(langSel.value); });
        var titleText = h('span', {style: 'flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'}, tn('Scala & Orientamento'));
        var title = h('div', {style: 'padding:6px 8px;background:#2c3e50;color:#fff;font-weight:bold;font-size:12px;' +
            'cursor:move;border-radius:6px 6px 0 0;user-select:none;direction:ltr;display:flex;align-items:center;'}, [toggle,
            titleText,
            langSel, h('span', {style: 'flex:none;font-weight:normal;opacity:.7;'}, 'v' + VERSION)]);
        var body = h('div', {style: 'padding:6px 8px;max-height:75vh;overflow:auto;'});
        var panel = h('div', {id: 'scaling-tool-panel', dir: I18N.dir(), lang: I18N.current(), style: 'position:fixed;top:70px;left:10px;width:280px;z-index:2000;' +
            'background:#fff;color:#111;border:1px solid #555;border-radius:6px;box-shadow:0 2px 10px rgba(0,0,0,.4);' +
            'font-family:sans-serif;font-size:12px;'}, [title, body]);
        document.body.appendChild(panel);

        toggle.addEventListener('click', function () { S.collapsed = !S.collapsed; render(); });
        // trascinamento del pannello
        var drag = null;
        title.addEventListener('mousedown', function (e) {
            if (S.docked || e.target === toggle || e.target === langSel || e.target.tagName === 'OPTION') return;
            var r = panel.getBoundingClientRect();
            drag = {dx: e.clientX - r.left, dy: e.clientY - r.top};
            S.panelMoved = true;             // da qui in poi decide l'utente dove sta
            e.preventDefault();
        });
        window.addEventListener('mousemove', function (e) {
            if (!drag) return;
            panel.style.left = Math.max(0, e.clientX - drag.dx) + 'px';
            panel.style.top = Math.max(0, e.clientY - drag.dy) + 'px';
        });
        window.addEventListener('mouseup', function () { drag = null; });

        // overlay SVG per i marcatori
        var NS = 'http://www.w3.org/2000/svg';
        var svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('style', 'position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:1500;');
        document.body.appendChild(svg);

        // controlli della camera virtuale: creati una volta sola, cosi' slider e campi non
        // perdono valore, focus e trascinamento quando il pannello viene ridisegnato
        var fieldStyle = 'width:100%;box-sizing:border-box;padding:3px;margin:2px 0;';
        var small = 'font-size:11px;margin-top:4px;';
        var numStyle = 'width:62px;box-sizing:border-box;padding:2px;font-size:11px;';
        var presets = CAM_PRESETS.map(function (p) {
            var b = h('button', {type: 'button', style: 'width:32%;margin:1px 0.6%;padding:4px 0;font-size:11px;' +
                'cursor:pointer;border:1px solid #888;border-radius:4px;background:#f4f4f4;color:#111;'}, tn(p[0]));
            ta(b, 'title', p[2]);
            b.__rot = p[1];
            b.addEventListener('click', function () { setPreset(p[1]); });
            return b;
        });

        // riga "etichetta | slider | numero" legata a un elemento di S.cam.pos o S.cam.rot
        var box = modelBox(), bsize = box.getSize(new THREE.Vector3()), axisNames = ['x', 'y', 'z'];
        var axisRow = function (key, i, min, max, step) {
            var range = h('input', {type: 'range', min: min, max: max, step: step, style: 'flex:1;min-width:0;margin:0 4px;'});
            var num = h('input', {type: 'number', step: step, style: numStyle});
            var set = function (v, src) {
                if (!isFinite(v)) return;
                S.cam[key][i] = v;
                S.cam.show = true;
                cameraChanged(src);
            };
            range.addEventListener('input', function () { set(parseFloat(range.value), range); });
            num.addEventListener('input', function () { set(parseFloat(num.value), num); });
            return {
                el: h('div', {style: 'display:flex;align-items:center;font-size:11px;margin:1px 0;'},
                    [h('span', {style: 'width:12px;font-weight:bold;'}, 'XYZ'[i]), range, num]),
                refresh: function (src) {
                    var v = S.cam[key][i];
                    if (src !== range) range.value = v;
                    if (src !== num && document.activeElement !== num) num.value = v;
                }
            };
        };
        var posRows = [0, 1, 2].map(function (i) {
            var a = axisNames[i], pad = Math.max(bsize[a], 1);
            return axisRow('pos', i, Math.floor(box.min[a] - pad), Math.ceil(box.max[a] + pad), '0.05');
        });
        var rotRows = [0, 1, 2].map(function (i) { return axisRow('rot', i, -180, 180, '0.5'); });

        var sizeInput = function (key) {
            var el = h('input', {type: 'number', step: '0.1', min: '0.01', style: numStyle + 'width:70px;'});
            el.addEventListener('input', function () {
                var v = parseFloat(el.value);
                if (v > 0) { S.cam[key] = v; S.cam.show = true; cameraChanged(el); }
            });
            return el;
        };
        var wIn = sizeInput('w'), hIn = sizeInput('h');
        var check = function (label, key, onChange) {
            var c = h('input', {type: 'checkbox', style: 'margin:0 5px 0 0;vertical-align:middle;'});
            c.addEventListener('change', function () { S.cam[key] = c.checked; onChange(c.checked); });
            return {input: c, el: h('label', {style: 'display:block;font-size:11px;margin:3px 0;cursor:pointer;'}, [c, tn(label)])};
        };
        var show = check('Mostra la camera nella scena 3D', 'show', function () { cameraChanged(); });
        var look = check('Guarda la scena dalla camera (vista ortografica)', 'look', setLook);
        var clip = check('Clip start / end (m davanti alla camera):', 'clipOn', function () { S.cam.show = true; cameraChanged(); });
        var clipInput = function (key) {
            var el = h('input', {type: 'number', step: '0.1', style: numStyle + 'width:70px;'});
            el.addEventListener('input', function () {
                var v = parseFloat(el.value);
                if (isFinite(v)) { S.cam[key] = v; cameraChanged(el); }
            });
            return el;
        };
        var clipStart = clipInput('clipStart'), clipEnd = clipInput('clipEnd');
        var clipRow = h('div', {style: 'display:flex;align-items:center;font-size:11px;margin:1px 0 3px 18px;'},
            ['start ', clipStart, h('span', {style: 'margin:0 4px;'}, 'end'), clipEnd]);
        var sliceBtn = btn(T('✂ Anteprima della fetta'), function () { setSlice(!S.cam.slice); });
        ta(sliceBtn, 'title', 'Mostra nella scena solo quello che sta tra clip start e clip end e dentro il riquadro: la parte che comparirà nella foto, vista dalla camera');
        // cosa fotografare
        var source = h('select', {style: fieldStyle}, [
            h('option', {value: 'mesh'}, tn('Mesh 3D texturizzata')),
            h('option', {value: 'cloud'}, tn('Nuvola di punti'))
        ]);
        source.addEventListener('change', function () { S.cam.src = source.value; cameraChanged(); });
        var pointSize = h('select', {style: 'margin-left:6px;padding:2px;font-size:11px;'},
            [h('option', {value: '0'}, tn('automatica'))].concat([1, 2, 3, 4, 6, 8, 12].map(function (n) {
                return h('option', {value: String(n)}, tn('{n} pixel', {n: n}));
            })));
        pointSize.addEventListener('change', function () { S.cam.pointSize = parseInt(pointSize.value, 10) || 0; });
        var pointRow = h('div', {style: 'display:none;align-items:center;font-size:11px;margin:2px 0;'},
            [tn('Dimensione dei punti:'), pointSize]);

        var annot = check('Scala metrica e punti di georeferenziazione (per QGIS)', 'annotate', function () {});
        ta(annot.el, 'title', 'Disegna sull\'immagine una barra di scala e un rettangolo con 4 punti a coordinate note, e aggiunge il file .points da caricare nel georeferenziatore di QGIS');
        var mode = h('select', {style: fieldStyle}, [
            h('option', {value: 'cm'}, tn('Risoluzione in cm per pixel')),
            h('option', {value: 'scale'}, tn('Disegno in scala 1:N (per la stampa)'))
        ]);
        var res = h('input', {type: 'text', value: '1', inputmode: 'decimal', style: fieldStyle});
        var scaleN = h('input', {type: 'text', value: '50', inputmode: 'decimal', style: numStyle});
        var dpi = h('input', {type: 'text', value: '300', inputmode: 'decimal', style: numStyle});
        var scaleRow = h('div', {style: 'font-size:11px;margin:2px 0;display:none;'}, [tn('Scala 1 :'), ' ', scaleN, ' ', tn('a'), ' ', dpi, ' dpi']);
        [mode, res, scaleN, dpi].forEach(function (el) {
            el.addEventListener('input', updateOrthoEstimate);
            el.addEventListener('change', updateOrthoEstimate);
        });
        var est = h('div', {style: 'font-size:11px;color:#555;'}, '');

        var camBox = h('div', {}, [
            h('div', {style: small}, tn('Cosa fotografare:')),
            source, pointRow,
            h('div', {style: small}, tn('Camera ortografica (come in Blender). Vista:')),
            h('div', {}, presets),
            h('div', {style: small}, tn('Posizione (m) — centro dell\'inquadratura:'))
        ].concat(posRows.map(function (r) { return r.el; })).concat([
            h('div', {style: small}, tn('Rotazione (gradi, Eulero XYZ):'))
        ]).concat(rotRows.map(function (r) { return r.el; })).concat([
            h('div', {style: small + 'display:flex;align-items:center;'},
                [tn('Inquadratura (m):'), ' ', wIn, h('span', {style: 'margin:0 3px;'}, '×'), hIn]),
            btn(T('⛶ Adatta l\'inquadratura al modello'), fitCamera),
            btn(T('⌖ Metti la camera dove sto guardando'), cameraFromView),
            show.el, look.el, clip.el, clipRow, sliceBtn,
            h('div', {style: small}, tn('Uscita:')),
            mode, res, scaleRow, est, annot.el
        ]));

        S.ui = {panel: panel, title: title, titleText: titleText, langSel: langSel, body: body, real: real, toggle: toggle, svg: svg, NS: NS, camBox: camBox,
                presets: presets, rows: posRows.concat(rotRows), w: wIn, h: hIn,
                show: show.input, look: look.input, clip: clip.input, sliceBtn: sliceBtn, clipStart: clipStart, clipEnd: clipEnd,
                source: source, pointRow: pointRow, annot: annot.input,
                mode: mode, res: res, scaleN: scaleN, dpi: dpi, scaleRow: scaleRow, est: est};
        fitCamera();                      // camera iniziale: prospetto frontale di tutto il modello
        S.cam.show = false;               // ...ma non la disegniamo finche' non viene usata
        cameraChanged();
        placePanel();
        window.addEventListener('resize', placePanel);
        I18N.onChange(languageChanged);
        dockPanel(0);
    }

    // Aggancia il pannello al menu a sinistra di Potree, come sezione tra "Scena" e "Filtri" (#menu_filters). Il menu
    // e' una fisarmonica costruita da Potree: la nostra intestazione apre/chiude il contenuto con lo stesso stile.
    // Se il menu non c'e' (ancora) il pannello resta flottante; si riprova per qualche secondo.
    function dockPanel(attempt) {
        var ui = S.ui, menu = document.getElementById('potree_menu'), anchor = document.getElementById('menu_filters');
        if (!ui || S.docked) return;
        if (!menu || !anchor || anchor.parentNode !== menu) {
            if (attempt < 10) setTimeout(function () { dockPanel(attempt + 1); }, 500);
            return;
        }
        var content = h('div', {id: 'scaling_tool_menu_content'}), head = h('h3', {id: 'scaling_tool_menu'}, h('span', {}, tn('Scala & Orientamento')));
        head.addEventListener('click', function () {
            content.style.display = content.style.display === 'none' ? 'block' : 'none';
        });
        menu.insertBefore(head, anchor);
        menu.insertBefore(content, anchor);
        // dentro la fisarmonica: niente posizione fissa, trascinamento, riduzione a icona (lo fa l'intestazione) e titolo doppio
        ui.panel.style.cssText = 'position:static;width:auto;margin:4px 0 8px;background:#fff;color:#111;border-radius:6px;' +
            'font-family:sans-serif;font-size:12px;';
        ui.title.style.cursor = 'default';
        ui.toggle.style.display = 'none';
        ui.titleText.style.visibility = 'hidden';
        ui.body.style.maxHeight = 'none';
        ui.body.style.overflow = 'visible';
        content.appendChild(ui.panel);
        S.docked = true;
        S.panelMoved = true;
        content.style.display = 'block';
    }

    // Cambio di lingua: riscrive i testi fissi, ridisegna il pannello e riallinea il verso di scrittura (arabo: da destra)
    function languageChanged() {
        bound.forEach(function (fn) { fn(); });
        var ui = S.ui;
        if (!ui) return;
        ui.panel.setAttribute('dir', I18N.dir());
        ui.panel.setAttribute('lang', I18N.current());
        ui.langSel.value = I18N.pref();
        S.msg = '';
        cameraChanged();
        render();
    }

    // In alto a destra dentro l'area 3D, per non coprire i menu di WebODM. Richiamata
    // periodicamente: se la pagina e' stata caricata non visibile l'area 3D era larga 0.
    function placePanel() {
        if (!S.ui || S.panelMoved) return;
        var vr = viewer.renderer.domElement.getBoundingClientRect();
        if (vr.width < 300 || vr.height < 200) return;
        S.ui.panel.style.left = Math.max(0, vr.right - 290) + 'px';
        S.ui.panel.style.top = (vr.top + 10) + 'px';
        S.ui.body.style.maxHeight = Math.max(150, vr.height - 60) + 'px';
    }

    function drawOverlay() {
        try { drawOverlayFrame(); } catch (e) {
            console.error('[scaling-tool] overlay disattivato', e);
            return;                       // interrompe il loop invece di ripetere l'errore a ogni frame
        }
        requestAnimationFrame(drawOverlay);
    }

    // Bussola degli assi del modello (come quella di Blender): X rosso, Y verde, Z blu, come li vede
    // la vista corrente. Dopo aver impostato la Z, X e Y giacciono sul piano orizzontale; un asse che
    // punta dritto verso lo schermo e' indicato a parole. Dopo la trasformazione gli assi del modello
    // sono gli assi della scena 3D.
    function axisGizmo(cam, r) {
        var inv = new THREE.Matrix4().copy(cam.matrixWorld).invert();
        var cx = r.right - 84, cy = r.bottom - 96, L = 42;
        var items = [['X', [1, 0, 0], '#e53935'], ['Y', [0, 1, 0], '#43a047'], ['Z', [0, 0, 1], '#1e88e5']].map(function (a) {
            var v = new THREE.Vector3(a[1][0], a[1][1], a[1][2]).transformDirection(inv);
            return {n: a[0], c: a[2], x: v.x, y: -v.y, z: v.z};
        });
        items.sort(function (a, b) { return a.z - b.z; });          // prima i piu' lontani
        var text = function (x, y, t, size, anchor) {
            return '<text x="' + x + '" y="' + y + '" fill="#fff" stroke="#000" stroke-width="3" paint-order="stroke" ' +
                'font-size="' + size + '" font-family="sans-serif" font-weight="bold" text-anchor="' + (anchor || 'middle') + '">' + t + '</text>';
        };
        if (!items.every(function (it) { return isFinite(it.x + it.y + it.z); })) return '';     // vista non ancora pronta
        var out = '<circle cx="' + cx + '" cy="' + cy + '" r="60" fill="rgba(0,0,0,.35)"/>';
        items.forEach(function (it) {
            var ex = cx + it.x * L, ey = cy + it.y * L, op = it.z < 0 ? 0.6 : 1;
            out += '<line x1="' + cx + '" y1="' + cy + '" x2="' + ex + '" y2="' + ey + '" stroke="' + it.c +
                '" stroke-width="4" stroke-opacity="' + op + '"/>' +
                '<circle cx="' + ex + '" cy="' + ey + '" r="10" fill="' + it.c + '" fill-opacity="' + op + '" stroke="#fff" stroke-width="1.5"/>' +
                '<text x="' + ex + '" y="' + (ey + 4) + '" fill="#fff" font-size="12" font-family="sans-serif" font-weight="bold" ' +
                'text-anchor="middle">' + it.n + '</text>';
            if (Math.abs(it.z) > 0.85) out += text(ex, ey + 25, it.z > 0 ? T('verso di te') : T('via da te'), 11);
        });
        return out + text(cx, cy + 76, T('assi: X rosso, Y verde, Z blu'), 11);
    }

    function drawOverlayFrame() {
        var ui = S.ui;
        if (!ui) return;
        var svg = ui.svg;
        var cam = viewer.scene.getActiveCamera();
        cam.updateMatrixWorld();
        var r = viewer.renderer.domElement.getBoundingClientRect();
        var out = '';
        if (r.width > 200 && r.height > 200) out += axisGizmo(cam, r);
        var pts = S.marks.map(function (p) {
            var v = origToCur(p).project(cam);
            return {x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height, vis: v.z > -1 && v.z < 1};
        });
        if (pts.length >= 2 && S.mode !== 'upPlane') {
            out += '<line x1="' + pts[0].x + '" y1="' + pts[0].y + '" x2="' + pts[1].x + '" y2="' + pts[1].y +
                '" stroke="#ffeb3b" stroke-width="2" stroke-dasharray="5,3"/>';
        }
        pts.forEach(function (p, i) {
            if (!p.vis) return;
            out += '<circle cx="' + p.x + '" cy="' + p.y + '" r="6" fill="#e53935" stroke="#fff" stroke-width="2"/>' +
                '<text x="' + (p.x + 9) + '" y="' + (p.y - 8) + '" fill="#fff" stroke="#000" stroke-width="3" paint-order="stroke" ' +
                'font-size="13" font-family="sans-serif" font-weight="bold">' + (i + 1) + '</text>';
        });
        (S.extraMarks || []).forEach(function (mk) {
            var v = origToCur(mk.p).project(cam);
            if (!(v.z > -1 && v.z < 1)) return;
            var x = r.left + (v.x + 1) / 2 * r.width, y = r.top + (1 - v.y) / 2 * r.height;
            out += '<circle cx="' + x + '" cy="' + y + '" r="7" fill="' + mk.color + '" stroke="#fff" stroke-width="2"/>' +
                '<text x="' + (x + 10) + '" y="' + (y - 9) + '" fill="#fff" stroke="#000" stroke-width="3" paint-order="stroke" ' +
                'font-size="14" font-family="sans-serif" font-weight="bold">' + mk.label + '</text>';
        });
        svg.innerHTML = out;
    }

    // ---------------------------------------------------------------- moduli (file separati, es. georef.js)
    // Un modulo si registra con window.ScalingToolModules.push({name, init(ctx)}) e puo' arrivare prima o dopo
    // main.js. init(ctx) ritorna {section(body, sec), onReset()} (entrambi facoltativi).
    function startModules() {
        var ctx = {
            S: S, h: h, btn: btn, api: api, API: API, render: render, askConfirm: askConfirm, buildR: buildR,
            MODES: MODES, startMode: startMode, saveTransform: saveTransform, startExport: startExport,
            restartHint: RESTART_HINT, T: T, TS: TS, tn: tn, ta: ta,
            onLang: function (fn) { I18N.onChange(fn); },
            persist: function (el) { S.persist.push(el); },
            // la trasformazione e' cambiata (es. georeferenziazione): riallinea scena e camera dell'ortofoto
            reapply: function () {
                applyTransform();
                var shown = S.cam.show;
                fitCamera();
                S.cam.show = shown;
                cameraChanged();
                render();
            }
        };
        var start = function (mod) {
            try {
                var inst = mod.init(ctx);
                if (inst) S.modules.push(inst);
            } catch (e) { console.error('[scaling-tool] modulo ' + mod.name + ' non avviato', e); }
        };
        var queue = window.ScalingToolModules = window.ScalingToolModules || [];
        queue.slice().forEach(start);
        queue.push = function (mod) { Array.prototype.push.call(queue, mod); start(mod); return queue.length; };
    }

    // ---------------------------------------------------------------- avvio
    function init() {
        viewer = window.viewer;
        buildUI();
        startModules();
        installPicking();
        applyTransform();                 // inizializza S.Tw (identita')
        render();
        requestAnimationFrame(drawOverlay);
        setInterval(syncExtras, 400);
        pollOrtho();                      // ortofoto gia' generate per questo task
        loadMapState();

        api('GET', API + '/transform').then(function (res) {
            S.canEdit = !!res.can_edit;
            var t = res.transform;
            if (t) {
                S.params = {scale: t.scale || 1, up: t.up || null, xdir: t.xdir || null, origin: t.origin || null};
                S.refs = t.refs || {};
                S.saved = true;
                applyTransform();
                // la camera iniziale era stata adattata al modello non ancora allineato
                var shown = S.cam.show;
                fitCamera();
                S.cam.show = shown;
                cameraChanged();
                S.msg = T('Trasformazione salvata caricata.');
            }
            render();
            api('GET', API + '/export').then(function (st) {
                if (st && st.state && st.state !== 'idle') { S.exportState = st; render(); if (st.state === 'running') pollExport(); }
            });
        }, function (e) { S.msg = T('Impossibile leggere la trasformazione: {e}', {e: TS(e)}); render(); });
    }

    var tries = 0, timer = setInterval(function () {
        if (ready) return clearInterval(timer);
        if (++tries > 240) return clearInterval(timer);          // ~2 minuti
        if (window.viewer && window.THREE && window.Potree &&
            window.viewer.scene && window.viewer.scene.pointclouds &&
            window.viewer.scene.pointclouds.length > 0) {
            ready = true; clearInterval(timer);
            try { init(); } catch (e) { console.error('[scaling-tool] init fallito', e); }
        }
    }, 500);
})();
