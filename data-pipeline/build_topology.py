"""Build the drainage network topology index from links.geojson.

Usage: python build_topology.py   (run after convert_shp.py)
Writes ../shared/data/topology.json:
{
  "downstream": { nodeId: [{"link": linkMuid, "node": toNode}, ...] },
  "upstream":   { nodeId: [{"link": linkMuid, "node": fromNode}, ...] },
  "linkNodes":  { linkMuid: [fromNode, toNode] }
}
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "..", "shared", "data")


def main():
    with open(os.path.join(DATA, "links.geojson"), encoding="utf-8") as f:
        links = json.load(f)["features"]

    downstream, upstream, link_nodes = {}, {}, {}
    for feat in links:
        p = feat["properties"]
        lid, a, b = str(p["muid"]), str(p["fromNode"]), str(p["toNode"])
        link_nodes[lid] = [a, b]
        downstream.setdefault(a, []).append({"link": lid, "node": b})
        upstream.setdefault(b, []).append({"link": lid, "node": a})

    out = os.path.join(DATA, "topology.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump({"downstream": downstream, "upstream": upstream,
                   "linkNodes": link_nodes}, f, separators=(",", ":"))
    print(f"topology: {len(link_nodes)} links, "
          f"{len(set(downstream) | set(upstream))} nodes -> {out}")


if __name__ == "__main__":
    main()
