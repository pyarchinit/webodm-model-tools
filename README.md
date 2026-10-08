# WebODM Model Tools - Scaling & Orientation

🇬🇧 [English](#english) · 🇮🇹 [Italiano](#italiano)

---

## English

A [WebODM](https://github.com/OpenDroneMap/WebODM) plugin to **scale, orient and georeference non-georeferenced models** directly inside the 3D viewer, and to produce measurable products from them.

Photogrammetric models built without ground control have arbitrary scale, axes and origin. This plugin adds a panel to the left menu of the 3D viewer (between *Scene* and *Filters*) where you:

1. **Measure** two points and enter the real distance in metres → the model gets its true scale.
2. **Define the Z axis** (two points on a vertical element, or a support plane fitted on three or more points), the **X direction** and the **origin**. Every parameter can be changed independently and in any order; the transformation is applied live to the point cloud, the textured mesh and the camera models.
3. **Georeference** (optional): give a known point A (and optionally a second point B for the orientation) coordinates in any metric EPSG system.
4. **Save** the transformation in the task and **export** the transformed point cloud (LAZ), the textured OBJ mesh and the 4×4 matrix.
5. **Take orthophotos** with a Blender-style orthographic camera: front, side and plan elevations, sections (clip start/end), from the textured mesh or from the point cloud, at a chosen cm/pixel or at a printing scale 1:N with DPI. Outputs: GeoTIFF, PNG, JPEG, PDF at true scale, plus scale bar and control points (`.points`) ready for the QGIS georeferencer. A plan view can replace the orthophoto shown on WebODM's 2D Map.

The interface is available in **Italian, English, German, French, Chinese, Japanese and Arabic**, and follows the browser language (or the selector in the panel).

### Install

`Administration → Plugins → Load Plugin (.zip)` with a zip of the `scaling-tool` folder (the folder must be the first level of the archive), then hard-reload the 3D page. No pip/npm dependencies, no build. It runs on the Windows desktop app and on the Docker image (some features use tools bundled only in the Windows app and fall back to built-in renderers otherwise).

Full usage notes (in Italian): [`scaling-tool/README.md`](scaling-tool/README.md).

### License

[GNU AGPL v3 or later](scaling-tool/LICENSE), the same license as WebODM.

### Credits

Developed by **Luca Mandolesi**, founding partner and head of the ICT and VIARCH sector, graduated in medieval archaeology at the University of Siena. Since 2005 he leads the open-source project [pyArchInit](https://github.com/pyarchinit/pyarchinit), a QGIS plugin for the GIS management of excavation data, and since 2015 he works on GNSS, Structure from Motion, QGIS and 3D (Blender, BlenderGIS) workflows. Member of GFOSS.it and ArcheoFOSS.

Developed by [flyover Academy](https://flyoveracademy.it/).

---

## Italiano

Plugin per [WebODM](https://github.com/OpenDroneMap/WebODM) che permette di **scalare, orientare e georiferire modelli non georeferenziati** direttamente nel visualizzatore 3D e di ricavarne prodotti misurabili.

I modelli fotogrammetrici costruiti senza punti di controllo hanno scala, assi e origine arbitrari. Il plugin aggiunge un pannello nel menu a sinistra del visualizzatore 3D (tra *Scena* e *Filtri*) con cui:

1. **Misuri** due punti e inserisci la distanza reale in metri → il modello prende la scala vera.
2. **Definisci l'asse Z** (due punti su un elemento verticale, oppure un piano di appoggio calcolato su almeno tre punti), la **direzione X** e l'**origine**. Ogni parametro si può cambiare in modo indipendente e in qualsiasi ordine; la trasformazione si applica in tempo reale a nuvola di punti, mesh texturizzata e modelli delle fotocamere.
3. **Georiferisci** (facoltativo): assegni coordinate in un qualsiasi sistema EPSG in metri a un punto noto A (e, per l'orientamento, a un secondo punto B).
4. **Salvi** la trasformazione nel task ed **esporti** la nuvola trasformata (LAZ), la mesh OBJ texturizzata e la matrice 4×4.
5. **Scatti ortofoto** con una camera ortografica come in Blender: prospetti frontali e laterali, piante, sezioni (clip start/end), dalla mesh texturizzata o dalla nuvola di punti, con risoluzione in cm/pixel o in scala di stampa 1:N a un dato DPI. Uscite: GeoTIFF, PNG, JPEG, PDF in scala reale, più barra di scala e punti di controllo (`.points`) pronti per il georeferenziatore di QGIS. Una pianta può sostituire l'ortofoto mostrata nella Mappa 2D di WebODM.

L'interfaccia è disponibile in **italiano, inglese, tedesco, francese, cinese, giapponese e arabo** e segue la lingua del browser (o il selettore nel pannello).

### Installazione

`Administration → Plugins → Load Plugin (.zip)` con uno zip della cartella `scaling-tool` (la cartella deve essere il primo livello dell'archivio), poi ricarica la pagina 3D con Ctrl+F5. Nessuna dipendenza pip/npm, nessuna build. Funziona sull'app desktop per Windows e sull'immagine Docker (alcune funzioni usano strumenti presenti solo nell'app Windows e altrimenti ripiegano su renderer interni).

Istruzioni d'uso complete: [`scaling-tool/README.md`](scaling-tool/README.md).

### Licenza

[GNU AGPL v3 o successiva](scaling-tool/LICENSE), la stessa licenza di WebODM.

### Autori

Sviluppato da **Luca Mandolesi**, socio fondatore e direttore del settore ICT e VIARCH, laureato in archeologia medievale all'Università di Siena. Dal 2005 è responsabile del progetto open source [pyArchInit](https://github.com/pyarchinit/pyarchinit), un plugin QGIS per la gestione GIS dei dati di scavo; dal 2015 si occupa di flussi di lavoro per rilievo GNSS, Structure From Motion, QGIS e mondo 3D con Blender e BlenderGIS. Socio di GFOSS.it e ArcheoFOSS.

Sviluppato da [flyover Academy](https://flyoveracademy.it/).
