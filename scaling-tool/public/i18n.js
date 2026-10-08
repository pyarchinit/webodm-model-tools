/*
 * Scaling & Orientation Tool - traduzioni dell'interfaccia
 * Copyright (C) 2026 Luca Mandolesi - SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * FILE GENERATO da i18n/build_i18n.py (motore: i18n/engine.js, testi: i18n/*.txt): non modificarlo a mano.
 *
 * I testi nel codice sono in italiano e fanno da chiave: T('testo {n}', {n: 3}) -> testo nella lingua scelta.
 * Lingua: quella salvata nel selettore del pannello, altrimenti quella del sistema (navigator.languages);
 * se non e' fra quelle disponibili si usa l'inglese. Se manca una traduzione resta l'italiano.
 */
(function () {
    'use strict';

    var LANGS = [["it","Italiano"],["en","English"],["de","Deutsch"],["fr","Français"],["zh","中文"],["ja","日本語"],["ar","العربية"]];                 // [codice, nome nella lingua stessa]
    var CODES = ["en","de","fr","zh","ja","ar"];                 // lingue nell'ordine delle colonne di ROWS (l'italiano e' la chiave)
    var ROWS = [
        ["Avvio...","Starting...","Wird gestartet...","Démarrage...","正在启动……","開始しています...","جارٍ البدء..."],
        ["Matrice salvata","Matrix saved","Matrix gespeichert","Matrice enregistrée","矩阵已保存","行列を保存しました","تم حفظ المصفوفة"],
        ["Completato","Completed","Abgeschlossen","Terminé","已完成","完了","اكتمل"],
        ["Selezione delle facce inquadrate","Selecting the faces in frame","Auswahl der Flächen im Bildausschnitt","Sélection des faces cadrées","正在选取取景框内的面","フレーム内の面を選択中","تحديد الأوجه داخل الإطار"],
        ["Scrittura della mesh inquadrata","Writing the framed mesh","Mesh-Ausschnitt wird geschrieben","Écriture du maillage cadré","正在写入取景框内的网格","フレーム内のメッシュを書き込み中","كتابة الشبكة داخل الإطار"],
        ["Scala metrica e punti di georeferenziazione","Metric scale and georeferencing points","Metrischer Maßstab und Georeferenzierungspunkte","Échelle métrique et points de géoréférencement","公制比例尺与地理配准点","メートル法スケールと地理参照点","المقياس المتري ونقاط الإسناد الجغرافي"],
        ["Scrittura JPEG","Writing JPEG","JPEG wird geschrieben","Écriture du JPEG","正在写入 JPEG","JPEGを書き込み中","كتابة JPEG"],
        ["Preparazione della nuvola di punti","Preparing the point cloud","Punktwolke wird vorbereitet","Préparation du nuage de points","正在准备点云","点群を準備中","تحضير سحابة النقاط"],
        ["Mesh OBJ","OBJ mesh","OBJ-Mesh","Maillage OBJ","OBJ 网格","OBJメッシュ","شبكة OBJ"],
        ["Camera personalizzata","Custom camera","Benutzerdefinierte Kamera","Caméra personnalisée","自定义相机","カスタムカメラ","كاميرا مخصصة"],
        ["Prospetto frontale (guarda verso +Y)","Front elevation (looks towards +Y)","Vorderansicht (Blick nach +Y)","Élévation de face (regarde vers +Y)","正立面（朝向 +Y）","正面図（+Y方向を向く）","واجهة أمامية (تنظر نحو +Y)"],
        ["Prospetto posteriore (guarda verso -Y)","Rear elevation (looks towards -Y)","Rückansicht (Blick nach -Y)","Élévation arrière (regarde vers -Y)","背立面（朝向 -Y）","背面図（-Y方向を向く）","واجهة خلفية (تنظر نحو -Y)"],
        ["Prospetto laterale (guarda verso +X)","Side elevation (looks towards +X)","Seitenansicht (Blick nach +X)","Élévation latérale (regarde vers +X)","侧立面（朝向 +X）","側面図（+X方向を向く）","واجهة جانبية (تنظر نحو +X)"],
        ["Prospetto laterale (guarda verso -X)","Side elevation (looks towards -X)","Seitenansicht (Blick nach -X)","Élévation latérale (regarde vers -X)","侧立面（朝向 -X）","側面図（-X方向を向く）","واجهة جانبية (تنظر نحو -X)"],
        ["Pianta (dall'alto)","Plan (from above)","Grundriss (von oben)","Plan (vue de dessus)","平面（俯视）","平面（上から）","مسقط أفقي (من الأعلى)"],
        ["Permesso negato","Permission denied","Zugriff verweigert","Autorisation refusée","权限被拒绝","権限がありません","تم رفض الإذن"],
        ["Dati non validi","Invalid data","Ungültige Daten","Données non valides","数据无效","データが無効です","بيانات غير صالحة"],
        ["Salva prima la trasformazione di scala e orientamento","Save the scale and orientation transformation first","Speichern Sie zuerst die Maßstabs- und Ausrichtungstransformation","Enregistrez d'abord la transformation d'échelle et d'orientation","请先保存比例与方向变换","先にスケールと向きの変換を保存してください","احفظ أولًا تحويل المقياس والاتجاه"],
        ["Salva prima una trasformazione","Save a transformation first","Speichern Sie zuerst eine Transformation","Enregistrez d'abord une transformation","请先保存变换","先に変換を保存してください","احفظ تحويلًا أولًا"],
        ["Export gia' in corso","Export already in progress","Export läuft bereits","Export déjà en cours","导出已在进行中","エクスポートは既に実行中です","التصدير قيد التنفيذ بالفعل"],
        ["Avvio export fallito","Export start failed","Start des Exports fehlgeschlagen","Échec du démarrage de l'export","启动导出失败","エクスポートの開始に失敗しました","فشل بدء التصدير"],
        ["Ortofoto non trovata","Orthophoto not found","Orthofoto nicht gefunden","Orthophoto introuvable","未找到正射影像","オルソ画像が見つかりません","لم يتم العثور على الأورثوفوتو"],
        ["Ortofoto gia' in elaborazione","Orthophoto already being processed","Orthofoto wird bereits verarbeitet","Orthophoto déjà en cours de traitement","正射影像正在处理中","オルソ画像は既に処理中です","الأورثوفوتو قيد المعالجة بالفعل"],
        ["Avvio fallito","Start failed","Start fehlgeschlagen","Échec du démarrage","启动失败","開始に失敗しました","فشل البدء"],
        ["File TIFF mancante","TIFF file missing","TIFF-Datei fehlt","Fichier TIFF manquant","缺少 TIFF 文件","TIFFファイルがありません","ملف TIFF مفقود"],
        ["Nessuna ortofoto pubblicata dal plugin","No orthophoto published by the plugin","Kein vom Plugin veröffentlichtes Orthofoto","Aucune orthophoto publiée par le plugin","插件尚未发布任何正射影像","プラグインが公開したオルソ画像はありません","لم تنشر الإضافة أي أورثوفوتو"],
        ["Il processo di export si e' interrotto inaspettatamente (vedi export.log)","The export process stopped unexpectedly (see export.log)","Der Exportprozess wurde unerwartet beendet (siehe export.log)","Le processus d'export s'est interrompu de façon inattendue (voir export.log)","导出进程意外中断（见 export.log）","エクスポート処理が予期せず中断しました（export.log を参照）","توقفت عملية التصدير بشكل غير متوقع (راجع export.log)"],
        ["La generazione dell'ortofoto si e' interrotta inaspettatamente (vedi ortho.log)","Orthophoto generation stopped unexpectedly (see ortho.log)","Die Orthofoto-Erzeugung wurde unerwartet beendet (siehe ortho.log)","La génération de l'orthophoto s'est interrompue de façon inattendue (voir ortho.log)","正射影像生成意外中断（见 ortho.log）","オルソ画像の生成が予期せず中断しました（ortho.log を参照）","توقف إنشاء الأورثوفوتو بشكل غير متوقع (راجع ortho.log)"],
        ["Solo un'ortofoto in pianta (dall'alto, senza rotazioni) puo' andare sulla Mappa","Only a plan orthophoto (from above, no rotations) can go on the Map","Nur ein Grundriss-Orthofoto (von oben, ohne Drehungen) kann auf die Karte","Seule une orthophoto en plan (vue de dessus, sans rotations) peut aller sur la carte","只有平面正射影像（俯视、无旋转）才能放到地图上","マップに載せられるのは平面のオルソ画像（真上から、回転なし）だけです","لا يمكن وضع إلا أورثوفوتو بمسقط أفقي (من الأعلى، دون دوران) على الخريطة"],
        ["Per il clip serve la posizione della camera","Clipping needs the camera position","Für den Clip wird die Kameraposition benötigt","Le clip nécessite la position de la caméra","使用 clip 需要相机位置","クリップにはカメラの位置が必要です","يتطلب القص موضع الكاميرا"],
        ["Clip start/end non validi","Invalid clip start/end","Clip start/end ungültig","Clip start/end non valides","clip start/end 无效","clip start/end が無効です","قيمتا clip start/end غير صالحتين"],
        ["Per un'inquadratura serve la posizione della camera","A frame needs the camera position","Für einen Bildausschnitt wird die Kameraposition benötigt","Un cadrage nécessite la position de la caméra","取景框需要相机位置","フレームにはカメラの位置が必要です","يتطلب الإطار موضع الكاميرا"],
        ["Inquadratura non valida (larghezza e altezza da 0.01 a 100000 m)","Invalid frame (width and height from 0.01 to 100000 m)","Ungültiger Bildausschnitt (Breite und Höhe von 0.01 bis 100000 m)","Cadrage non valide (largeur et hauteur de 0.01 à 100000 m)","取景框无效（宽度和高度范围 0.01 至 100000 米）","フレームが無効です（幅と高さは 0.01〜100000 m）","إطار غير صالح (العرض والارتفاع من 0.01 إلى 100000 م)"],
        ["Sorgente non valida (mesh oppure nuvola di punti)","Invalid source (mesh or point cloud)","Ungültige Quelle (Mesh oder Punktwolke)","Source non valide (maillage ou nuage de points)","来源无效（网格或点云）","ソースが無効です（メッシュまたは点群）","مصدر غير صالح (شبكة أو سحابة نقاط)"],
        ["Dimensione del punto non valida (da 1 a 16 pixel)","Invalid point size (1 to 16 pixels)","Ungültige Punktgröße (1 bis 16 Pixel)","Taille de point non valide (de 1 à 16 pixels)","点大小无效（1 至 16 像素）","点のサイズが無効です（1〜16ピクセル）","حجم النقطة غير صالح (من 1 إلى 16 بكسل)"],
        ["Scala non valida (1:N con N da 0.1 a 100000)","Invalid scale (1:N with N from 0.1 to 100000)","Ungültiger Maßstab (1:N mit N von 0.1 bis 100000)","Échelle non valide (1:N avec N de 0.1 à 100000)","比例无效（1:N，N 范围 0.1 至 100000）","縮尺が無効です（1:N、Nは 0.1〜100000）","مقياس غير صالح (1:N حيث N من 0.1 إلى 100000)"],
        ["DPI non validi (da 30 a 2400)","Invalid DPI (30 to 2400)","Ungültige DPI (30 bis 2400)","DPI non valides (de 30 à 2400)","DPI 无效（30 至 2400）","DPIが無効です（30〜2400）","قيمة DPI غير صالحة (من 30 إلى 2400)"],
        ["Risoluzione non valida (da 0.01 a 1000 cm/pixel)","Invalid resolution (0.01 to 1000 cm/pixel)","Ungültige Auflösung (0.01 bis 1000 cm/Pixel)","Résolution non valide (de 0.01 à 1000 cm/pixel)","分辨率无效（0.01 至 1000 厘米/像素）","解像度が無効です（0.01〜1000 cm/ピクセル）","دقة غير صالحة (من 0.01 إلى 1000 سم/بكسل)"],
        ["Risoluzione mancante","Resolution missing","Auflösung fehlt","Résolution manquante","缺少分辨率","解像度がありません","الدقة مفقودة"],
        ["Nuvola di punti (LAZ/LAS) non trovata in questo task","Point cloud (LAZ/LAS) not found in this task","Punktwolke (LAZ/LAS) in diesem Task nicht gefunden","Nuage de points (LAZ/LAS) introuvable dans cette tâche","在此任务中未找到点云（LAZ/LAS）","このタスクに点群（LAZ/LAS）が見つかりません","لم يتم العثور على سحابة النقاط (LAZ/LAS) في هذه المهمة"],
        ["Mesh texturizzata (OBJ) non trovata in questo task","Textured mesh (OBJ) not found in this task","Texturiertes Mesh (OBJ) in diesem Task nicht gefunden","Maillage texturé (OBJ) introuvable dans cette tâche","在此任务中未找到带纹理的网格（OBJ）","このタスクにテクスチャ付きメッシュ（OBJ）が見つかりません","لم يتم العثور على الشبكة المكسوّة بالنسيج (OBJ) في هذه المهمة"],
        ["pdal non trovato: serve per preparare la nuvola di punti","pdal not found: it is needed to prepare the point cloud","pdal nicht gefunden: wird zur Vorbereitung der Punktwolke benötigt","pdal introuvable : nécessaire pour préparer le nuage de points","未找到 pdal：准备点云需要它","pdal が見つかりません：点群の準備に必要です","لم يتم العثور على pdal: مطلوب لتحضير سحابة النقاط"],
        ["Le coordinate di A e B coincidono: non si puo' dedurre un orientamento","The coordinates of A and B coincide: an orientation cannot be derived","Die Koordinaten von A und B fallen zusammen: Eine Ausrichtung lässt sich nicht ableiten","Les coordonnées de A et B sont identiques : on ne peut pas en déduire une orientation","A 与 B 的坐标重合，无法推算方向","AとBの座標が一致しているため、向きを求められません","إحداثيات A وB متطابقة: لا يمكن استنتاج اتجاه"],
        ["I punti A e B del modello sono sulla stessa verticale: scegline uno spostato in orizzontale","Points A and B of the model are on the same vertical: choose one offset horizontally","Die Punkte A und B des Modells liegen auf derselben Senkrechten: Wählen Sie einen horizontal versetzten","Les points A et B du modèle sont sur la même verticale : choisissez-en un décalé horizontalement","模型中的 A、B 两点位于同一条铅垂线上：请选择一个水平方向有偏移的点","モデル上の点AとBが同じ鉛直線上にあります。水平方向にずれた点を選んでください","النقطتان A وB في النموذج على الخط الرأسي نفسه: اختر نقطة مزاحة أفقيًا"],
        ["La distanza orizzontale tra A e B nel modello ({m} m) e' diversa da quella delle coordinate ({c} m): {p} %. Controlla la scala del modello o le coordinate.","The horizontal distance between A and B in the model ({m} m) differs from that of the coordinates ({c} m): {p} %. Check the model scale or the coordinates.","Der horizontale Abstand zwischen A und B im Modell ({m} m) weicht von dem der Koordinaten ({c} m) ab: {p} %. Prüfen Sie den Maßstab des Modells oder die Koordinaten.","La distance horizontale entre A et B dans le modèle ({m} m) diffère de celle des coordonnées ({c} m) : {p} %. Vérifiez l'échelle du modèle ou les coordonnées.","模型中 A、B 之间的水平距离（{m} 米）与坐标给出的距离（{c} 米）不一致：相差 {p} %。请检查模型比例或坐标。","モデル上のAB間の水平距離（{m} m）が座標から求めた距離（{c} m）と異なります：{p} %。モデルのスケールまたは座標を確認してください。","تختلف المسافة الأفقية بين A وB في النموذج ({m} م) عن المسافة المحسوبة من الإحداثيات ({c} م): {p} %. تحقق من مقياس النموذج أو من الإحداثيات."],
        ["Dislivello tra A e B: {m} m nel modello, {c} m nelle coordinate.","Height difference between A and B: {m} m in the model, {c} m in the coordinates.","Höhenunterschied zwischen A und B: {m} m im Modell, {c} m in den Koordinaten.","Dénivelé entre A et B : {m} m dans le modèle, {c} m dans les coordonnées.","A 与 B 的高差：模型中为 {m} 米，坐标中为 {c} 米。","AB間の高低差：モデルでは {m} m、座標では {c} m。","فرق الارتفاع بين A وB: {m} م في النموذج و{c} م في الإحداثيات."],
        ["Quota di A non indicata: le quote restano relative all'origine del modello.","Elevation of A not given: elevations remain relative to the model origin.","Höhe von A nicht angegeben: Die Höhen bleiben relativ zum Ursprung des Modells.","Altitude de A non indiquée : les altitudes restent relatives à l'origine du modèle.","未给出 A 的高程：高程仍相对于模型原点。","Aの標高が指定されていないため、標高はモデルの原点を基準にしたままです。","لم يُحدَّد ارتفاع A: تبقى الارتفاعات نسبية إلى نقطة أصل النموذج."],
        ["codice EPSG, es. 3003","EPSG code, e.g. 3003","EPSG-Code, z. B. 3003","code EPSG, ex. 3003","EPSG 代码，例如 3003","EPSGコード（例：3003）","رمز EPSG، مثال: 3003"],
        ["Est (X)","Easting (X)","Ost (X)","Est (X)","东坐标 (X)","東距 (X)","الإحداثي الشرقي (X)"],
        ["Nord (Y)","Northing (Y)","Nord (Y)","Nord (Y)","北坐标 (Y)","北距 (Y)","الإحداثي الشمالي (Y)"],
        ["Quota Z (facoltativa)","Elevation Z (optional)","Höhe Z (optional)","Altitude Z (facultative)","高程 Z（可选）","標高 Z（省略可）","الارتفاع Z (اختياري)"],
        ["Scegli il sistema di coordinate...","Choose the coordinate system...","Koordinatensystem wählen...","Choisissez le système de coordonnées...","选择坐标系……","座標系を選択...","اختر نظام الإحداثيات..."],
        ["Altro codice EPSG...","Other EPSG code...","Anderer EPSG-Code...","Autre code EPSG...","其他 EPSG 代码……","その他のEPSGコード...","رمز EPSG آخر..."],
        ["{what}: manca il valore","{what}: value missing","{what}: Wert fehlt","{what} : valeur manquante","{what}：缺少数值","{what}：値がありません","{what}: القيمة مفقودة"],
        ["{what}: \"{v}\" non e' un numero","{what}: \"{v}\" is not a number","{what}: „{v}“ ist keine Zahl","{what} : « {v} » n'est pas un nombre","{what}：“{v}”不是数字","{what}：「{v}」は数値ではありません","{what}: «{v}» ليس رقمًا"],
        ["{p} - Est","{p} - Easting","{p} - Ost","{p} - Est","{p} - 东坐标","{p} - 東距","{p} - الإحداثي الشرقي"],
        ["{p} - Nord","{p} - Northing","{p} - Nord","{p} - Nord","{p} - 北坐标","{p} - 北距","{p} - الإحداثي الشمالي"],
        ["{p} - quota","{p} - elevation","{p} - Höhe","{p} - altitude","{p} - 高程","{p} - 標高","{p} - الارتفاع"],
        ["Scegli il sistema di coordinate (EPSG)","Choose the coordinate system (EPSG)","Wählen Sie das Koordinatensystem (EPSG)","Choisissez le système de coordonnées (EPSG)","请选择坐标系 (EPSG)","座標系 (EPSG) を選択してください","اختر نظام الإحداثيات (EPSG)"],
        ["Georiferimento non attivo","Georeferencing not active","Georeferenzierung nicht aktiv","Géoréférencement inactif","地理配准未启用","地理参照は有効ではありません","الإسناد الجغرافي غير مفعّل"],
        ["Scegli A sul modello","Pick A on the model","A am Modell wählen","Choisir A sur le modèle","在模型上选取 A","モデル上でAを選択","اختر A على النموذج"],
        ["Clicca il punto A: quello di cui conosci le coordinate.","Click point A: the one whose coordinates you know.","Klicken Sie Punkt A an: den, dessen Koordinaten Sie kennen.","Cliquez sur le point A : celui dont vous connaissez les coordonnées.","点击 A 点：即您已知其坐标的点。","座標がわかっている点Aをクリックしてください。","انقر على النقطة A: التي تعرف إحداثياتها."],
        ["Punto A scelto.","Point A selected.","Punkt A gewählt.","Point A choisi.","已选取 A 点。","点Aを選択しました。","تم اختيار النقطة A."],
        ["Scegli B sul modello","Pick B on the model","B am Modell wählen","Choisir B sur le modèle","在模型上选取 B","モデル上でBを選択","اختر B على النموذج"],
        ["Clicca il punto B: un secondo punto di cui conosci le coordinate.","Click point B: a second point whose coordinates you know.","Klicken Sie Punkt B an: einen zweiten Punkt, dessen Koordinaten Sie kennen.","Cliquez sur le point B : un second point dont vous connaissez les coordonnées.","点击 B 点：即您已知其坐标的第二个点。","座標がわかっている2点目の点Bをクリックしてください。","انقر على النقطة B: نقطة ثانية تعرف إحداثياتها."],
        ["Punto B scelto.","Point B selected.","Punkt B gewählt.","Point B choisi.","已选取 B 点。","点Bを選択しました。","تم اختيار النقطة B."],
        ["Punto A","Point A","Punkt A","Point A","A 点","点A","النقطة A"],
        ["Per il punto B scegli anche il punto sul modello","For point B, also pick the point on the model","Wählen Sie für Punkt B auch den Punkt am Modell","Pour le point B, choisissez aussi le point sur le modèle","对于 B 点，还需要在模型上选取对应的点","点Bについては、モデル上の点も選択してください","بالنسبة إلى النقطة B، اختر أيضًا النقطة على النموذج"],
        ["Punto B","Point B","Punkt B","Point B","B 点","点B","النقطة B"],
        ["La scala del modello non e' stata impostata (sezione 1): le coordinate risulteranno in unita' del modello.","The model scale has not been set (section 1): coordinates will be in model units.","Der Maßstab des Modells wurde nicht gesetzt (Abschnitt 1): Die Koordinaten liegen in Modelleinheiten vor.","L'échelle du modèle n'a pas été définie (section 1) : les coordonnées seront en unités du modèle.","尚未设置模型比例（第 1 节）：坐标将以模型单位表示。","モデルのスケールが設定されていません（セクション1）。座標はモデル単位になります。","لم يُضبط مقياس النموذج (القسم 1): ستكون الإحداثيات بوحدات النموذج."],
        ["Salvataggio e georeferenziazione...","Saving and georeferencing...","Speichern und Georeferenzieren...","Enregistrement et géoréférencement...","正在保存并进行地理配准……","保存と地理参照を実行中...","جارٍ الحفظ والإسناد الجغرافي..."],
        ["Modello georiferito in EPSG:{epsg}. Esporto la nuvola georiferita...","Model georeferenced in EPSG:{epsg}. Exporting the georeferenced cloud...","Modell in EPSG:{epsg} georeferenziert. Die georeferenzierte Punktwolke wird exportiert...","Modèle géoréférencé en EPSG:{epsg}. Export du nuage géoréférencé...","模型已按 EPSG:{epsg} 完成地理配准。正在导出已配准的点云……","モデルをEPSG:{epsg}で地理参照しました。地理参照済みの点群をエクスポート中...","تم الإسناد الجغرافي للنموذج بنظام EPSG:{epsg}. جارٍ تصدير سحابة النقاط المُسنَدة جغرافيًا..."],
        ["Georeferenziazione non riuscita: {e}","Georeferencing failed: {e}","Georeferenzierung fehlgeschlagen: {e}","Échec du géoréférencement : {e}","地理配准失败：{e}","地理参照に失敗しました：{e}","فشل الإسناد الجغرافي: {e}"],
        ["Georeferenziare comunque?","Georeference anyway?","Trotzdem georeferenzieren?","Géoréférencer quand même ?","仍要进行地理配准吗？","このまま地理参照しますか？","هل تريد الإسناد الجغرافي على أي حال؟"],
        ["Togliere la georeferenziazione? Il modello torna nel sistema locale (scala e orientamento restano).","Remove the georeferencing? The model goes back to the local system (scale and orientation are kept).","Georeferenzierung entfernen? Das Modell kehrt in das lokale System zurück (Maßstab und Ausrichtung bleiben erhalten).","Supprimer le géoréférencement ? Le modèle revient dans le système local (l'échelle et l'orientation sont conservées).","要移除地理配准吗？模型将回到本地坐标系（比例和方向保持不变）。","地理参照を解除しますか？モデルはローカル座標系に戻ります（スケールと向きは維持されます）。","هل تريد إزالة الإسناد الجغرافي؟ سيعود النموذج إلى النظام المحلي (يبقى المقياس والاتجاه)."],
        ["Georeferenziazione rimossa.","Georeferencing removed.","Georeferenzierung entfernt.","Géoréférencement supprimé.","已移除地理配准。","地理参照を解除しました。","تمت إزالة الإسناد الجغرافي."],
        ["Rimozione non riuscita: {e}","Removal failed: {e}","Entfernen fehlgeschlagen: {e}","Échec de la suppression : {e}","移除失败：{e}","解除に失敗しました：{e}","فشلت الإزالة: {e}"],
        ["4. Georiferimento","4. Georeferencing","4. Georeferenzierung","4. Géoréférencement","4. 地理配准","4. 地理参照","4. الإسناد الجغرافي"],
        ["Dai al modello coordinate vere: un punto noto e, se vuoi, un secondo punto per l'orientamento.","Give the model real coordinates: one known point and, optionally, a second point for the orientation.","Geben Sie dem Modell echte Koordinaten: einen bekannten Punkt und, wenn gewünscht, einen zweiten Punkt für die Ausrichtung.","Donnez au modèle de vraies coordonnées : un point connu et, si vous le souhaitez, un second point pour l'orientation.","为模型赋予真实坐标：一个已知点，另可选一个用于确定方向的第二点。","モデルに実際の座標を与えます。既知の点を1つ、必要なら向きを決めるための2点目を指定します。","امنح النموذج إحداثيات حقيقية: نقطة معروفة واحدة، ونقطة ثانية اختيارية لتحديد الاتجاه."],
        ["Sistema di coordinate (in metri):","Coordinate system (in metres):","Koordinatensystem (in Metern):","Système de coordonnées (en mètres) :","坐标系（单位：米）：","座標系（メートル単位）：","نظام الإحداثيات (بالأمتار):"],
        ["Punto A (origine)","Point A (origin)","Punkt A (Ursprung)","Point A (origine)","A 点（原点）","点A（原点）","النقطة A (نقطة الأصل)"],
        ["A scelto sul modello ✔","A picked on the model ✔","A am Modell gewählt ✔","A choisi sur le modèle ✔","已在模型上选取 A ✔","モデル上でAを選択済み ✔","تم اختيار A على النموذج ✔"],
        ["Senza scelta, A e' l'origine del modello (sezione 3).","If none is picked, A is the model origin (section 3).","Ohne Auswahl ist A der Ursprung des Modells (Abschnitt 3).","Sans choix, A est l'origine du modèle (section 3).","如果不选取，A 即为模型原点（第 3 节）。","選択しない場合、Aはモデルの原点（セクション3）になります。","بدون اختيار، تكون A هي نقطة أصل النموذج (القسم 3)."],
        ["Coordinate assolute di A: Est, Nord, quota (facoltativa)","Absolute coordinates of A: Easting, Northing, elevation (optional)","Absolute Koordinaten von A: Ost, Nord, Höhe (optional)","Coordonnées absolues de A : Est, Nord, altitude (facultative)","A 的绝对坐标：东、北、高程（可选）","Aの絶対座標：東、北、標高（省略可）","الإحداثيات المطلقة لـ A: شرق، شمال، ارتفاع (اختياري)"],
        ["Punto B (orientamento, facoltativo)","Point B (orientation, optional)","Punkt B (Ausrichtung, optional)","Point B (orientation, facultatif)","B 点（用于定向，可选）","点B（向き用、省略可）","النقطة B (الاتجاه، اختيارية)"],
        ["B scelto sul modello ✔","B picked on the model ✔","B am Modell gewählt ✔","B choisi sur le modèle ✔","已在模型上选取 B ✔","モデル上でBを選択済み ✔","تم اختيار B على النموذج ✔"],
        ["togli B","remove B","B entfernen","retirer B","移除 B","Bを外す","إزالة B"],
        ["Senza B il modello resta orientato come ora (X = Est, Y = Nord).","Without B the model keeps its current orientation (X = East, Y = North).","Ohne B bleibt das Modell wie jetzt ausgerichtet (X = Ost, Y = Nord).","Sans B, le modèle garde son orientation actuelle (X = Est, Y = Nord).","没有 B 时，模型保持当前方向（X = 东，Y = 北）。","Bがない場合、モデルは現在の向きのままです（X = 東、Y = 北）。","بدون B يبقى النموذج بتوجيهه الحالي (X = شرق، Y = شمال)."],
        ["Coordinate assolute di B:","Absolute coordinates of B:","Absolute Koordinaten von B:","Coordonnées absolues de B :","B 的绝对坐标：","Bの絶対座標：","الإحداثيات المطلقة لـ B:"],
        ["… georeferenziazione in corso","… georeferencing in progress","… Georeferenzierung läuft","… géoréférencement en cours","…… 正在进行地理配准","… 地理参照を実行中","… جارٍ الإسناد الجغرافي"],
        ["🌍 Georiferisci la nuvola","🌍 Georeference the cloud","🌍 Punktwolke georeferenzieren","🌍 Géoréférencer le nuage","🌍 对点云进行地理配准","🌍 点群を地理参照","🌍 إسناد السحابة جغرافيًا"],
        ["↺ Rimuovi la georeferenziazione","↺ Remove the georeferencing","↺ Georeferenzierung entfernen","↺ Supprimer le géoréférencement","↺ 移除地理配准","↺ 地理参照を解除","↺ إزالة الإسناد الجغرافي"],
        ["Sola lettura: serve il permesso di modifica del progetto.","Read-only: project edit permission is needed.","Schreibgeschützt: Bearbeitungsberechtigung für das Projekt erforderlich.","Lecture seule : l'autorisation de modification du projet est nécessaire.","只读：需要项目的编辑权限。","読み取り専用：プロジェクトの編集権限が必要です。","للقراءة فقط: يلزم إذن تعديل المشروع."],
        ["Georiferito ✔  EPSG:{epsg}","Georeferenced ✔  EPSG:{epsg}","Georeferenziert ✔  EPSG:{epsg}","Géoréférencé ✔  EPSG:{epsg}","已地理配准 ✔  EPSG:{epsg}","地理参照済み ✔  EPSG:{epsg}","تم الإسناد الجغرافي ✔  EPSG:{epsg}"],
        ["Rotazione applicata: {deg}°","Rotation applied: {deg}°","Angewandte Rotation: {deg}°","Rotation appliquée : {deg}°","应用的旋转：{deg}°","適用された回転：{deg}°","الدوران المطبَّق: {deg}°"],
        ["La scena 3D usa coordinate relative ad A. Per avere quelle assolute somma: Est + {e}, Nord + {n}","The 3D scene uses coordinates relative to A. To get the absolute ones add: Easting + {e}, Northing + {n}","Die 3D-Szene verwendet Koordinaten relativ zu A. Für die absoluten Werte addieren Sie: Ost + {e}, Nord + {n}","La scène 3D utilise des coordonnées relatives à A. Pour obtenir les absolues, ajoutez : Est + {e}, Nord + {n}","三维场景使用相对于 A 的坐标。要得到绝对坐标，请加上：东 + {e}，北 + {n}","3Dシーンは A を基準にした相対座標を使います。絶対座標にするには次を加算してください：東 + {e}、北 + {n}","يستخدم المشهد ثلاثي الأبعاد إحداثيات نسبية إلى A. للحصول على الإحداثيات المطلقة أضف: شرق + {e}، شمال + {n}"],
        ["quota + {z}","elevation + {z}","Höhe + {z}","altitude + {z}","高程 + {z}","標高 + {z}","الارتفاع + {z}"],
        ["Controllo A-B: modello {m} m, coordinate {c} m.","A-B check: model {m} m, coordinates {c} m.","Kontrolle A–B: Modell {m} m, Koordinaten {c} m.","Contrôle A-B : modèle {m} m, coordonnées {c} m.","A-B 校核：模型 {m} 米，坐标 {c} 米。","AB確認：モデル {m} m、座標 {c} m。","فحص A-B: النموذج {m} م، الإحداثيات {c} م."],
        ["Origine e direzione X (sezione 3) sono ora definite da A e B; scala e asse Z restano quelli impostati sopra.","Origin and X direction (section 3) are now defined by A and B; scale and Z axis stay as set above.","Ursprung und X-Richtung (Abschnitt 3) sind nun durch A und B festgelegt; Maßstab und Z-Achse bleiben wie oben eingestellt.","L'origine et la direction X (section 3) sont désormais définies par A et B ; l'échelle et l'axe Z restent ceux réglés plus haut.","原点和 X 方向（第 3 节）现在由 A 和 B 决定；比例和 Z 轴保持上面的设置。","原点とX方向（セクション3）は、AとBによって決まるようになりました。スケールとZ軸は上で設定したままです。","أصبحت نقطة الأصل واتجاه X (القسم 3) محدَّدتين الآن بواسطة A وB؛ ويبقى المقياس والمحور Z كما ضُبطا أعلاه."],
        ["Le ortofoto \"Pianta\" escono georiferite (GeoTIFF con EPSG:{epsg}).","\"Plan\" orthophotos come out georeferenced (GeoTIFF with EPSG:{epsg}).","Die „Grundriss“-Orthofotos werden georeferenziert ausgegeben (GeoTIFF mit EPSG:{epsg}).","Les orthophotos « Plan » sont produites géoréférencées (GeoTIFF avec EPSG:{epsg}).","“平面”正射影像将带地理配准输出（带 EPSG:{epsg} 的 GeoTIFF）。","「平面」のオルソ画像は地理参照付きで出力されます（EPSG:{epsg}のGeoTIFF）。","تُنتَج أورثوفوتو «المسقط الأفقي» مُسنَدة جغرافيًا (GeoTIFF بنظام EPSG:{epsg})."],
        ["Italia","Italy","Italien","Italie","意大利","イタリア","إيطاليا"],
        ["Europa","Europe","Europa","Europe","欧洲","ヨーロッパ","أوروبا"],
        ["Mondo (UTM WGS84)","World (UTM WGS84)","Welt (UTM WGS84)","Monde (UTM WGS84)","全球 (UTM WGS84)","世界 (UTM WGS84)","العالم (UTM WGS84)"],
        ["RGF93 / Lambert-93 (Francia)","RGF93 / Lambert-93 (France)","RGF93 / Lambert-93 (Frankreich)","RGF93 / Lambert-93 (France)","RGF93 / Lambert-93（法国）","RGF93 / Lambert-93（フランス）","RGF93 / Lambert-93 (فرنسا)"],
        ["DHDN / Gauss-Kruger 3 (Germania)","DHDN / Gauss-Kruger 3 (Germany)","DHDN / Gauß-Krüger 3 (Deutschland)","DHDN / Gauss-Kruger 3 (Allemagne)","DHDN / Gauss-Kruger 3（德国）","DHDN / Gauss-Kruger 3（ドイツ）","DHDN / Gauss-Kruger 3 (ألمانيا)"],
        ["CH1903+ / LV95 (Svizzera)","CH1903+ / LV95 (Switzerland)","CH1903+ / LV95 (Schweiz)","CH1903+ / LV95 (Suisse)","CH1903+ / LV95（瑞士）","CH1903+ / LV95（スイス）","CH1903+ / LV95 (سويسرا)"],
        ["Monte Mario / Italy zone 1 (Gauss-Boaga Ovest)","Monte Mario / Italy zone 1 (Gauss-Boaga West)","Monte Mario / Italy zone 1 (Gauß-Boaga West)","Monte Mario / Italy zone 1 (Gauss-Boaga Ouest)","Monte Mario / Italy zone 1（Gauss-Boaga 西）","Monte Mario / Italy zone 1（ガウス・ボアガ西）","Monte Mario / Italy zone 1 (غاوس-بواغا غرب)"],
        ["Monte Mario / Italy zone 2 (Gauss-Boaga Est)","Monte Mario / Italy zone 2 (Gauss-Boaga East)","Monte Mario / Italy zone 2 (Gauß-Boaga Ost)","Monte Mario / Italy zone 2 (Gauss-Boaga Est)","Monte Mario / Italy zone 2（Gauss-Boaga 东）","Monte Mario / Italy zone 2（ガウス・ボアガ東）","Monte Mario / Italy zone 2 (غاوس-بواغا شرق)"],
        ["Niente sotto il cursore: clicca su un punto della nuvola o della mesh.","Nothing under the cursor: click on a point of the cloud or the mesh.","Nichts unter dem Cursor: Klicken Sie auf einen Punkt der Punktwolke oder des Meshs.","Rien sous le curseur : cliquez sur un point du nuage ou du maillage.","光标下没有内容：请点击点云或网格上的某个点。","カーソルの下に何もありません。点群またはメッシュ上の点をクリックしてください。","لا يوجد شيء تحت المؤشر: انقر على نقطة من سحابة النقاط أو الشبكة."],
        ["Modalita' annullata.","Mode cancelled.","Modus abgebrochen.","Mode annulé.","已取消该模式。","モードをキャンセルしました。","تم إلغاء الوضع."],
        ["Misura 2 punti","Measure 2 points","2 Punkte messen","Mesurer 2 points","测量两点","2点を測定","قياس نقطتين"],
        ["Clicca il punto A e poi il punto B sulla nuvola.","Click point A, then point B on the cloud.","Klicken Sie auf Punkt A und danach auf Punkt B in der Punktwolke.","Cliquez sur le point A puis sur le point B du nuage.","先在点云上点击 A 点，再点击 B 点。","点群上で点Aをクリックし、続いて点Bをクリックしてください。","انقر على النقطة A ثم النقطة B على سحابة النقاط."],
        ["Verticale: 2 punti","Vertical: 2 points","Vertikale: 2 Punkte","Verticale : 2 points","垂直线：两点","鉛直線：2点","الرأسي: نقطتان"],
        ["Clicca un punto in BASSO e uno in ALTO su un elemento verticale (spigolo di muro, palo...).","Click one point at the BOTTOM and one at the TOP of a vertical element (wall corner, pole...).","Klicken Sie einen Punkt UNTEN und einen OBEN an einem vertikalen Element (Mauerkante, Pfosten ...).","Cliquez sur un point en BAS et un point en HAUT d'un élément vertical (arête de mur, poteau...).","在垂直物体（墙角、立柱等）上分别点击下端和上端各一点。","鉛直な要素（壁の角、柱など）の下端と上端をそれぞれクリックしてください。","انقر على نقطة في الأسفل وأخرى في الأعلى على عنصر رأسي (زاوية جدار، عمود...)."],
        ["Piano di appoggio","Support plane","Auflageebene","Plan d'appui","基准平面","基準面","مستوى الارتكاز"],
        ["Clicca almeno 3 punti sul pavimento/terreno, poi premi \"Calcola\".","Click at least 3 points on the floor/ground, then press \"Compute from plane\".","Klicken Sie mindestens 3 Punkte auf Boden/Gelände an und drücken Sie dann „Aus Ebene berechnen“.","Cliquez sur au moins 3 points du sol/terrain, puis appuyez sur « Calculer à partir du plan ».","在地面上至少点击 3 个点，然后按“由平面计算”。","床または地面上の点を3点以上クリックし、「平面から計算」を押してください。","انقر على 3 نقاط على الأقل على الأرضية/التضاريس، ثم اضغط «احسب من المستوى»."],
        ["Direzione X: 2 punti","X direction: 2 points","X-Richtung: 2 Punkte","Direction X : 2 points","X 方向：两点","X方向：2点","اتجاه X: نقطتان"],
        ["Clicca l'inizio e la fine della direzione che diventera' l'asse +X.","Click the start and the end of the direction that will become the +X axis.","Klicken Sie Anfang und Ende der Richtung an, die zur +X-Achse wird.","Cliquez sur le début et la fin de la direction qui deviendra l'axe +X.","点击将成为 +X 轴的方向的起点和终点。","+X軸になる方向の始点と終点をクリックしてください。","انقر على بداية ونهاية الاتجاه الذي سيصبح المحور +X."],
        ["Origine: 1 punto","Origin: 1 point","Ursprung: 1 Punkt","Origine : 1 point","原点：一个点","原点：1点","نقطة الأصل: نقطة واحدة"],
        ["Clicca il punto che diventera' (0, 0, 0).","Click the point that will become (0, 0, 0).","Klicken Sie den Punkt an, der zu (0, 0, 0) wird.","Cliquez sur le point qui deviendra (0, 0, 0).","点击将成为 (0, 0, 0) 的点。","(0, 0, 0) になる点をクリックしてください。","انقر على النقطة التي ستصبح (0, 0, 0)."],
        ["(Esc per annullare)","(Esc to cancel)","(Esc zum Abbrechen)","(Échap pour annuler)","（按 Esc 取消）","（Escでキャンセル）","(اضغط Esc للإلغاء)"],
        ["I due punti coincidono.","The two points coincide.","Die beiden Punkte fallen zusammen.","Les deux points sont confondus.","两个点重合。","2つの点が一致しています。","النقطتان متطابقتان."],
        ["Asse Z impostato dai 2 punti (usa \"Inverti Z\" se la nuvola e' capovolta).","Z axis set from the 2 points (use \"Flip Z\" if the cloud is upside down).","Z-Achse aus den 2 Punkten gesetzt („Z umkehren“ verwenden, falls die Punktwolke auf dem Kopf steht).","Axe Z défini à partir des 2 points (utilisez « Inverser Z » si le nuage est à l'envers).","已根据两点设置 Z 轴（如果点云上下颠倒，请使用“反转 Z”）。","2点からZ軸を設定しました（点群が上下逆なら「Z を反転」を使ってください）。","تم ضبط المحور Z من النقطتين (استخدم «عكس Z» إذا كانت سحابة النقاط مقلوبة)."],
        ["Direzione X impostata.","X direction set.","X-Richtung gesetzt.","Direction X définie.","已设置 X 方向。","X方向を設定しました。","تم ضبط اتجاه X."],
        ["Origine impostata.","Origin set.","Ursprung gesetzt.","Origine définie.","已设置原点。","原点を設定しました。","تم ضبط نقطة الأصل."],
        ["Servono almeno 3 punti.","At least 3 points are needed.","Es werden mindestens 3 Punkte benötigt.","Il faut au moins 3 points.","至少需要 3 个点。","3点以上必要です。","يلزم 3 نقاط على الأقل."],
        ["Punti allineati: impossibile definire un piano.","Points are collinear: a plane cannot be defined.","Die Punkte liegen auf einer Linie: Eine Ebene lässt sich nicht bestimmen.","Points alignés : impossible de définir un plan.","点共线，无法确定平面。","点が一直線上にあり、平面を定義できません。","النقاط على استقامة واحدة: لا يمكن تحديد مستوى."],
        ["Asse Z impostato dal piano ({n} punti). Se e' capovolto usa \"Inverti Z\".","Z axis set from the plane ({n} points). If it is upside down, use \"Flip Z\".","Z-Achse aus der Ebene gesetzt ({n} Punkte). Falls sie auf dem Kopf steht, „Z umkehren“ verwenden.","Axe Z défini à partir du plan ({n} points). S'il est à l'envers, utilisez « Inverser Z ».","已根据平面设置 Z 轴（{n} 个点）。如果方向颠倒，请使用“反转 Z”。","平面（{n} 点）からZ軸を設定しました。逆向きの場合は「Z を反転」を使ってください。","تم ضبط المحور Z من المستوى ({n} نقاط). إذا كان معكوسًا فاستخدم «عكس Z»."],
        ["Asse Z invertito.","Z axis flipped.","Z-Achse umgekehrt.","Axe Z inversé.","已反转 Z 轴。","Z軸を反転しました。","تم عكس المحور Z."],
        ["Asse X invertito.","X axis flipped.","X-Achse umgekehrt.","Axe X inversé.","已反转 X 轴。","X軸を反転しました。","تم عكس المحور X."],
        ["Vista non valida: ruota la camera e riprova.","Invalid view: rotate the camera and try again.","Ungültige Ansicht: Kamera drehen und erneut versuchen.","Vue non valide : faites pivoter la caméra et réessayez.","视图无效：请旋转相机后重试。","ビューが無効です。カメラを回転してもう一度お試しください。","العرض غير صالح: قم بتدوير الكاميرا وأعد المحاولة."],
        ["Asse X parallelo alla vista (verso destra). Se la vista e' dall'alto o dal basso la Z deve gia' essere impostata.","X axis parallel to the view (pointing right). If the view is from above or below, Z must already be set.","X-Achse parallel zur Ansicht (nach rechts). Bei einer Ansicht von oben oder unten muss Z bereits gesetzt sein.","Axe X parallèle à la vue (vers la droite). Si la vue est de dessus ou de dessous, Z doit déjà être défini.","X 轴已与视图平行（指向右侧）。如果是从上方或下方观察，必须先设置好 Z 轴。","X軸をビューと平行（右向き）にしました。真上または真下から見ている場合は、先にZ軸を設定しておく必要があります。","المحور X موازٍ للعرض (باتجاه اليمين). إذا كان العرض من الأعلى أو الأسفل فيجب ضبط Z مسبقًا."],
        ["Camera sul centro del modello: ruota la vista e riprova.","Camera is at the model centre: rotate the view and try again.","Die Kamera steht im Modellzentrum: Ansicht drehen und erneut versuchen.","La caméra est au centre du modèle : faites pivoter la vue et réessayez.","相机位于模型中心：请旋转视图后重试。","カメラがモデルの中心にあります。ビューを回転してもう一度お試しください。","الكاميرا في مركز النموذج: قم بتدوير العرض وأعد المحاولة."],
        ["Asse X orientato verso di te (proiettato sul piano orizzontale).","X axis pointing towards you (projected onto the horizontal plane).","X-Achse zeigt zu Ihnen (auf die horizontale Ebene projiziert).","Axe X orienté vers vous (projeté sur le plan horizontal).","X 轴已朝向您（投影到水平面上）。","X軸を手前向きにしました（水平面に投影）。","المحور X متجه نحوك (مُسقَط على المستوى الأفقي)."],
        ["Inserisci una distanza reale in metri > 0.","Enter a real distance in metres > 0.","Geben Sie eine reale Distanz in Metern > 0 ein.","Saisissez une distance réelle en mètres > 0.","请输入大于 0 的实际距离（米）。","0より大きい実際の距離（メートル）を入力してください。","أدخل مسافة حقيقية بالأمتار أكبر من 0."],
        ["Scala impostata: 1 unita' modello = {s} m.","Scale set: 1 model unit = {s} m.","Maßstab gesetzt: 1 Modelleinheit = {s} m.","Échelle définie : 1 unité du modèle = {s} m.","已设置比例：1 个模型单位 = {s} 米。","スケールを設定しました：モデル1単位 = {s} m。","تم ضبط المقياس: وحدة نموذج واحدة = {s} م."],
        ["Annulla","Cancel","Abbrechen","Annuler","取消","キャンセル","إلغاء"],
        ["Conferma","Confirm","Bestätigen","Confirmer","确认","確認","تأكيد"],
        ["Eliminare anche la trasformazione salvata per questo task?","Also delete the transformation saved for this task?","Auch die für diesen Task gespeicherte Transformation löschen?","Supprimer aussi la transformation enregistrée pour cette tâche ?","是否同时删除此任务已保存的变换？","このタスクに保存されている変換も削除しますか？","هل تريد حذف التحويل المحفوظ لهذه المهمة أيضًا؟"],
        ["Ripristinato il modello originale.","Original model restored.","Originalmodell wiederhergestellt.","Modèle d'origine rétabli.","已恢复原始模型。","元のモデルに戻しました。","تمت استعادة النموذج الأصلي."],
        ["Trasformazione salvata.","Transformation saved.","Transformation gespeichert.","Transformation enregistrée.","变换已保存。","変換を保存しました。","تم حفظ التحويل."],
        ["Errore nel salvataggio: {e}","Save error: {e}","Fehler beim Speichern: {e}","Erreur d'enregistrement : {e}","保存出错：{e}","保存エラー：{e}","خطأ في الحفظ: {e}"],
        ["Salva la trasformazione prima di esportare.","Save the transformation before exporting.","Speichern Sie die Transformation vor dem Export.","Enregistrez la transformation avant d'exporter.","导出前请先保存变换。","エクスポートの前に変換を保存してください。","احفظ التحويل قبل التصدير."],
        ["Export non avviato: {e}","Export not started: {e}","Export nicht gestartet: {e}","Export non démarré : {e}","未能开始导出：{e}","エクスポートを開始できません：{e}","لم يبدأ التصدير: {e}"],
        ["Salvataggio di {f}...","Saving {f}...","{f} wird gespeichert...","Enregistrement de {f}...","正在保存 {f}……","{f} を保存中...","جارٍ حفظ {f}..."],
        ["Salvato: {f}","Saved: {f}","Gespeichert: {f}","Enregistré : {f}","已保存：{f}","保存しました：{f}","تم الحفظ: {f}"],
        ["Salvataggio non riuscito ({f}): {e}","Save failed ({f}): {e}","Speichern fehlgeschlagen ({f}): {e}","Échec de l'enregistrement ({f}) : {e}","保存失败（{f}）：{e}","保存に失敗しました（{f}）：{e}","فشل الحفظ ({f}): {e}"],
        ["Scegli dove salvare {f} nella finestra \"Salva con nome\".","Choose where to save {f} in the \"Save as\" window.","Wählen Sie im Fenster „Speichern unter“ den Speicherort für {f}.","Choisissez où enregistrer {f} dans la fenêtre « Enregistrer sous ».","请在“另存为”窗口中选择 {f} 的保存位置。","「名前を付けて保存」ウィンドウで {f} の保存先を選んでください。","اختر مكان حفظ {f} في نافذة «حفظ باسم»."],
        ["Salva...","Save...","Speichern...","Enregistrer...","保存……","保存...","حفظ..."],
        ["Salva tutti","Save all","Alle speichern","Tout enregistrer","全部保存","すべて保存","حفظ الكل"],
        ["Chiudi","Close","Schließen","Fermer","关闭","閉じる","إغلاق"],
        ["Export pronto: dove vuoi salvarlo?","Export ready: where do you want to save it?","Export fertig: Wo möchten Sie ihn speichern?","Export prêt : où voulez-vous l'enregistrer ?","导出完成：要保存到哪里？","エクスポートが完了しました。保存先を選んでください。","اكتمل التصدير: أين تريد حفظه؟"],
        ["Fronte","Front","Vorne","Face","正面","正面","أمامي"],
        ["Prospetto frontale: guarda verso +Y (X a destra, Z in alto)","Front elevation: looks towards +Y (X to the right, Z up)","Vorderansicht: Blick nach +Y (X rechts, Z oben)","Élévation de face : regarde vers +Y (X à droite, Z en haut)","正立面：朝向 +Y（X 在右，Z 在上）","正面図：+Y方向を向く（Xが右、Zが上）","واجهة أمامية: تنظر نحو +Y (X يمينًا وZ للأعلى)"],
        ["Retro","Back","Hinten","Arrière","背面","背面","خلفي"],
        ["Prospetto posteriore: guarda verso -Y","Rear elevation: looks towards -Y","Rückansicht: Blick nach -Y","Élévation arrière : regarde vers -Y","背立面：朝向 -Y","背面図：-Y方向を向く","واجهة خلفية: تنظر نحو -Y"],
        ["Lato +X","Side +X","Seite +X","Côté +X","+X 侧","+X側","الجانب +X"],
        ["Prospetto laterale: guarda verso +X","Side elevation: looks towards +X","Seitenansicht: Blick nach +X","Élévation latérale : regarde vers +X","侧立面：朝向 +X","側面図：+X方向を向く","واجهة جانبية: تنظر نحو +X"],
        ["Lato −X","Side −X","Seite −X","Côté −X","−X 侧","−X側","الجانب −X"],
        ["Prospetto laterale: guarda verso -X","Side elevation: looks towards -X","Seitenansicht: Blick nach -X","Élévation latérale : regarde vers -X","侧立面：朝向 -X","側面図：-X方向を向く","واجهة جانبية: تنظر نحو -X"],
        ["Pianta","Plan","Grundriss","Plan","平面","平面","مسقط أفقي"],
        ["Dall'alto: X a destra, Y in alto","From above: X to the right, Y up","Von oben: X rechts, Y oben","Vue de dessus : X à droite, Y en haut","俯视：X 在右，Y 在上","上から：Xが右、Yが上","من الأعلى: X يمينًا وY للأعلى"],
        ["Da sotto","From below","Von unten","Dessous","仰视","下から","من الأسفل"],
        ["Vista dal basso","View from below","Ansicht von unten","Vue de dessous","自下方观察","下からの眺め","منظر من الأسفل"],
        ["{w} × {h} pixel","{w} × {h} pixels","{w} × {h} Pixel","{w} × {h} pixels","{w} × {h} 像素","{w} × {h} ピクセル","{w} × {h} بكسل"],
        ["{mm} mm/pixel — sul foglio {w} × {h} cm","{mm} mm/pixel — on paper {w} × {h} cm","{mm} mm/Pixel — auf dem Blatt {w} × {h} cm","{mm} mm/pixel — sur la feuille {w} × {h} cm","{mm} 毫米/像素 — 纸面 {w} × {h} 厘米","{mm} mm/ピクセル — 用紙上 {w} × {h} cm","{mm} مم/بكسل — على الورقة {w} × {h} سم"],
        ["troppo grande (max {n} megapixel)","too large (max {n} megapixels)","zu groß (max. {n} Megapixel)","trop grande (max {n} mégapixels)","过大（最多 {n} 百万像素）","大きすぎます（最大 {n} メガピクセル）","كبيرة جدًا (الحد الأقصى {n} ميغابكسل)"],
        ["✂ Chiudi anteprima della fetta","✂ Close slice preview","✂ Schnittvorschau schließen","✂ Fermer l'aperçu de la tranche","✂ 关闭切片预览","✂ スライスのプレビューを閉じる","✂ إغلاق معاينة الشريحة"],
        ["✂ Anteprima della fetta","✂ Slice preview","✂ Schnittvorschau","✂ Aperçu de la tranche","✂ 切片预览","✂ スライスのプレビュー","✂ معاينة الشريحة"],
        ["Inserisci la risoluzione (cm per pixel) oppure scala e DPI.","Enter the resolution (cm per pixel) or the scale and DPI.","Geben Sie die Auflösung (cm pro Pixel) oder Maßstab und DPI ein.","Saisissez la résolution (cm par pixel) ou l'échelle et les DPI.","请输入分辨率（厘米/像素），或输入比例和 DPI。","解像度（cm/ピクセル）、またはスケールとDPIを入力してください。","أدخل الدقة (سم لكل بكسل) أو المقياس وDPI."],
        ["Salva la trasformazione prima di generare l'ortofoto.","Save the transformation before generating the orthophoto.","Speichern Sie die Transformation, bevor Sie das Orthofoto erzeugen.","Enregistrez la transformation avant de générer l'orthophoto.","生成正射影像前请先保存变换。","オルソ画像を生成する前に変換を保存してください。","احفظ التحويل قبل إنشاء الأورثوفوتو."],
        ["Imposta larghezza e altezza dell'inquadratura.","Set the width and height of the frame.","Legen Sie Breite und Höhe des Bildausschnitts fest.","Définissez la largeur et la hauteur du cadrage.","请设置取景框的宽度和高度。","フレームの幅と高さを設定してください。","حدّد عرض الإطار وارتفاعه."],
        ["Clip end deve essere maggiore di clip start.","Clip end must be greater than clip start.","Clip end muss größer als Clip start sein.","Clip end doit être supérieur à clip start.","Clip end 必须大于 clip start。","Clip end は clip start より大きくなければなりません。","يجب أن تكون قيمة Clip end أكبر من Clip start."],
        ["Ortofoto non avviata: {e}","Orthophoto not started: {e}","Orthofoto nicht gestartet: {e}","Orthophoto non démarrée : {e}","未能开始生成正射影像：{e}","オルソ画像を開始できません：{e}","لم يبدأ إنشاء الأورثوفوتو: {e}"],
        ["Eliminare questa ortofoto ({label}, {w} × {h} pixel)?","Delete this orthophoto ({label}, {w} × {h} pixels)?","Dieses Orthofoto löschen ({label}, {w} × {h} Pixel)?","Supprimer cette orthophoto ({label}, {w} × {h} pixels) ?","是否删除此正射影像（{label}，{w} × {h} 像素）？","このオルソ画像（{label}、{w} × {h} ピクセル）を削除しますか？","هل تريد حذف هذا الأورثوفوتو ({label}، {w} × {h} بكسل)؟"],
        ["Eliminazione non riuscita: {e}","Deletion failed: {e}","Löschen fehlgeschlagen: {e}","Échec de la suppression : {e}","删除失败：{e}","削除に失敗しました：{e}","فشل الحذف: {e}"],
        ["PNG — sfondo trasparente","PNG — transparent background","PNG — transparenter Hintergrund","PNG — fond transparent","PNG — 透明背景","PNG — 背景透過","PNG — خلفية شفافة"],
        ["JPEG — sfondo bianco, file piccolo","JPEG — white background, small file","JPEG — weißer Hintergrund, kleine Datei","JPEG — fond blanc, petit fichier","JPEG — 白色背景，文件较小","JPEG — 白背景、小さいファイル","JPEG — خلفية بيضاء، ملف صغير"],
        ["TIFF — con coordinate in metri (GIS, CAD)","TIFF — with coordinates in metres (GIS, CAD)","TIFF — mit Koordinaten in Metern (GIS, CAD)","TIFF — avec coordonnées en mètres (SIG, CAO)","TIFF — 带米制坐标（GIS、CAD）","TIFF — メートル座標付き（GIS、CAD）","TIFF — بإحداثيات بالأمتار (GIS، CAD)"],
        ["PDF — in scala, pronto per la stampa","PDF — to scale, ready to print","PDF — maßstäblich, druckfertig","PDF — à l'échelle, prêt à imprimer","PDF — 按比例，可直接打印","PDF — 縮尺付き、印刷可能","PDF — بمقياس رسم، جاهز للطباعة"],
        ["Punti di controllo per QGIS (.points)","Control points for QGIS (.points)","Passpunkte für QGIS (.points)","Points de contrôle pour QGIS (.points)","QGIS 控制点（.points）","QGIS用コントロールポイント（.points）","نقاط التحكم لـ QGIS (‎.points)"],
        ["Camera {rot}","Camera {rot}","Kamera {rot}","Caméra {rot}","相机 {rot}","カメラ {rot}","الكاميرا {rot}"],
        ["ore {t}","at {t}","um {t}","à {t}","今天 {t}","今日 {t}","الساعة {t}"],
        ["Nuvola","Cloud","Punktwolke","Nuage","点云","点群","السحابة"],
        ["Mesh","Mesh","Mesh","Maillage","网格","メッシュ","الشبكة"],
        ["scala 1:{n} a {dpi} dpi","scale 1:{n} at {dpi} dpi","Maßstab 1:{n} bei {dpi} dpi","échelle 1:{n} à {dpi} dpi","比例 1:{n}，{dpi} dpi","縮尺 1:{n}、{dpi} dpi","مقياس 1:{n} عند {dpi} dpi"],
        ["sezione","section","Schnitt","coupe","剖面","断面","مقطع"],
        ["con punti QGIS","with QGIS points","mit QGIS-Punkten","avec points QGIS","含 QGIS 控制点","QGISポイント付き","مع نقاط QGIS"],
        ["Formato non disponibile per questo scatto.","Format not available for this shot.","Format für diese Aufnahme nicht verfügbar.","Format non disponible pour cette prise de vue.","此次拍摄没有该格式。","このショットでは使用できない形式です。","التنسيق غير متاح لهذه اللقطة."],
        ["Salvataggio in corso...","Saving...","Wird gespeichert...","Enregistrement en cours...","正在保存……","保存中...","جارٍ الحفظ..."],
        ["Salvataggio non riuscito: {e}","Save failed: {e}","Speichern fehlgeschlagen: {e}","Échec de l'enregistrement : {e}","保存失败：{e}","保存に失敗しました：{e}","فشل الحفظ: {e}"],
        ["Scegli la cartella nella finestra \"Salva con nome\" (se non compare, il file e' nella cartella Download).","Choose the folder in the \"Save as\" window (if it does not appear, the file is in the Downloads folder).","Wählen Sie den Ordner im Fenster „Speichern unter“ (erscheint es nicht, liegt die Datei im Ordner „Downloads“).","Choisissez le dossier dans la fenêtre « Enregistrer sous » (si elle n'apparaît pas, le fichier est dans le dossier Téléchargements).","请在“另存为”窗口中选择文件夹（如果没有出现该窗口，文件位于“下载”文件夹中）。","「名前を付けて保存」ウィンドウでフォルダを選んでください（表示されない場合、ファイルは「ダウンロード」フォルダにあります）。","اختر المجلد في نافذة «حفظ باسم» (إذا لم تظهر فالملف موجود في مجلد التنزيلات)."],
        ["Immagine molto grande: qui vedi l'anteprima ridotta, il file salvato e' a piena risoluzione.","Very large image: you are seeing a reduced preview here; the saved file is at full resolution.","Sehr großes Bild: Hier sehen Sie eine verkleinerte Vorschau, die gespeicherte Datei hat volle Auflösung.","Image très grande : vous voyez ici un aperçu réduit, le fichier enregistré est en pleine résolution.","图像很大：此处显示的是缩小的预览，保存的文件为完整分辨率。","画像が非常に大きいため、ここでは縮小プレビューを表示しています。保存されるファイルは元の解像度です。","الصورة كبيرة جدًا: ما تراه هنا معاينة مصغّرة، أما الملف المحفوظ فبالدقة الكاملة."],
        ["Formato del file","File format","Dateiformat","Format du fichier","文件格式","ファイル形式","تنسيق الملف"],
        ["Riduci (rotella del mouse)","Zoom out (mouse wheel)","Verkleinern (Mausrad)","Réduire (molette de la souris)","缩小（鼠标滚轮）","縮小（マウスホイール）","تصغير (عجلة الفأرة)"],
        ["Ingrandisci (rotella del mouse)","Zoom in (mouse wheel)","Vergrößern (Mausrad)","Agrandir (molette de la souris)","放大（鼠标滚轮）","拡大（マウスホイール）","تكبير (عجلة الفأرة)"],
        ["Adatta","Fit","Anpassen","Ajuster","适应窗口","全体表示","ملاءمة"],
        ["Tutta l'immagine nella finestra (doppio clic)","The whole image in the window (double-click)","Das ganze Bild im Fenster (Doppelklick)","Toute l'image dans la fenêtre (double-clic)","将整幅图像适应窗口（双击）","画像全体をウィンドウに収める（ダブルクリック）","الصورة كاملة داخل النافذة (نقر مزدوج)"],
        ["Dimensione reale: un pixel dell'immagine = un pixel dello schermo","Actual size: one image pixel = one screen pixel","Originalgröße: ein Bildpixel = ein Bildschirmpixel","Taille réelle : un pixel de l'image = un pixel de l'écran","实际大小：图像的一个像素 = 屏幕的一个像素","実寸表示：画像の1ピクセル = 画面の1ピクセル","الحجم الفعلي: بكسل واحد من الصورة = بكسل واحد من الشاشة"],
        ["Max","Max","Max","Max","最大","最大","الأقصى"],
        ["Ingrandimento massimo","Maximum zoom","Maximale Vergrößerung","Agrandissement maximal","最大放大","最大拡大","أقصى تكبير"],
        ["💾 SALVA…","💾 SAVE…","💾 SPEICHERN…","💾 ENREGISTRER…","💾 保存……","💾 保存…","💾 حفظ…"],
        ["Scegli cartella e nome del file","Choose folder and file name","Ordner und Dateinamen wählen","Choisir le dossier et le nom du fichier","选择文件夹和文件名","フォルダとファイル名を選択","اختر المجلد واسم الملف"],
        ["✕ Chiudi","✕ Close","✕ Schließen","✕ Fermer","✕ 关闭","✕ 閉じる","✕ إغلاق"],
        ["Chiudi (Esc)","Close (Esc)","Schließen (Esc)","Fermer (Échap)","关闭 (Esc)","閉じる (Esc)","إغلاق (Esc)"],
        ["trascina per spostare, rotella per lo zoom, doppio clic per adattare","drag to pan, wheel to zoom, double-click to fit","ziehen zum Verschieben, Mausrad zum Zoomen, Doppelklick zum Anpassen","glissez pour déplacer, molette pour zoomer, double-clic pour ajuster","拖动平移，滚轮缩放，双击适应窗口","ドラッグで移動、ホイールでズーム、ダブルクリックで全体表示","اسحب للتحريك، والعجلة للتكبير، ونقرتان للملاءمة"],
        ["Nella Mappa 2D di WebODM comparira' questa pianta al posto dell'ortofoto attuale ({size}).","This plan will appear in WebODM's 2D Map in place of the current orthophoto ({size}).","In der 2D-Karte von WebODM erscheint dieser Grundriss anstelle des aktuellen Orthofotos ({size}).","Dans la carte 2D de WebODM, ce plan remplacera l'orthophoto actuelle ({size}).","WebODM 的 2D 地图中将显示此平面图，取代当前的正射影像（{size}）。","WebODMの2Dマップには、現在のオルソ画像（{size}）の代わりにこの平面図が表示されます。","ستظهر هذه الخريطة الأفقية في الخريطة ثنائية الأبعاد في WebODM بدلًا من الأورثوفوتو الحالي ({size})."],
        ["• E' georiferita in EPSG:{epsg}: la posizione sul globo e le distanze sono quelle vere.","• It is georeferenced in EPSG:{epsg}: the position on the globe and the distances are the true ones.","• Es ist in EPSG:{epsg} georeferenziert: Position auf dem Globus und Entfernungen sind real.","• Il est géoréférencé en EPSG:{epsg} : la position sur le globe et les distances sont réelles.","• 已按 EPSG:{epsg} 进行地理配准：全球位置和距离均为真实值。","• EPSG:{epsg} で地理参照済みです。地球上の位置も距離も実際のものです。","• مُرجَّعة جغرافيًا بنظام EPSG:{epsg}: الموقع على الكرة الأرضية والمسافات حقيقية."],
        ["• L'ortofoto originale NON viene cancellata: puoi rimetterla con \"Ripristina ortofoto originale\".","• The original orthophoto is NOT deleted: you can put it back with \"Restore original orthophoto\".","• Das Original-Orthofoto wird NICHT gelöscht: Sie können es mit „Original-Orthofoto wiederherstellen“ zurückholen.","• L'orthophoto d'origine n'est PAS supprimée : vous pouvez la remettre avec « Rétablir l'orthophoto d'origine ».","• 原始正射影像不会被删除：可通过“恢复原始正射影像”还原。","• 元のオルソ画像は削除されません。「元のオルソ画像に戻す」で戻せます。","• لن يُحذف الأورثوفوتو الأصلي: يمكنك إعادته بواسطة «استعادة الأورثوفوتو الأصلي»."],
        ["Vuoi procedere?","Do you want to proceed?","Möchten Sie fortfahren?","Voulez-vous continuer ?","是否继续？","続行しますか？","هل تريد المتابعة؟"],
        ["ATTENZIONE: stai per sostituire l'ortofoto di questo task.","WARNING: you are about to replace this task's orthophoto.","ACHTUNG: Sie sind dabei, das Orthofoto dieses Tasks zu ersetzen.","ATTENTION : vous allez remplacer l'orthophoto de cette tâche.","注意：您即将替换此任务的正射影像。","注意：このタスクのオルソ画像を置き換えようとしています。","تنبيه: أنت على وشك استبدال الأورثوفوتو الخاص بهذه المهمة."],
        ["Nella Mappa 2D di WebODM comparira' questa pianta ({size}) al posto dell'ortofoto attuale.","This plan ({size}) will appear in WebODM's 2D Map in place of the current orthophoto.","In der 2D-Karte von WebODM erscheint dieser Grundriss ({size}) anstelle des aktuellen Orthofotos.","Dans la carte 2D de WebODM, ce plan ({size}) remplacera l'orthophoto actuelle.","WebODM 的 2D 地图中将显示此平面图（{size}），取代当前的正射影像。","WebODMの2Dマップには、現在のオルソ画像の代わりにこの平面図（{size}）が表示されます。","ستظهر هذه الخريطة الأفقية ({size}) في الخريطة ثنائية الأبعاد في WebODM بدلًا من الأورثوفوتو الحالي."],
        ["• L'ortofoto originale NON viene cancellata: ne resta una copia e puoi rimetterla quando vuoi con \"Ripristina ortofoto originale\".","• The original orthophoto is NOT deleted: a copy is kept and you can put it back whenever you like with \"Restore original orthophoto\".","• Das Original-Orthofoto wird NICHT gelöscht: Eine Kopie bleibt erhalten, und Sie können es jederzeit mit „Original-Orthofoto wiederherstellen“ zurückholen.","• L'orthophoto d'origine n'est PAS supprimée : une copie est conservée et vous pouvez la remettre quand vous voulez avec « Rétablir l'orthophoto d'origine ».","• 原始正射影像不会被删除：会保留一份副本，您随时可通过“恢复原始正射影像”还原。","• 元のオルソ画像は削除されず、コピーが残ります。「元のオルソ画像に戻す」でいつでも戻せます。","• لن يُحذف الأورثوفوتو الأصلي: تبقى نسخة منه ويمكنك إعادته متى شئت بواسطة «استعادة الأورثوفوتو الأصلي»."],
        ["• La posizione sul globo e' fittizia, perche' il modello non e' georeferenziato; le distanze misurate sulla Mappa saranno pero' in metri reali.","• The position on the globe is fictitious because the model is not georeferenced; however, distances measured on the Map will be in real metres.","• Die Position auf dem Globus ist fiktiv, da das Modell nicht georeferenziert ist; auf der Karte gemessene Entfernungen sind jedoch echte Meter.","• La position sur le globe est fictive, car le modèle n'est pas géoréférencé ; les distances mesurées sur la carte seront toutefois en mètres réels.","• 由于模型未进行地理配准，其全球位置是虚构的；但在地图上测得的距离是真实的米数。","• モデルが地理参照されていないため、地球上の位置は仮のものです。ただし、マップ上で測った距離は実際のメートルになります。","• الموقع على الكرة الأرضية وهمي لأن النموذج غير مُرجَّع جغرافيًا؛ لكن المسافات المقاسة على الخريطة ستكون بالأمتار الحقيقية."],
        ["• Gli scatti della camera restano esportazioni separate e non vengono toccati.","• The camera shots remain separate exports and are not touched.","• Die Kameraaufnahmen bleiben separate Exporte und werden nicht verändert.","• Les prises de vue de la caméra restent des exports distincts et ne sont pas modifiées.","• 相机拍摄的结果仍是独立的导出文件，不会被改动。","• カメラのショットは別のエクスポートのままで、変更されません。","• تبقى لقطات الكاميرا ملفات تصدير منفصلة ولا يتم المساس بها."],
        ["Pubblicazione sulla Mappa in corso...","Publishing to the Map...","Veröffentlichung auf der Karte läuft...","Publication sur la carte en cours...","正在发布到地图……","マップに公開しています...","جارٍ النشر على الخريطة..."],
        ["Fatto: la Mappa 2D ora mostra questa pianta.","Done: the 2D Map now shows this plan.","Fertig: Die 2D-Karte zeigt jetzt diesen Grundriss.","Terminé : la carte 2D affiche maintenant ce plan.","完成：2D 地图现在显示此平面图。","完了：2Dマップにこの平面図が表示されるようになりました。","تم: تعرض الخريطة ثنائية الأبعاد الآن هذه الخريطة الأفقية."],
        ["Pubblicazione non riuscita: {e}","Publishing failed: {e}","Veröffentlichung fehlgeschlagen: {e}","Échec de la publication : {e}","发布失败：{e}","公開に失敗しました：{e}","فشل النشر: {e}"],
        ["Rimettere nella Mappa 2D l'ortofoto originale del task?","Put the task's original orthophoto back in the 2D Map?","Das ursprüngliche Orthofoto des Tasks wieder in der 2D-Karte anzeigen?","Remettre l'orthophoto d'origine de la tâche dans la carte 2D ?","是否将任务的原始正射影像恢复到 2D 地图？","タスクの元のオルソ画像を2Dマップに戻しますか？","هل تريد إعادة الأورثوفوتو الأصلي للمهمة إلى الخريطة ثنائية الأبعاد؟"],
        ["Ortofoto originale ripristinata.","Original orthophoto restored.","Original-Orthofoto wiederhergestellt.","Orthophoto d'origine rétablie.","已恢复原始正射影像。","元のオルソ画像に戻しました。","تمت استعادة الأورثوفوتو الأصلي."],
        ["Ripristino non riuscito: {e}","Restore failed: {e}","Wiederherstellung fehlgeschlagen: {e}","Échec du rétablissement : {e}","恢复失败：{e}","復元に失敗しました：{e}","فشلت الاستعادة: {e}"],
        ["Funzione non attiva","Feature not active","Funktion nicht aktiv","Fonction inactive","功能未启用","機能が有効ではありません","الميزة غير مفعّلة"],
        ["il plugin e' stato aggiornato: riavvia WebODM per attivare questa funzione.","the plugin has been updated: restart WebODM to enable this feature.","das Plugin wurde aktualisiert: Starten Sie WebODM neu, um diese Funktion zu aktivieren.","le plugin a été mis à jour : redémarrez WebODM pour activer cette fonction.","插件已更新：请重启 WebODM 以启用此功能。","プラグインが更新されました。この機能を有効にするにはWebODMを再起動してください。","تم تحديث الإضافة: أعد تشغيل WebODM لتفعيل هذه الميزة."],
        ["u.m. (non scalate)","m.u. (unscaled)","Modelleinh. (unskaliert)","u.m. (non mises à l'échelle)","模型单位（未缩放）","モデル単位（未スケール）","وحدة نموذج (غير مقيّسة)"],
        ["u.m.","m.u.","ME","u.m.","模型单位","モデル単位","وحدة نموذج"],
        ["1 u.m. = {s} m","1 m.u. = {s} m","1 ME = {s} m","1 u.m. = {s} m","1 个模型单位 = {s} 米","モデル1単位 = {s} m","وحدة نموذج واحدة = {s} م"],
        ["Distanza 3D: {v}","3D distance: {v}","3D-Distanz: {v}","Distance 3D : {v}","三维距离：{v}","3D距離：{v}","المسافة ثلاثية الأبعاد: {v}"],
        ["Orizzontale (XY): {v}","Horizontal (XY): {v}","Horizontal (XY): {v}","Horizontale (XY) : {v}","水平 (XY)：{v}","水平 (XY)：{v}","الأفقية (XY): {v}"],
        ["Verticale (ΔZ): {v}","Vertical (ΔZ): {v}","Vertikal (ΔZ): {v}","Verticale (ΔZ) : {v}","垂直 (ΔZ)：{v}","鉛直 (ΔZ)：{v}","الرأسية (ΔZ): {v}"],
        ["Distanza reale tra A e B (metri):","Real distance between A and B (metres):","Reale Distanz zwischen A und B (Meter):","Distance réelle entre A et B (mètres) :","A 与 B 之间的实际距离（米）：","AB間の実際の距離（メートル）：","المسافة الحقيقية بين A وB (بالأمتار):"],
        ["Imposta come scala","Set as scale","Als Maßstab setzen","Définir comme échelle","设为比例","スケールに設定","تعيين كمقياس"],
        ["Scala: {v}","Scale: {v}","Maßstab: {v}","Échelle : {v}","比例：{v}","スケール：{v}","المقياس: {v}"],
        ["non impostata","not set","nicht gesetzt","non définie","未设置","未設定","غير مضبوط"],
        ["Asse Z: {v}","Z axis: {v}","Z-Achse: {v}","Axe Z : {v}","Z 轴：{v}","Z軸：{v}","المحور Z: {v}"],
        ["definito","defined","definiert","défini","已定义","定義済み","محدَّد"],
        ["originale","original","original","d'origine","原始","元のまま","الأصلي"],
        ["Asse X: {v}","X axis: {v}","X-Achse: {v}","Axe X : {v}","X 轴：{v}","X軸：{v}","المحور X: {v}"],
        ["Origine: {v}","Origin: {v}","Ursprung: {v}","Origine : {v}","原点：{v}","原点：{v}","نقطة الأصل: {v}"],
        ["definita","defined","definiert","définie","已定义","定義済み","محدَّدة"],
        ["Mesh: segue la nuvola ✔","Mesh: follows the cloud ✔","Mesh: folgt der Punktwolke ✔","Maillage : suit le nuage ✔","网格：跟随点云 ✔","メッシュ：点群に追従 ✔","الشبكة: تتبع السحابة ✔"],
        ["Salvato ✔","Saved ✔","Gespeichert ✔","Enregistré ✔","已保存 ✔","保存済み ✔","تم الحفظ ✔"],
        ["Non salvato","Not saved","Nicht gespeichert","Non enregistré","未保存","未保存","غير محفوظ"],
        ["Export: {m}","Export: {m}","Export: {m}","Export : {m}","导出：{m}","エクスポート：{m}","التصدير: {m}"],
        ["1. Distanza e scala","1. Distance and scale","1. Distanz und Maßstab","1. Distance et échelle","1. 距离与比例","1. 距離とスケール","1. المسافة والمقياس"],
        ["2. Asse Z (verticale)","2. Z axis (vertical)","2. Z-Achse (vertikal)","2. Axe Z (vertical)","2. Z 轴（垂直）","2. Z軸（鉛直）","2. المحور Z (الرأسي)"],
        ["Calcola dal piano ({n} punti)","Compute from plane ({n} points)","Aus Ebene berechnen ({n} Punkte)","Calculer à partir du plan ({n} points)","由平面计算（{n} 个点）","平面から計算（{n} 点）","احسب من المستوى ({n} نقاط)"],
        ["⇅ Inverti Z","⇅ Flip Z","⇅ Z umkehren","⇅ Inverser Z","⇅ 反转 Z","⇅ Z を反転","⇅ عكس Z"],
        ["3. Piano XY e origine","3. XY plane and origin","3. XY-Ebene und Ursprung","3. Plan XY et origine","3. XY 平面与原点","3. XY平面と原点","3. المستوى XY ونقطة الأصل"],
        ["↔ X parallelo alla vista (destra)","↔ X parallel to the view (right)","↔ X parallel zur Ansicht (rechts)","↔ X parallèle à la vue (droite)","↔ X 与视图平行（向右）","↔ Xをビューと平行に（右）","↔ X موازٍ للعرض (يمين)"],
        ["◉ X verso di me","◉ X towards me","◉ X zu mir","◉ X vers moi","◉ X 朝向我","◉ Xを手前に","◉ X نحوي"],
        ["⇄ Inverti X","⇄ Flip X","⇄ X umkehren","⇄ Inverser X","⇄ 反转 X","⇄ X を反転","⇄ عكس X"],
        ["💾 Salva nel task","💾 Save to task","💾 Im Task speichern","💾 Enregistrer dans la tâche","💾 保存到任务","💾 タスクに保存","💾 حفظ في المهمة"],
        ["⇩ Esporta (LAZ, OBJ, matrice)","⇩ Export (LAZ, OBJ, matrix)","⇩ Exportieren (LAZ, OBJ, Matrix)","⇩ Exporter (LAZ, OBJ, matrice)","⇩ 导出（LAZ、OBJ、矩阵）","⇩ エクスポート（LAZ、OBJ、行列）","⇩ تصدير (LAZ، OBJ، مصفوفة)"],
        ["⌖ Inquadra modello","⌖ Frame model","⌖ Modell einpassen","⌖ Cadrer le modèle","⌖ 适应模型视图","⌖ モデルを画面に合わせる","⌖ ملاءمة النموذج"],
        ["↺ Ripristina originale","↺ Restore original","↺ Original wiederherstellen","↺ Rétablir l'original","↺ 恢复原始模型","↺ 元に戻す","↺ استعادة الأصل"],
        ["Sola lettura: serve il permesso di modifica del progetto per salvare/esportare.","Read-only: project edit permission is needed to save/export.","Schreibgeschützt: Zum Speichern/Exportieren ist die Bearbeitungsberechtigung für das Projekt nötig.","Lecture seule : l'autorisation de modification du projet est nécessaire pour enregistrer/exporter.","只读：保存/导出需要项目的编辑权限。","読み取り専用：保存・エクスポートにはプロジェクトの編集権限が必要です。","للقراءة فقط: يلزم إذن تعديل المشروع للحفظ/التصدير."],
        ["5. Ortofoto dalla mesh","5. Orthophoto from the mesh","5. Orthofoto aus dem Mesh","5. Orthophoto à partir du maillage","5. 由网格生成正射影像","5. メッシュからオルソ画像","5. أورثوفوتو من الشبكة"],
        ["Scala del modello non impostata: metri e scale di stampa non sono reali.","Model scale not set: metres and print scales are not real.","Maßstab des Modells nicht gesetzt: Meter und Druckmaßstäbe sind nicht real.","Échelle du modèle non définie : les mètres et les échelles d'impression ne sont pas réels.","未设置模型比例：米制尺寸和打印比例并不真实。","モデルのスケールが未設定です。メートルや印刷縮尺は実寸ではありません。","لم يُضبط مقياس النموذج: الأمتار ومقاييس الطباعة ليست حقيقية."],
        ["▣ Scatta l'ortofoto","▣ Take the orthophoto","▣ Orthofoto aufnehmen","▣ Prendre l'orthophoto","▣ 拍摄正射影像","▣ オルソ画像を撮影","▣ التقاط الأورثوفوتو"],
        ["Serve una trasformazione salvata (\"Salva nel task\").","A saved transformation is required (\"Save to task\").","Eine gespeicherte Transformation ist erforderlich („Im Task speichern“).","Une transformation enregistrée est nécessaire (« Enregistrer dans la tâche »).","需要先保存变换（“保存到任务”）。","保存済みの変換が必要です（「タスクに保存」）。","يلزم وجود تحويل محفوظ («حفظ في المهمة»)."],
        ["La Mappa 2D mostra una pianta generata qui","The 2D Map shows a plan generated here","Die 2D-Karte zeigt einen hier erzeugten Grundriss","La carte 2D affiche un plan généré ici","2D 地图显示的是在此生成的平面图","2Dマップにはここで生成した平面図が表示されています","تعرض الخريطة ثنائية الأبعاد خريطة أفقية أُنشئت هنا"],
        ["Apri la Mappa 2D","Open the 2D Map","2D-Karte öffnen","Ouvrir la carte 2D","打开 2D 地图","2Dマップを開く","فتح الخريطة ثنائية الأبعاد"],
        ["↺ Ripristina ortofoto originale","↺ Restore original orthophoto","↺ Original-Orthofoto wiederherstellen","↺ Rétablir l'orthophoto d'origine","↺ 恢复原始正射影像","↺ 元のオルソ画像に戻す","↺ استعادة الأورثوفوتو الأصلي"],
        ["SCATTI FATTI ({n}) — clic su una riga per aprirla","SHOTS TAKEN ({n}) — click a row to open it","AUFNAHMEN ({n}) — Zeile anklicken zum Öffnen","PRISES DE VUE ({n}) — cliquez sur une ligne pour l'ouvrir","已拍摄 ({n}) — 点击某一行展开","撮影済み ({n}) — 行をクリックして開く","اللقطات ({n}) — انقر على صف لفتحه"],
        ["Richiudi","Collapse","Einklappen","Replier","收起","閉じる","طيّ"],
        ["Apri","Expand","Aufklappen","Déplier","展开","開く","فتح"],
        ["Questa e' l'ortofoto mostrata nella Mappa 2D","This is the orthophoto shown in the 2D Map","Dies ist das in der 2D-Karte angezeigte Orthofoto","C'est l'orthophoto affichée dans la carte 2D","这是 2D 地图中显示的正射影像","これは2Dマップに表示されているオルソ画像です","هذا هو الأورثوفوتو المعروض في الخريطة ثنائية الأبعاد"],
        ["Apri a tutto schermo","Open full screen","Im Vollbild öffnen","Ouvrir en plein écran","全屏打开","全画面で開く","فتح بملء الشاشة"],
        ["💾 Apri a tutto schermo e salva…","💾 Open full screen and save…","💾 Im Vollbild öffnen und speichern…","💾 Ouvrir en plein écran et enregistrer…","💾 全屏打开并保存…","💾 全画面で開いて保存…","💾 فتح بملء الشاشة وحفظ…"],
        ["Scarica direttamente un formato","Download a format directly","Ein Format direkt herunterladen","Télécharger directement un format","直接下载某种格式","形式を指定して直接ダウンロード","نزّل تنسيقًا مباشرةً"],
        ["🗺 Mostra nella Mappa 2D (sostituisce l'ortofoto)","🗺 Show in the 2D Map (replaces the orthophoto)","🗺 In der 2D-Karte anzeigen (ersetzt das Orthofoto)","🗺 Afficher dans la carte 2D (remplace l'orthophoto)","🗺 在 2D 地图中显示（替换正射影像）","🗺 2Dマップに表示（オルソ画像を置き換え）","🗺 عرض في الخريطة ثنائية الأبعاد (يستبدل الأورثوفوتو)"],
        ["Elimina questo scatto","Delete this shot","Diese Aufnahme löschen","Supprimer cette prise de vue","删除此次拍摄","このショットを削除","حذف هذه اللقطة"],
        ["es. 2.50","e.g. 2.50","z. B. 2.50","ex. 2.50","例如 2.50","例：2.50","مثال: 2.50"],
        ["Lingua del sistema","System language","Systemsprache","Langue du système","系统语言","システムの言語","لغة النظام"],
        ["Lingua","Language","Sprache","Langue","语言","言語","اللغة"],
        ["Scala & Orientamento","Scale & Orientation","Maßstab & Ausrichtung","Échelle & orientation","比例与方向","スケールと向き","المقياس والاتجاه"],
        ["Mostra nella scena solo quello che sta tra clip start e clip end e dentro il riquadro: la parte che comparirà nella foto, vista dalla camera","Show in the scene only what lies between clip start and clip end and inside the frame: the part that will appear in the photo, seen from the camera","Zeigt in der Szene nur, was zwischen Clip start und Clip end und innerhalb des Rahmens liegt: den Teil, der im Foto erscheint, aus Sicht der Kamera","N'affiche dans la scène que ce qui se trouve entre clip start et clip end et à l'intérieur du cadre : la partie qui apparaîtra sur la photo, vue depuis la caméra","场景中仅显示位于 clip start 与 clip end 之间且在取景框内的内容，即照片中将出现的部分（从相机视角）","シーンには clip start と clip end の間で、かつフレーム内にあるものだけを表示します。カメラから見た、写真に写る部分です","يعرض في المشهد فقط ما يقع بين clip start وclip end وداخل الإطار: الجزء الذي سيظهر في الصورة كما تراه الكاميرا"],
        ["Mesh 3D texturizzata","Textured 3D mesh","Texturiertes 3D-Mesh","Maillage 3D texturé","带纹理的 3D 网格","テクスチャ付き3Dメッシュ","شبكة ثلاثية الأبعاد مكسوّة بالنسيج"],
        ["Nuvola di punti","Point cloud","Punktwolke","Nuage de points","点云","点群","سحابة النقاط"],
        ["automatica","automatic","automatisch","automatique","自动","自動","تلقائي"],
        ["{n} pixel","{n} pixels","{n} Pixel","{n} pixels","{n} 像素","{n} ピクセル","{n} بكسل"],
        ["Dimensione dei punti:","Point size:","Punktgröße:","Taille des points :","点大小：","点のサイズ：","حجم النقاط:"],
        ["Disegna sull'immagine una barra di scala e un rettangolo con 4 punti a coordinate note, e aggiunge il file .points da caricare nel georeferenziatore di QGIS","Draws a scale bar and a rectangle with 4 points at known coordinates on the image, and adds the .points file to load into the QGIS georeferencer","Zeichnet einen Maßstabsbalken und ein Rechteck mit 4 Punkten bekannter Koordinaten ins Bild und fügt die .points-Datei zum Laden im QGIS-Georeferenzierer hinzu","Dessine sur l'image une barre d'échelle et un rectangle dont 4 points ont des coordonnées connues, et ajoute le fichier .points à charger dans le géoréférenceur de QGIS","在图像上绘制比例尺和一个具有 4 个已知坐标点的矩形，并附带可导入 QGIS 地理配准工具的 .points 文件","画像にスケールバーと、座標が既知の4点を持つ長方形を描画し、QGISのジオリファレンサーに読み込める .points ファイルを追加します","يرسم على الصورة شريط مقياس ومستطيلًا بأربع نقاط ذات إحداثيات معروفة، ويضيف ملف ‎.points لتحميله في أداة الإسناد الجغرافي في QGIS"],
        ["Risoluzione in cm per pixel","Resolution in cm per pixel","Auflösung in cm pro Pixel","Résolution en cm par pixel","分辨率（厘米/像素）","解像度（cm/ピクセル）","الدقة بالسنتيمتر لكل بكسل"],
        ["Disegno in scala 1:N (per la stampa)","Drawing at scale 1:N (for printing)","Zeichnung im Maßstab 1:N (zum Drucken)","Dessin à l'échelle 1:N (pour l'impression)","按 1:N 比例绘图（用于打印）","縮尺 1:N の図面（印刷用）","رسم بمقياس 1:N (للطباعة)"],
        ["Scala 1 :","Scale 1 :","Maßstab 1 :","Échelle 1 :","比例 1 :","縮尺 1 :","المقياس 1 :"],
        ["a","at","bei","à","于","解像度","عند"],
        ["Cosa fotografare:","What to photograph:","Was aufgenommen werden soll:","Que photographier :","拍摄对象：","撮影対象：","ما الذي سيتم تصويره:"],
        ["Camera ortografica (come in Blender). Vista:","Orthographic camera (as in Blender). View:","Orthografische Kamera (wie in Blender). Ansicht:","Caméra orthographique (comme dans Blender). Vue :","正交相机（与 Blender 相同）。视图：","正投影カメラ（Blenderと同様）。ビュー：","كاميرا متعامدة (كما في Blender). العرض:"],
        ["Posizione (m) — centro dell'inquadratura:","Position (m) — centre of the frame:","Position (m) — Mitte des Bildausschnitts:","Position (m) — centre du cadrage :","位置（米）— 取景框中心：","位置 (m) — フレームの中心：","الموضع (م) — مركز الإطار:"],
        ["Rotazione (gradi, Eulero XYZ):","Rotation (degrees, Euler XYZ):","Rotation (Grad, Euler XYZ):","Rotation (degrés, Euler XYZ) :","旋转（度，欧拉 XYZ）：","回転（度、オイラー XYZ）：","الدوران (بالدرجات، أويلر XYZ):"],
        ["Inquadratura (m):","Frame (m):","Bildausschnitt (m):","Cadrage (m) :","取景框（米）：","フレーム (m)：","الإطار (م):"],
        ["⛶ Adatta l'inquadratura al modello","⛶ Fit the frame to the model","⛶ Bildausschnitt an Modell anpassen","⛶ Ajuster le cadrage au modèle","⛶ 使取景框适应模型","⛶ フレームをモデルに合わせる","⛶ ملاءمة الإطار مع النموذج"],
        ["⌖ Metti la camera dove sto guardando","⌖ Put the camera where I am looking","⌖ Kamera dorthin setzen, wohin ich schaue","⌖ Placer la caméra là où je regarde","⌖ 将相机放到我正在看的位置","⌖ 今見ている位置にカメラを置く","⌖ ضع الكاميرا حيث أنظر"],
        ["Uscita:","Output:","Ausgabe:","Sortie :","输出：","出力：","المخرجات:"],
        ["verso di te","towards you","zu Ihnen hin","vers vous","朝向您","手前向き","نحوك"],
        ["via da te","away from you","von Ihnen weg","loin de vous","背向您","奥向き","بعيدًا عنك"],
        ["assi: X rosso, Y verde, Z blu","axes: X red, Y green, Z blue","Achsen: X rot, Y grün, Z blau","axes : X rouge, Y vert, Z bleu","坐标轴：X 红，Y 绿，Z 蓝","軸：X 赤、Y 緑、Z 青","المحاور: X أحمر، Y أخضر، Z أزرق"],
        ["Trasformazione salvata caricata.","Saved transformation loaded.","Gespeicherte Transformation geladen.","Transformation enregistrée chargée.","已加载保存的变换。","保存済みの変換を読み込みました。","تم تحميل التحويل المحفوظ."],
        ["Impossibile leggere la trasformazione: {e}","Unable to read the transformation: {e}","Transformation kann nicht gelesen werden: {e}","Impossible de lire la transformation : {e}","无法读取变换：{e}","変換を読み込めません：{e}","تعذّرت قراءة التحويل: {e}"],
        ["Mostra la camera nella scena 3D","Show the camera in the 3D scene","Kamera in der 3D-Szene anzeigen","Afficher la caméra dans la scène 3D","在 3D 场景中显示相机","3Dシーンにカメラを表示","إظهار الكاميرا في المشهد ثلاثي الأبعاد"],
        ["Guarda la scena dalla camera (vista ortografica)","View the scene from the camera (orthographic view)","Szene aus der Kamera betrachten (orthografische Ansicht)","Regarder la scène depuis la caméra (vue orthographique)","从相机观察场景（正交视图）","カメラからシーンを見る（正投影ビュー）","عرض المشهد من الكاميرا (عرض متعامد)"],
        ["Clip start / end (m davanti alla camera):","Clip start / end (m in front of the camera):","Clip start / end (m vor der Kamera):","Clip start / end (m devant la caméra) :","Clip start / end（相机前方，米）：","Clip start / end（カメラの前方、m）：","Clip start / end (م أمام الكاميرا):"],
        ["Scala metrica e punti di georeferenziazione (per QGIS)","Metric scale and georeferencing points (for QGIS)","Metrischer Maßstab und Georeferenzierungspunkte (für QGIS)","Échelle métrique et points de géoréférencement (pour QGIS)","公制比例尺与地理配准点（用于 QGIS）","メートル法スケールと地理参照点（QGIS用）","المقياس المتري ونقاط الإسناد الجغرافي (لـ QGIS)"]
    ];                   // [chiave italiana, traduzione per ogni lingua di CODES...]
    var PATTERNS = [
        ["^Nuvola di punti: (\\d+) / (\\d+)$","Point cloud: {0} / {1}","Punktwolke: {0} / {1}","Nuage de points : {0} / {1}","点云：{0} / {1}","点群：{0} / {1}","سحابة النقاط: {0} / {1}"],
        ["^Nuvola di punti \\(PDAL\\): (\\d+) s$","Point cloud (PDAL): {0} s","Punktwolke (PDAL): {0} s","Nuage de points (PDAL) : {0} s","点云 (PDAL)：{0} 秒","点群 (PDAL)：{0} 秒","سحابة النقاط (PDAL): {0} ث"],
        ["^(.+): (\\d+)%$","{0}: {1}%","{0}: {1}%","{0} : {1} %","{0}：{1}%","{0}：{1}%","{0}: {1}%"],
        ["^(.+) \\((\\d+) s\\)$","{0} ({1} s)","{0} ({1} s)","{0} ({1} s)","{0}（{1} 秒）","{0}（{1} 秒）","{0} ({1} ث)"],
        ["^Errore: (.*)$","Error: {0}","Fehler: {0}","Erreur : {0}","错误：{0}","エラー：{0}","خطأ: {0}"],
        ["^Avvio fallito: (.*)$","Start failed: {0}","Start fehlgeschlagen: {0}","Échec du démarrage : {0}","启动失败：{0}","開始に失敗しました：{0}","فشل البدء: {0}"],
        ["^Non riuscito: (.*)$","Failed: {0}","Fehlgeschlagen: {0}","Échec : {0}","失败：{0}","失敗しました：{0}","لم تنجح العملية: {0}"],
        ["^Ripristino non riuscito: (.*)$","Restore failed: {0}","Wiederherstellung fehlgeschlagen: {0}","Échec du rétablissement : {0}","恢复失败：{0}","復元に失敗しました：{0}","فشلت الاستعادة: {0}"],
        ["^Completato( - .*)?$","Completed{0}","Abgeschlossen{0}","Terminé{0}","已完成{0}","完了{0}","اكتمل{0}"],
        ["^Ortofoto pronta: (\\d+) x (\\d+) pixel, ([\\d.]+) x ([\\d.]+) m( - .*)?$","Orthophoto ready: {0} x {1} pixels, {2} x {3} m{4}","Orthofoto fertig: {0} x {1} Pixel, {2} x {3} m{4}","Orthophoto prête : {0} x {1} pixels, {2} x {3} m{4}","正射影像已完成：{0} x {1} 像素，{2} x {3} 米{4}","オルソ画像が完成：{0} x {1} ピクセル、{2} x {3} m{4}","الأورثوفوتو جاهز: {0} x {1} بكسل، {2} x {3} م{4}"]
    ];           // [espressione regolare, modello per ogni lingua di CODES...]

    var STORE = 'scaling-tool-lang', RTL = {ar: true};
    var dict = {}, pats = [], listeners = [];
    CODES.forEach(function (c) { dict[c] = {}; });
    ROWS.forEach(function (r) {
        CODES.forEach(function (c, i) { if (r[i + 1]) dict[c][r[0]] = r[i + 1]; });
    });
    PATTERNS.forEach(function (r) { pats.push({re: new RegExp(r[0]), tpl: r.slice(1)}); });

    function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
    function fill(s, v) {
        return String(s).replace(/\{(\w+)\}/g, function (a, k) { return v && v[k] != null ? v[k] : a; });
    }
    function supported(code) { return LANGS.some(function (l) { return l[0] === code; }); }

    function stored() {
        try {
            var v = window.localStorage.getItem(STORE);
            return supported(v) ? v : 'auto';
        } catch (e) { return 'auto'; }
    }

    function system() {
        var nav = typeof navigator !== 'undefined' ? navigator : {};
        var list = nav.languages && nav.languages.length ? nav.languages : [nav.language || 'en'];
        for (var i = 0; i < list.length; i++) {
            var code = String(list[i]).toLowerCase().split('-')[0];
            if (supported(code)) return code;
        }
        return 'en';
    }

    var pref = stored(), cur = pref === 'auto' ? system() : pref;

    // Testo dell'interfaccia (chiave italiana) nella lingua corrente
    function t(key, vars) {
        var s = key;
        if (cur !== 'it' && dict[cur] && has(dict[cur], key)) s = dict[cur][key];
        return fill(s, vars);
    }

    // Messaggio arrivato dal server: testo identico oppure uno dei modelli; il resto resta com'e'
    function ts(msg) {
        if (typeof msg !== 'string' || cur === 'it') return msg;
        var d = dict[cur];
        if (d && has(d, msg)) return d[msg];
        var idx = CODES.indexOf(cur);
        for (var i = 0; i < pats.length; i++) {
            var m = pats[i].re.exec(msg), tpl = pats[i].tpl[idx];
            if (!m || !tpl) continue;
            return tpl.replace(/\{(\d+)\}/g, function (a, n) {
                var g = m[Number(n) + 1];
                return g == null ? '' : (g.indexOf(' - ') === 0 ? g : ts(g));
            });
        }
        return msg;
    }

    function setLang(code) {
        if (code !== 'auto' && !supported(code)) return;
        pref = code;
        try {
            if (code === 'auto') window.localStorage.removeItem(STORE); else window.localStorage.setItem(STORE, code);
        } catch (e) { /* senza memoria locale la scelta vale solo per questa pagina */ }
        cur = code === 'auto' ? system() : code;
        listeners.slice().forEach(function (fn) { try { fn(cur); } catch (e) { console.error('[scaling-tool] cambio lingua', e); } });
    }

    window.ScalingToolI18n = {
        langs: LANGS, t: t, ts: ts, setLang: setLang,
        pref: function () { return pref; },                       // 'auto' o il codice scelto
        current: function () { return cur; },                     // lingua in uso
        dir: function () { return RTL[cur] ? 'rtl' : 'ltr'; },
        onChange: function (fn) { listeners.push(fn); },
        dict: dict, patterns: pats                                // per i test
    };
})();
