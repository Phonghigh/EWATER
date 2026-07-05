import type { FeatureCollection } from "geojson";
import type { Topology, TraceResult } from "../types";

/** BFS over the drainage graph from a start node. */
export function traceNetwork(
  topology: Topology,
  links: FeatureCollection,
  startNode: string,
  direction: "upstream" | "downstream",
): TraceResult {
  const adj = direction === "upstream" ? topology.upstream : topology.downstream;
  const nodes = new Set<string>([startNode]);
  const linkIds = new Set<string>();
  const queue = [startNode];
  while (queue.length) {
    const n = queue.shift()!;
    for (const edge of adj[n] ?? []) {
      if (!linkIds.has(edge.link)) linkIds.add(edge.link);
      if (!nodes.has(edge.node)) {
        nodes.add(edge.node);
        queue.push(edge.node);
      }
    }
  }
  let totalLength = 0;
  for (const f of links.features) {
    const p = f.properties as { muid?: unknown; length?: unknown };
    if (linkIds.has(String(p.muid))) totalLength += Number(p.length) || 0;
  }
  return {
    direction,
    nodes: [...nodes],
    links: [...linkIds],
    totalLength: Math.round(totalLength),
  };
}
