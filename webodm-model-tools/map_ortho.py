# Scaling & Orientation Tool - plugin per WebODM
# Copyright (C) 2026 Luca Mandolesi
# SPDX-License-Identifier: AGPL-3.0-or-later
# Rilasciato con la stessa licenza di WebODM (GNU AGPL v3): vedi il file LICENSE.
"""Prepara un'ortofoto in pianta per la Mappa 2D di WebODM.

La Mappa mostra solo raster georeferenziati, ma il modello e' in un sistema locale in metri.
Come fa ODM per i progetti senza GPS ("pseudo georeferenziazione"), il raster viene appoggiato
su una zona UTM fittizia vicino all'equatore: la POSIZIONE sul globo non ha significato, ma
essendo UTM in metri le DISTANZE misurate sulla Mappa sono quelle reali del modello.
Se il modello e' stato georiferito (georef.py) l'ortofoto e' gia' nel suo sistema vero e va sulla Mappa cosi' com'e'.
"""
import os

PSEUDO_EPSG = 32630                    # stessa zona usata da ODM (opendm/pseudogeo.py)
FALSE_EASTING = 500000.0               # meridiano centrale: distorsione minima
FALSE_NORTHING = 10000.0               # appena a nord dell'equatore


def make_map_tif(src, dst, meta):
    """Copia `src` (GeoTIFF prodotto da ortho_worker) in `dst` come raster per la Mappa.
    Se l'ortofoto e' georiferita (meta['epsg']) le coordinate sono gia' quelle vere e si usa quel
    sistema; altrimenti si assegna il sistema fittizio. `meta` e' il .json dell'ortofoto."""
    from osgeo import gdal
    gdal.UseExceptions()
    ulx, uly = meta['upper_left_m']
    lrx, lry = meta['lower_right_m']
    if meta.get('epsg'):
        srs, shift = 'EPSG:%d' % meta['epsg'], (0.0, 0.0)
    else:
        srs, shift = 'EPSG:%d' % PSEUDO_EPSG, (FALSE_EASTING, FALSE_NORTHING)
    if os.path.exists(dst):
        os.remove(dst)
    ds = gdal.Translate(
        dst, src,
        outputSRS=srs,
        outputBounds=[ulx + shift[0], uly + shift[1], lrx + shift[0], lry + shift[1]],
        creationOptions=['COMPRESS=DEFLATE', 'PREDICTOR=2', 'TILED=YES', 'BIGTIFF=IF_SAFER'])
    if ds is None:
        raise RuntimeError('GDAL non ha creato il raster per la Mappa')
    ds = None
    return dst
