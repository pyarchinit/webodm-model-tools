/*
 * Scaling & Orientation Tool - modulo "Georiferimento"
 * Copyright (C) 2026 Luca Mandolesi - SPDX-License-Identifier: AGPL-3.0-or-later
 * Stessa licenza di WebODM (GNU AGPL v3): vedi il file LICENSE.
 *
 * Sezione del pannello di main.js (che lo importa: vedi JS_FILES in plugin.py e window.ScalingToolModules).
 * Il punto A del modello (default: l'origine) riceve le sue coordinate assolute in un sistema EPSG in metri;
 * un secondo punto B facoltativo ne fissa l'orientamento. La matematica e' quella di georef.py:
 *     assoluto = scala * Rg * (p - A) + t,     vista = assoluto - offset
 * Il visualizzatore lavora nel sistema "vista" (numeri piccoli: gli interi a 32 bit della GPU non reggono
 * coordinate UTM), cioe' con Est/Nord relativi al punto A.
 */
(function () {
    'use strict';

    // Testi tradotti da i18n.js (senza, restano in italiano: e' il caso dei test con node, dove window e' vuoto)
    function T(s, v) {
        var I = window.ScalingToolI18n;
        return I ? I.t(s, v) : String(s).replace(/\{(\w+)\}/g, function (a, k) { return v && v[k] != null ? v[k] : a; });
    }

    // ---------------------------------------------------------------- matematica (uguale a georef.build)
    var MIN_BASELINE = 1e-6, ASSUMED_VERTICAL = 0.001;

    function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }

    // scale, R = [ex, ey, ez] (righe, come transform_math.build), o = origine; geo = {a, abs_a, b, abs_b}.
    // Ritorna {matrix_abs, matrix_view (4 righe), offset, rotation_deg, checks, warnings, notes}; solleva Error con il motivo.
    function compute(s, R, o, geo) {
        var A = geo.a, absA = geo.abs_a, warnings = [], notes = [], checks = {}, phi = 0, i;
        var ex = R[0], ey = R[1], ez = R[2];
        if (geo.b) {
            var d = [geo.b[0] - A[0], geo.b[1] - A[1], geo.b[2] - A[2]];
            var local = [s * dot(ex, d), s * dot(ey, d), s * dot(ez, d)];
            var dxa = geo.abs_b[0] - absA[0], dya = geo.abs_b[1] - absA[1];
            var hLocal = Math.hypot(local[0], local[1]), hAbs = Math.hypot(dxa, dya);
            if (hAbs < MIN_BASELINE) throw new Error(T('Le coordinate di A e B coincidono: non si puo\' dedurre un orientamento'));
            if (hLocal < MIN_BASELINE || hLocal < ASSUMED_VERTICAL * Math.sqrt(dot(local, local))) {
                throw new Error(T('I punti A e B del modello sono sulla stessa verticale: scegline uno spostato in orizzontale'));
            }
            phi = Math.atan2(dya, dxa) - Math.atan2(local[1], local[0]);
            checks.distance_model = hLocal; checks.distance_abs = hAbs; checks.ratio = hAbs / hLocal;
            if (Math.abs(checks.ratio - 1) > 0.005) {
                warnings.push(T('La distanza orizzontale tra A e B nel modello ({m} m) e\' diversa da quella delle coordinate ({c} m): {p} %. Controlla la scala del modello o le coordinate.',
                    {m: hLocal.toFixed(3), c: hAbs.toFixed(3), p: ((checks.ratio - 1) * 100).toFixed(2)}));
            }
            if (absA[2] != null && geo.abs_b[2] != null) {
                checks.dz_model = local[2]; checks.dz_abs = geo.abs_b[2] - absA[2];
                if (Math.abs(checks.dz_model - checks.dz_abs) > Math.max(0.05, 0.005 * hAbs)) {
                    warnings.push(T('Dislivello tra A e B: {m} m nel modello, {c} m nelle coordinate.',
                        {m: checks.dz_model.toFixed(3), c: checks.dz_abs.toFixed(3)}));
                }
            }
            var turn = 2 * Math.PI;
            phi = (((phi + Math.PI) % turn) + turn) % turn - Math.PI;
        }
        var c = Math.cos(phi), sn = Math.sin(phi), exg = [], eyg = [];
        for (i = 0; i < 3; i++) { exg.push(c * ex[i] - sn * ey[i]); eyg.push(sn * ex[i] + c * ey[i]); }
        var rows = [exg, eyg, ez].map(function (r) { return [s * r[0], s * r[1], s * r[2]]; });
        var trans = [absA[0] - dot(rows[0], A), absA[1] - dot(rows[1], A)], offset;
        if (absA[2] != null) {
            trans.push(absA[2] - dot(rows[2], A));
            offset = [absA[0], absA[1], absA[2]];
        } else {
            trans.push(-dot(rows[2], o));
            offset = [absA[0], absA[1], 0];
            notes.push(T('Quota di A non indicata: le quote restano relative all\'origine del modello.'));
        }
        var mk = function (t) {
            return rows.map(function (r, k) { return [r[0], r[1], r[2], t[k]]; }).concat([[0, 0, 0, 1]]);
        };
        return {matrix_abs: mk(trans), matrix_view: mk(trans.map(function (t, k) { return t - offset[k]; })),
                offset: offset, rotation_deg: phi * 180 / Math.PI, checks: checks, warnings: warnings, notes: notes};
    }

    window.ScalingToolGeoref = {compute: compute};      // anche per i test (tests/test_georef.py)

    var m = typeof location !== 'undefined' && location.pathname.match(/\/3d\/project\/(\d+)\/task\/([0-9a-fA-F-]+)/);
    if (!m) return;                       // il modulo agisce solo nella vista 3D

    // ---------------------------------------------------------------- registrazione presso main.js
    var queue = window.ScalingToolModules = window.ScalingToolModules || [];
    queue.push({name: 'georef', init: init});

    function init(ctx) {
        var S = ctx.S, h = ctx.h, btn = ctx.btn, api = ctx.api, URL = ctx.API + '/georef';
        var G = {groups: [], saved: null, a: null, b: null, busy: false};

        // ---- campi persistenti (main.js li stacca e li riattacca a ogni ridisegno senza perderne valore e focus)
        var box = 'box-sizing:border-box;padding:3px;margin:2px 0;font-size:11px;';
        var epsg = h('select', {style: 'width:100%;' + box});
        var custom = h('input', {type: 'text', inputmode: 'numeric', style: 'width:100%;display:none;' + box});
        ctx.ta(custom, 'placeholder', 'codice EPSG, es. 3003');
        var num = function (label) {
            var el = h('input', {type: 'text', inputmode: 'decimal', style: 'width:100%;' + box});
            ctx.ta(el, 'placeholder', label); ctx.ta(el, 'title', label);
            return el;
        };
        var aE = num('Est (X)'), aN = num('Nord (Y)'), aZ = num('Quota Z (facoltativa)');
        var bE = num('Est (X)'), bN = num('Nord (Y)'), bZ = num('Quota Z (facoltativa)');
        [epsg, custom, aE, aN, aZ, bE, bN, bZ].forEach(ctx.persist);
        epsg.addEventListener('change', function () { ctx.render(); });

        function fillEpsg() {
            var keep = epsg.value;
            epsg.innerHTML = '';
            var add = function (parent, value, text) { parent.appendChild(h('option', {value: value}, text)); };
            add(epsg, '', T('Scegli il sistema di coordinate...'));
            G.groups.forEach(function (g) {
                var og = h('optgroup', {label: T(g.name)});
                g.items.forEach(function (it) { add(og, String(it.epsg), 'EPSG:' + it.epsg + ' — ' + T(it.name)); });
                epsg.appendChild(og);
            });
            add(epsg, 'other', T('Altro codice EPSG...'));
            epsg.value = keep;
            if (epsg.value !== keep) epsg.value = '';
        }
        fillEpsg();
        ctx.onLang(fillEpsg);

        // ---- lettura dei campi
        function parse(el, what, optional) {
            var t = String(el.value).trim().replace(',', '.');
            if (t === '') {
                if (optional) return null;
                throw new Error(T('{what}: manca il valore', {what: what}));
            }
            var v = Number(t);
            if (!isFinite(v)) throw new Error(T('{what}: "{v}" non e\' un numero', {what: what, v: el.value}));
            return v;
        }

        function absPoint(label, e, n, z) {
            return [parse(e, T('{p} - Est', {p: label})), parse(n, T('{p} - Nord', {p: label})), parse(z, T('{p} - quota', {p: label}), true)];
        }

        function epsgCode() {
            var v = epsg.value === 'other' ? String(custom.value).trim() : epsg.value;
            if (!/^\d{4,6}$/.test(v)) throw new Error(T('Scegli il sistema di coordinate (EPSG)'));
            return parseInt(v, 10);
        }

        // Punto A: quello scelto, altrimenti l'origine attuale del modello
        function pointA() { return G.a || S.params.origin || [0, 0, 0]; }

        // ---- cio' che la georeferenziazione fa nel visualizzatore (sempre ricalcolata sui parametri attuali)
        function geoOf(rec) {
            return {a: rec.a, abs_a: rec.abs_a, b: rec.b || null, abs_b: rec.abs_b || null};
        }

        function currentResult() {
            if (!G.saved) return null;
            try { return compute(S.params.scale || 1, ctx.buildR(S.params), S.params.origin || [0, 0, 0], geoOf(G.saved)); }
            catch (e) { return null; }
        }

        // Matrice 4x4 (12 numeri + riga finale) originale -> scena, usata da main.js al posto della sola trasformazione
        S.geoHook = function () {
            var r = currentResult();
            if (!r) return null;
            return [].concat.apply([], r.matrix_view);
        };

        function markers() {
            var out = [];
            if (G.a) out.push({p: G.a, label: 'A', color: '#1e88e5'});
            if (G.b) out.push({p: G.b, label: 'B', color: '#fb8c00'});
            S.extraMarks = out;
        }

        function say(t) { S.msg = t; ctx.render(); }

        function loadFields(rec) {
            var z = function (v) { return v == null ? '' : String(v); };
            var known = G.groups.some(function (g) { return g.items.some(function (it) { return it.epsg === rec.epsg; }); });
            epsg.value = known ? String(rec.epsg) : 'other';
            custom.value = known ? '' : String(rec.epsg);
            aE.value = rec.abs_a[0]; aN.value = rec.abs_a[1]; aZ.value = z(rec.abs_a[2]);
            if (rec.b) { bE.value = rec.abs_b[0]; bN.value = rec.abs_b[1]; bZ.value = z(rec.abs_b[2]); }
            G.a = rec.a; G.b = rec.b || null;
            markers();
        }

        function load() {
            api('GET', URL).then(function (res) {
                G.groups = res.groups || [];
                fillEpsg();
                if (res.georef) { G.saved = res.georef; loadFields(res.georef); }
                ctx.reapply();
            }, function (e) {
                if (e === 'HTTP 404') S.msg = T('Georiferimento non attivo') + ' — ' + T(ctx.restartHint);
                ctx.render();
            });
        }

        // ---- scelta dei punti sul modello
        ctx.MODES.georefA = {label: 'Scegli A sul modello', need: 1, hint: 'Clicca il punto A: quello di cui conosci le coordinate.',
            onPick: function (p) { G.a = p; markers(); S.msg = T('Punto A scelto.'); }};
        ctx.MODES.georefB = {label: 'Scegli B sul modello', need: 1, hint: 'Clicca il punto B: un secondo punto di cui conosci le coordinate.',
            onPick: function (p) { G.b = p; markers(); S.msg = T('Punto B scelto.'); }};

        // ---- georeferenzia
        function collect() {
            var geo = {epsg: epsgCode(), a: pointA(), abs_a: absPoint(T('Punto A'), aE, aN, aZ), b: null, abs_b: null};
            var wantsB = G.b || [bE, bN, bZ].some(function (el) { return String(el.value).trim() !== ''; });
            if (wantsB) {
                if (!G.b) throw new Error(T('Per il punto B scegli anche il punto sul modello'));
                geo.b = G.b;
                geo.abs_b = absPoint(T('Punto B'), bE, bN, bZ);
            }
            return geo;
        }

        function georeference() {
            var geo, res;
            try {
                geo = collect();
                res = compute(S.params.scale || 1, ctx.buildR(S.params), S.params.origin || [0, 0, 0], geoOf(geo));
            } catch (e) { return say(e.message || String(e)); }
            if (S.params.scale === 1 && !S.refs.scale) {
                res.warnings.unshift(T('La scala del modello non e\' stata impostata (sezione 1): le coordinate risulteranno in unita\' del modello.'));
            }
            var go = function () {
                G.busy = true; say(T('Salvataggio e georeferenziazione...'));
                ctx.saveTransform().then(function () { return api('PUT', URL, geo); }).then(function (r) {
                    G.busy = false;
                    G.saved = r.georef;
                    S.msg = T('Modello georiferito in EPSG:{epsg}. Esporto la nuvola georiferita...', {epsg: geo.epsg});
                    ctx.reapply();
                    ctx.startExport();
                }, function (e) { G.busy = false; say(T('Georeferenziazione non riuscita: {e}', {e: ctx.TS(e)}) + (e === 'HTTP 404' ? ' — ' + T(ctx.restartHint) : '')); });
            };
            if (res.warnings.length) ctx.askConfirm(res.warnings.join('\n\n') + '\n\n' + T('Georeferenziare comunque?'), go); else go();
        }

        function remove() {
            ctx.askConfirm(T('Togliere la georeferenziazione? Il modello torna nel sistema locale (scala e orientamento restano).'), function () {
                api('DELETE', URL).then(function () {
                    G.saved = null; S.msg = T('Georeferenziazione rimossa.'); ctx.reapply();
                }, function (e) { say(T('Rimozione non riuscita: {e}', {e: ctx.TS(e)})); });
            });
        }

        // ---- sezione del pannello
        function section(body, sec) {
            var small = 'font-size:11px;color:#444;margin:3px 0;';
            body.appendChild(sec('4. Georiferimento'));
            body.appendChild(h('div', {style: small}, T('Dai al modello coordinate vere: un punto noto e, se vuoi, un secondo punto per l\'orientamento.')));

            body.appendChild(h('div', {style: small}, T('Sistema di coordinate (in metri):')));
            body.appendChild(epsg);
            custom.style.display = epsg.value === 'other' ? 'block' : 'none';
            body.appendChild(custom);

            body.appendChild(h('div', {style: small + 'font-weight:bold;'}, T('Punto A (origine)')));
            body.appendChild(btn(MODE_LABEL('georefA'), function () { ctx.startMode('georefA'); }, {active: S.mode === 'georefA'}));
            body.appendChild(h('div', {style: small}, G.a ? T('A scelto sul modello ✔') : T('Senza scelta, A e\' l\'origine del modello (sezione 3).')));
            body.appendChild(h('div', {style: small}, T('Coordinate assolute di A: Est, Nord, quota (facoltativa)')));
            body.appendChild(aE); body.appendChild(aN); body.appendChild(aZ);

            body.appendChild(h('div', {style: small + 'font-weight:bold;margin-top:6px;'}, T('Punto B (orientamento, facoltativo)')));
            body.appendChild(btn(MODE_LABEL('georefB'), function () { ctx.startMode('georefB'); }, {active: S.mode === 'georefB'}));
            if (G.b) {
                body.appendChild(h('div', {style: small}, T('B scelto sul modello ✔')));
                body.appendChild(h('a', {href: '#', style: 'font-size:11px;color:#a00;', onclick: function (e) {
                    e.preventDefault(); G.b = null; [bE, bN, bZ].forEach(function (el) { el.value = ''; }); markers(); ctx.render();
                }}, T('togli B')));
            } else {
                body.appendChild(h('div', {style: small}, T('Senza B il modello resta orientato come ora (X = Est, Y = Nord).')));
            }
            body.appendChild(h('div', {style: small}, T('Coordinate assolute di B:')));
            body.appendChild(bE); body.appendChild(bN); body.appendChild(bZ);

            body.appendChild(btn(G.busy ? T('… georeferenziazione in corso') : T('🌍 Georiferisci la nuvola'), georeference,
                {disabled: !S.canEdit || G.busy}));
            if (G.saved) body.appendChild(btn(T('↺ Rimuovi la georeferenziazione'), remove, {disabled: !S.canEdit}));
            if (!S.canEdit) body.appendChild(h('div', {style: 'font-size:11px;color:#a00;'}, T('Sola lettura: serve il permesso di modifica del progetto.')));

            var r = currentResult();
            if (r) {
                var kids = [h('div', {style: 'font-weight:bold;'}, T('Georiferito ✔  EPSG:{epsg}', {epsg: G.saved.epsg})),
                    h('div', {}, T('Rotazione applicata: {deg}°', {deg: r.rotation_deg.toFixed(3)})),
                    h('div', {}, T('La scena 3D usa coordinate relative ad A. Per avere quelle assolute somma: Est + {e}, Nord + {n}', {
                        e: r.offset[0].toFixed(3), n: r.offset[1].toFixed(3)}) +
                        (G.saved.abs_a[2] != null ? ', ' + T('quota + {z}', {z: r.offset[2].toFixed(3)}) : '') + '.')];
                if (r.checks.ratio != null) kids.push(h('div', {}, T('Controllo A-B: modello {m} m, coordinate {c} m.', {
                    m: r.checks.distance_model.toFixed(3), c: r.checks.distance_abs.toFixed(3)})));
                r.warnings.concat(r.notes).forEach(function (t) { kids.push(h('div', {style: 'color:#8a4b00;'}, t)); });
                kids.push(h('div', {style: 'color:#555;'}, T('Origine e direzione X (sezione 3) sono ora definite da A e B; scala e asse Z restano quelli impostati sopra.')));
                kids.push(h('div', {style: 'color:#555;'}, T('Le ortofoto "Pianta" escono georiferite (GeoTIFF con EPSG:{epsg}).', {epsg: G.saved.epsg})));
                body.appendChild(h('div', {style: 'font-size:11px;margin-top:6px;padding:5px;background:#e3f2fd;border:1px solid #90caf9;border-radius:4px;'}, kids));
            }
        }

        function MODE_LABEL(name) { return T(ctx.MODES[name].label); }

        load();
        return {
            section: section,
            onReset: function () {              // "Ripristina originale" toglie anche la georeferenziazione
                if (!G.saved) return;
                G.saved = null;
                api('DELETE', URL).then(ctx.reapply, ctx.reapply);
            }
        };
    }
})();
