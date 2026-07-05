"""Convert MIKE URBAN shapefiles (WGS84 UTM 48N) to WGS84 GeoJSON for the web/mobile apps.

Usage: python convert_shp.py
Reads  ../SHP/*.shp, writes ../shared/data/*.geojson
"""
import json
import os

import shapefile
from pyproj import Transformer

HERE = os.path.dirname(os.path.abspath(__file__))
SHP_DIR = os.path.join(HERE, "..", "SHP")
OUT_DIR = os.path.join(HERE, "..", "shared", "data")

TRANSFORMER = Transformer.from_crs("EPSG:32648", "EPSG:4326", always_xy=True)

# layer name -> (shapefile base, field renames, fields to keep after rename)
LAYERS = {
    "manholes": (
        "Manholes",
        {"MUID": "muid", "InvertLeve": "invertLevel", "GroundLeve": "groundLevel",
         "Diameter": "diameter"},
        ["muid", "invertLevel", "groundLevel", "diameter"],
    ),
    "links": (
        "Links",
        {"MUID": "muid", "UpLevel_C": "upLevel", "DwLevel_C": "downLevel",
         "Length_C": "length", "Slope_C": "slope", "Diameter": "diameter",
         "FROMNODE": "fromNode", "TONODE": "toNode"},
        ["muid", "upLevel", "downLevel", "length", "slope", "diameter",
         "fromNode", "toNode"],
    ),
    "outlets": (
        "Outlets",
        {"MUID": "muid", "InvertLeve": "invertLevel", "GroundLeve": "groundLevel"},
        ["muid", "invertLevel", "groundLevel"],
    ),
    "catchment": ("Catchment_VL", {}, []),
    "boundary": ("RanhTpVL", {}, []),
    "rivers": (
        "SongM11VL",
        {"RiverName": "riverName", "TopoID": "topoId", "length": "length"},
        ["riverName", "topoId", "length"],
    ),
}


def reproject_coords(coords):
    """Recursively reproject nested coordinate arrays."""
    if coords and isinstance(coords[0], (int, float)):
        x, y = TRANSFORMER.transform(coords[0], coords[1])
        return [round(x, 6), round(y, 6)]
    return [reproject_coords(c) for c in coords]


def clean_value(v):
    if isinstance(v, float):
        return round(v, 4)
    if isinstance(v, bytes):
        return v.decode("utf-8", "replace").strip()
    if isinstance(v, str):
        return v.strip()
    return v


def convert_layer(name, base, renames, keep):
    reader = shapefile.Reader(os.path.join(SHP_DIR, base))
    field_names = [f[0] for f in reader.fields if f[0] != "DeletionFlag"]
    features = []
    for sr in reader.shapeRecords():
        geom = sr.shape.__geo_interface__
        geom = {"type": geom["type"],
                "coordinates": reproject_coords(list_coords(geom["coordinates"]))}
        raw = dict(zip(field_names, sr.record))
        props = {}
        for k, v in raw.items():
            nk = renames.get(k)
            if nk and (not keep or nk in keep):
                props[nk] = clean_value(v)
        features.append({"type": "Feature", "properties": props, "geometry": geom})
    fc = {"type": "FeatureCollection", "features": features}
    out = os.path.join(OUT_DIR, f"{name}.geojson")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(fc, f, separators=(",", ":"))
    print(f"{name}: {len(features)} features -> {out} ({os.path.getsize(out)//1024} KB)")


def list_coords(c):
    """__geo_interface__ returns tuples; convert to lists for editing."""
    if isinstance(c, (list, tuple)) and c and isinstance(c[0], (int, float)):
        return list(c)
    return [list_coords(i) for i in c]


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for name, (base, renames, keep) in LAYERS.items():
        convert_layer(name, base, renames, keep)


if __name__ == "__main__":
    main()
