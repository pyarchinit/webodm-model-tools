# WebODM Model Tools - Scaling & Orientation Tool (plugin WebODM)

> [!WARNING]
> **Software sperimentale, scritto con un'intelligenza artificiale: usalo con attenzione.**
> Il plugin è stato progettato da Luca Mandolesi e **sviluppato con [Claude Code](https://claude.com/claude-code)** (Anthropic): il codice è stato in gran parte scritto da un modello di IA e non è stato revisionato riga per riga da un programmatore. È distribuito **senza alcuna garanzia** (AGPL).
> - **Controlla sempre i risultati** (scala, orientamento, coordinate, ortofoto) con misure indipendenti prima di usarli in un lavoro.
> - **Fai una copia dei task importanti** prima di usarlo.
> - È stato provato sull'app WebODM per Windows con un solo utente; la revisione di sicurezza è stata fatta anch'essa con Claude Code, non da un revisore indipendente. Su server condivisi o esposti a Internet valuta tu se installarlo.

Guida illustrata: pulsante **?** nell'intestazione del pannello (apre `public/documentazione.html`, inclusa nel plugin).

Nel visualizzatore 3D di un task completato compare il pannello **Scala & Orientamento**.
Serve per modelli SENZA georeferenziazione (coordinate locali, scala e assi arbitrari).

## Uso
1. **Distanza e scala** - "Misura 2 punti", clicca A e B sulla nuvola: vedi distanza 3D, orizzontale (XY) e dislivello (Z).
   Inserisci la distanza reale in metri e premi "Imposta come scala".
2. **Asse Z** - "Verticale: 2 punti" (basso -> alto su un elemento verticale) oppure
   "Piano di appoggio" (>=3 punti sul pavimento/terreno -> Z = normale del piano, ai minimi quadrati). "Inverti Z" se capovolto.
3. **Piano XY / origine** - "Direzione X: 2 punti" e "Origine: 1 punto" (opzionali).
4. **Georiferimento** (facoltativo, modulo `georef.js`) - vedi sotto.
5. **Salva nel task** (conserva la trasformazione; si ricarica da sola alla riapertura) ed **Esporta**.

Il click e' un click singolo: trascinare continua a ruotare/spostare la vista. `Esc` annulla la modalita'.

## Georiferimento
Dopo scala e orientamento il modello e' in metri ma in un sistema locale. La sezione "4. Georiferimento" gli da' coordinate vere:
- **Sistema di coordinate**: elenco dei sistemi proiettati in metri piu' usati (UTM WGS84/ETRS89/RDN2008, Gauss-Boaga,
  LAEA, ...) oppure "Altro codice EPSG" per qualunque altro. Sistemi in gradi (4326) o in piedi vengono rifiutati.
- **Punto A**: "Scegli A sul modello" (senza scelta vale l'origine) + sue coordinate assolute Est, Nord e quota (facoltativa:
  senza, le quote restano relative all'origine del modello).
- **Punto B** (facoltativo): secondo punto con Est/Nord (e quota) che fissa l'orientamento; senza B il modello resta
  orientato com'e' (X = Est, Y = Nord). Se la distanza A-B nel modello non coincide con quella delle coordinate (> 0,5 %)
  compare un avviso e si puo' tornare indietro a controllare la scala.
- **Georiferisci la nuvola**: salva trasformazione e georeferenziazione, mostra il modello georiferito e avvia l'export.
  "Rimuovi la georeferenziazione" torna al sistema locale.

Le coordinate assolute sono enormi (UTM: milioni di metri) e i visualizzatori lavorano male con numeri cosi' grandi: la scena 3D
usa quindi coordinate relative al punto A (`assoluto = scena + offset`, mostrato nel pannello).
Con il modello georiferito:
- `georeferenced_model.laz` (al posto di `scaled_model.laz`): nuvola in coordinate assolute con il CRS nell'header (via PDAL);
  la mesh resta in coordinate ridotte; `georef_info.txt` riporta EPSG e offset; `transform_matrix.json` ha anche la matrice ridotta.
- Le ortofoto **"Pianta"** escono georiferite: GeoTIFF in coordinate assolute con EPSG, Nord in alto, piu' `.wld`/`.jgw`/`.prj`
  per PNG e JPEG. Le altre viste (prospetti, sezioni) non hanno coordinate geografiche e restano in metri locali.
- Sulla Mappa 2D la pianta georiferita compare nella posizione vera (non piu' nella zona UTM fittizia).

## Export (cartella `assets/scaling_tool/out/` del task, link nel pannello)
- `scaled_model.laz` - nuvola di punti trasformata (metri, Z su, origine scelta)
- `scaled_textured_model.zip` - mesh OBJ texturizzata trasformata (+ mtl e texture)
- `transform_matrix.json/.txt` - matrice 4x4 (p' = M * [x y z 1]) per CloudCompare, MeshLab, PDAL...

La nuvola e' trasformata con il `pdal` gia' presente nell'immagine WebODM (ripiego: `laspy`, se installato).
L'export gira in un processo separato a bassa priorita'; log in `assets/scaling_tool/export.log`.

## Mesh e ortofoto
- Attivando "Modello con texture" la mesh segue la stessa trasformazione della nuvola; i click funzionano anche sulla mesh.
- **5. Ortofoto dalla mesh**: una camera ortografica come in Blender, disegnata nella scena come riquadro giallo.
  - Vista: Fronte, Retro, Lato +X, Lato -X, Pianta, Da sotto (centrano la camera e adattano l'inquadratura).
  - Posizione X/Y/Z (centro dell'inquadratura) e rotazione di Eulero X/Y/Z, con slider e campi numerici.
    Rotazione (0,0,0) = dall'alto; (90,0,0) = prospetto frontale; la Z ruota in pianta, la Y e' il rollio.
  - Inquadratura: larghezza x altezza in metri. "Adatta l'inquadratura al modello" e "Metti la camera dove sto guardando".
  - "Guarda dalla camera": la vista 3D diventa ortografica e mostra cio' che verra' fotografato.
  - Cosa fotografare: la mesh 3D texturizzata oppure la nuvola di punti (con dimensione dei punti automatica o
    scelta a mano; i forellini tra i punti vengono chiusi). La nuvola arriva fino a 120 megapixel.
  - Clip start / end: come nella camera di Blender, riprende solo cio' che sta tra le due distanze (in metri davanti
    alla camera). I due piani sono disegnati in azzurro nella scena. Serve per sezioni e per isolare un elemento.
  - Uscita: cm per pixel, oppure disegno in scala 1:N a un certo DPI (per la stampa).
  - "Scala metrica e punti di georeferenziazione (per QGIS)": disegna sull'immagine una barra di scala in basso a
    sinistra e un rettangolo rosso con 4 punti (A, B, C, D) a coordinate tonde, scritte accanto, con i lati quotati.
    Aggiunge il file `.points`: in QGIS, Raster > Georeferenziatore, apri l'immagine e poi File > Carica punti GCP.
    Le coordinate sono in metri nel piano dell'immagine (X a destra, Y in alto), le stesse del GeoTIFF.
  Usa la trasformazione SALVATA. "Fronte" e' la vista che hai di fronte dopo "X parallelo alla vista".
- Ogni scatto e' un'esportazione separata in `assets/scaling_tool/ortho/`: GeoTIFF compresso con coordinate in metri
  (+ `.tfw`), PNG trasparente, anteprima JPG, un `.json` con i dati della camera e, se in scala, un PDF con la pagina
  grande quanto il disegno (stampato al 100% e' in scala). Limite 300 megapixel; PNG e PDF fino a 120.
- **Scatti fatti**: l'elenco numera gli scatti (#1 il piu' vecchio) e per ognuno mostra ora, sorgente (Mesh o Nuvola), vista,
  misure, scala o risoluzione, clip e se ha i punti QGIS. Sono righe compatte con miniatura: il piu' recente e' aperto,
  gli altri si aprono con un clic. "Elimina questo scatto" toglie i file di quello scatto.
- **Apri a tutto schermo e salva**: a scatto finito si apre una finestra a tutto schermo con l'immagine. Zoom (pulsanti, rotella,
  tasti + e -), trascinamento, Adatta (doppio clic o tasto 0), 1:1 (tasto 1), Max, scelta del formato (PNG, JPEG, TIFF,
  PDF se in scala) e SALVA, che apre la finestra di sistema per scegliere cartella e nome. Si riapre dall'elenco degli scatti.
- **Mappa 2D**: una pianta (vista "Pianta" senza rotazioni) puo' diventare l'ortofoto del task mostrata nella Mappa di
  WebODM. Sostituisce l'ortofoto originale, che resta come `odm_orthophoto.original.tif` e si puo' ripristinare dal
  pannello. Senza georeferenziazione la posizione sul globo e' fittizia (le distanze sono in metri reali); con il modello
  georiferito la pianta va sulla Mappa nella posizione vera.
- Richiede `odm_orthophoto` e `gdal_translate`, presenti nell'app WebODM per Windows (cartella ODX).

## Matematica
`p' = scala * R * (p - origine)`, righe di R = (X, Y, Z). Z = vettore scelto; X = direzione scelta proiettata
perpendicolarmente a Z (se non scelta: X originale proiettato); Y = Z x X. Rotazione propria (det = +1).

## Installazione / rimozione
Administration -> Plugins -> "Load Plugin (.zip)" -> `webodm-model-tools.zip`, poi Ctrl+F5 sulla pagina 3D.
Nessuna dipendenza pip/npm, nessuna build, nessun riavvio.
Fino alla 1.0.49 il plugin si chiamava `scaling-tool`: se lo hai installato, disabilitalo ed eliminalo prima di caricare questo (i dati salvati nei task restano).
Rimozione: disabilita o elimina dalla stessa pagina. In emergenza:
`docker exec webapp rm -rf /webodm/app/media/plugins/webodm-model-tools` e riavvia WebODM.

## Limiti noti
- Ortofoto, DSM/DTM e tiles 2D NON vengono trasformati.
- Nel viewer la nuvola e' trasformata a runtime: i dati scalati su disco si ottengono con l'export.

## Autore e licenza

Plugin di **Luca Mandolesi** (archeologo medievista, mandoluca@gmail.com), copyright 2026. Progettato da Luca Mandolesi e sviluppato con [Claude Code](https://claude.com/claude-code) (Anthropic).
Sviluppato da [flyover Academy](https://flyoveracademy.it/).

**Luca Mandolesi** - socio fondatore e direttore del settore ICT e VIARCH. Laureato in archeologia medievale all'Università di Siena, si occupa di scavi archeologici, ricognizioni, musealizzazioni e pubblicazioni, con particolare attenzione allo sviluppo di soluzioni informatiche free e open source. Dal 2005 è responsabile del progetto open source [pyArchInit](https://github.com/pyarchinit/pyarchinit), un plugin QGIS per la gestione GIS dei dati di scavo, e ha insegnato in vari corsi sull'uso del GIS nella gestione dei dati dei beni culturali e su piattaforme GIS open source. Dal 2015 si occupa anche di soluzioni e flussi di lavoro per rilievo GNSS, Structure From Motion, QGIS e mondo 3D con Blender e BlenderGIS. Socio di GFOSS.it e ArcheoFOSS, è amministratore della pagina QGIS ITALIA su Facebook.

Rilasciato con la **GNU Affero General Public License v3 o successiva (AGPL-3.0-or-later)**, la stessa licenza di WebODM: il plugin gira dentro il processo di WebODM, quindi ne è un'opera derivata e deve restare compatibile. Il testo completo è nel file `LICENSE`. Chi lo usa, lo modifica o lo offre come servizio in rete deve rendere disponibile il sorgente (sezione 13 della AGPL).

Strumenti esterni che il plugin usa senza includerli: PDAL, `odm_orthophoto` (ODM, AGPL), GDAL, numpy, Pillow, laspy.
