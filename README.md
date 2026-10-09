# WebODM Model Tools - Scaling & Orientation

🇬🇧 [English](#english) · 🇮🇹 [Italiano](#italiano)

---

## English

> [!WARNING]
> **Experimental software, written with an AI: use it with care.**
> This plugin was designed by Luca Mandolesi and **developed with [Claude Code](https://claude.com/claude-code)** (Anthropic): most of the code was written by an AI model and has not been reviewed line by line by a programmer. It comes with **no warranty** (AGPL).
> - **Always check the results** (scale, orientation, coordinates, orthophotos) against independent measurements before relying on them.
> - **Back up important tasks** before using it.
> - It was tested on the WebODM Windows desktop app with a single user; the security review was also done with Claude Code, not by an independent reviewer. On shared or Internet-facing servers, decide for yourself whether to install it.

A [WebODM](https://github.com/OpenDroneMap/WebODM) plugin to **scale, orient and georeference non-georeferenced models** directly inside the 3D viewer, and to produce measurable products from them.

Photogrammetric models built without ground control have arbitrary scale, axes and origin. This plugin adds a panel to the left menu of the 3D viewer (between *Scene* and *Filters*) where you:

1. **Measure** two points and enter the real distance in metres → the model gets its true scale.
2. **Define the Z axis** (two points on a vertical element, or a support plane fitted on three or more points), the **X direction** and the **origin**. Every parameter can be changed independently and in any order; the transformation is applied live to the point cloud, the textured mesh and the camera models.
3. **Georeference** (optional): give a known point A (and optionally a second point B for the orientation) coordinates in any metric EPSG system.
4. **Save** the transformation in the task and **export** the transformed point cloud (LAZ), the textured OBJ mesh and the 4×4 matrix.
5. **Take orthophotos** with a Blender-style orthographic camera: front, side and plan elevations, sections (clip start/end), from the textured mesh or from the point cloud, at a chosen cm/pixel or at a printing scale 1:N with DPI. Outputs: GeoTIFF, PNG, JPEG, PDF at true scale, plus scale bar and control points (`.points`) ready for the QGIS georeferencer. A plan view can replace the orthophoto shown on WebODM's 2D Map.

The interface is available in **Italian, English, German, French, Chinese, Japanese and Arabic**, and follows the browser language (or the selector in the panel).

### Install

**Requirement: WebODM must be installed first.** The plugin does nothing on its own: download WebODM from <https://webodm.org/download/> and install it, then add the plugin.

`Administration → Plugins → Load Plugin (.zip)` with `webodm-model-tools.zip` from the [Releases](https://github.com/pyarchinit/webodm-model-tools/releases) (or a zip of the `webodm-model-tools` folder, which must be the first level of the archive). Up to v1.0.49 the plugin was called `scaling-tool`: disable and delete it first, then hard-reload the 3D page. No pip/npm dependencies, no build. It runs on the Windows desktop app and on the Docker image (some features use tools bundled only in the Windows app and fall back to built-in renderers otherwise).

Full usage notes (in Italian): [`webodm-model-tools/README.md`](webodm-model-tools/README.md). An illustrated guide (in Italian) opens from the **?** button in the panel header.

### License

[GNU AGPL v3 or later](webodm-model-tools/LICENSE), the same license as WebODM.

### Credits

**Designed by Luca Mandolesi and developed with [Claude Code](https://claude.com/claude-code) (Anthropic).** Luca Mandolesi is a founding partner and head of the ICT and VIARCH sector, graduated in medieval archaeology at the University of Siena. Since 2005 he leads the open-source project [pyArchInit](https://github.com/pyarchinit/pyarchinit), a QGIS plugin for the GIS management of excavation data, and since 2015 he works on GNSS, Structure from Motion, QGIS and 3D (Blender, BlenderGIS) workflows. Member of GFOSS.it and ArcheoFOSS.

Developed by [flyover Academy](https://flyoveracademy.it/).

---

## Italiano

> [!WARNING]
> **Software sperimentale, scritto con un'intelligenza artificiale: usalo con attenzione.**
> Il plugin è stato progettato da Luca Mandolesi e **sviluppato con [Claude Code](https://claude.com/claude-code)** (Anthropic): il codice è stato in gran parte scritto da un modello di IA e non è stato revisionato riga per riga da un programmatore. È distribuito **senza alcuna garanzia** (AGPL).
> - **Controlla sempre i risultati** (scala, orientamento, coordinate, ortofoto) con misure indipendenti prima di usarli in un lavoro.
> - **Fai una copia dei task importanti** prima di usarlo.
> - È stato provato sull'app WebODM per Windows con un solo utente; la revisione di sicurezza è stata fatta anch'essa con Claude Code, non da un revisore indipendente. Su server condivisi o esposti a Internet valuta tu se installarlo.

Plugin per [WebODM](https://github.com/OpenDroneMap/WebODM) che permette di **scalare, orientare e georiferire modelli non georeferenziati** direttamente nel visualizzatore 3D e di ricavarne prodotti misurabili.

I modelli fotogrammetrici costruiti senza punti di controllo hanno scala, assi e origine arbitrari. Il plugin aggiunge un pannello nel menu a sinistra del visualizzatore 3D (tra *Scena* e *Filtri*) con cui:

1. **Misuri** due punti e inserisci la distanza reale in metri → il modello prende la scala vera.
2. **Definisci l'asse Z** (due punti su un elemento verticale, oppure un piano di appoggio calcolato su almeno tre punti), la **direzione X** e l'**origine**. Ogni parametro si può cambiare in modo indipendente e in qualsiasi ordine; la trasformazione si applica in tempo reale a nuvola di punti, mesh texturizzata e modelli delle fotocamere.
3. **Georiferisci** (facoltativo): assegni coordinate in un qualsiasi sistema EPSG in metri a un punto noto A (e, per l'orientamento, a un secondo punto B).
4. **Salvi** la trasformazione nel task ed **esporti** la nuvola trasformata (LAZ), la mesh OBJ texturizzata e la matrice 4×4.
5. **Scatti ortofoto** con una camera ortografica come in Blender: prospetti frontali e laterali, piante, sezioni (clip start/end), dalla mesh texturizzata o dalla nuvola di punti, con risoluzione in cm/pixel o in scala di stampa 1:N a un dato DPI. Uscite: GeoTIFF, PNG, JPEG, PDF in scala reale, più barra di scala e punti di controllo (`.points`) pronti per il georeferenziatore di QGIS. Una pianta può sostituire l'ortofoto mostrata nella Mappa 2D di WebODM.

L'interfaccia è disponibile in **italiano, inglese, tedesco, francese, cinese, giapponese e arabo** e segue la lingua del browser (o il selettore nel pannello).

### Installazione

**Requisito: prima va installato WebODM.** Il plugin da solo non fa nulla: scarica WebODM da <https://webodm.org/download/> e installalo, poi aggiungi il plugin.

`Administration → Plugins → Load Plugin (.zip)` con `webodm-model-tools.zip` scaricato dalle [Release](https://github.com/pyarchinit/webodm-model-tools/releases) (oppure uno zip della cartella `webodm-model-tools`, che deve essere il primo livello dell'archivio). Fino alla v1.0.49 il plugin si chiamava `scaling-tool`: prima disabilitalo ed eliminalo, poi ricarica la pagina 3D con Ctrl+F5. Nessuna dipendenza pip/npm, nessuna build. Funziona sull'app desktop per Windows e sull'immagine Docker (alcune funzioni usano strumenti presenti solo nell'app Windows e altrimenti ripiegano su renderer interni).

Istruzioni d'uso complete: [`webodm-model-tools/README.md`](webodm-model-tools/README.md). La guida illustrata si apre dal pulsante **?** nell'intestazione del pannello.

### Licenza

[GNU AGPL v3 o successiva](webodm-model-tools/LICENSE), la stessa licenza di WebODM.

### Autori

**Progettato da Luca Mandolesi e sviluppato con [Claude Code](https://claude.com/claude-code) (Anthropic).** Luca Mandolesi è socio fondatore e direttore del settore ICT e VIARCH, laureato in archeologia medievale all'Università di Siena. Dal 2005 è responsabile del progetto open source [pyArchInit](https://github.com/pyarchinit/pyarchinit), un plugin QGIS per la gestione GIS dei dati di scavo; dal 2015 si occupa di flussi di lavoro per rilievo GNSS, Structure From Motion, QGIS e mondo 3D con Blender e BlenderGIS. Socio di GFOSS.it e ArcheoFOSS.

Sviluppato da [flyover Academy](https://flyoveracademy.it/).
