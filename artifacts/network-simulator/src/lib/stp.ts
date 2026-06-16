// Pure 802.1D Spanning Tree model — root election, root-path costs, and port
// role assignment. No React, so the algorithm is fully unit-testable (stp.test.ts).

export type PortRole = "root" | "designated" | "blocking";

export interface StpSwitch {
  id: string;
  priority: number;
  mac: string;
}

export interface StpLink {
  id: string;
  a: string;
  b: string;
  cost: number;
}

/** IEEE 802.1D path costs by link speed. */
export const STP_COST: Record<string, number> = {
  "10G": 2,
  "1G": 4,
  "100M": 19,
  "10M": 100,
};

export const DEFAULT_SWITCHES: StpSwitch[] = [
  { id: "S1", priority: 4096, mac: "00:11:11:11:11:11" }, // lowest BID → root
  { id: "S2", priority: 32768, mac: "00:22:22:22:22:22" },
  { id: "S3", priority: 32768, mac: "00:33:33:33:33:33" },
];

export const DEFAULT_LINKS: StpLink[] = [
  { id: "L12", a: "S1", b: "S2", cost: STP_COST["1G"] },
  { id: "L13", a: "S1", b: "S3", cost: STP_COST["1G"] },
  { id: "L23", a: "S2", b: "S3", cost: STP_COST["100M"] },
];

/** True if x has the lower Bridge ID (priority, then MAC). */
function bidLess(x: StpSwitch, y: StpSwitch): boolean {
  if (x.priority !== y.priority) return x.priority < y.priority;
  return x.mac.toLowerCase() < y.mac.toLowerCase();
}

export function electRoot(switches: StpSwitch[]): StpSwitch {
  return switches.reduce((best, s) => (bidLess(s, best) ? s : best));
}

/** Least-cost path from every switch to the root (Dijkstra). */
export function rootPathCosts(
  switches: StpSwitch[],
  links: StpLink[],
  rootId: string,
): Record<string, number> {
  const dist: Record<string, number> = {};
  switches.forEach((s) => (dist[s.id] = Infinity));
  dist[rootId] = 0;
  const visited = new Set<string>();

  const neighbours = (id: string) =>
    links
      .filter((l) => l.a === id || l.b === id)
      .map((l) => ({ to: l.a === id ? l.b : l.a, cost: l.cost }));

  while (visited.size < switches.length) {
    let u: string | null = null;
    let best = Infinity;
    for (const s of switches) {
      if (!visited.has(s.id) && dist[s.id] < best) {
        best = dist[s.id];
        u = s.id;
      }
    }
    if (u === null) break;
    visited.add(u);
    for (const { to, cost } of neighbours(u)) {
      if (dist[u] + cost < dist[to]) dist[to] = dist[u] + cost;
    }
  }
  return dist;
}

export interface StpPort {
  switchId: string;
  linkId: string;
  neighborId: string;
  role: PortRole;
}

export interface StpResult {
  rootId: string;
  rpc: Record<string, number>;
  ports: StpPort[];
}

/** Full STP computation: root, root-path costs, and every port's role. */
export function computeStp(switches: StpSwitch[], links: StpLink[]): StpResult {
  const root = electRoot(switches);
  const rpc = rootPathCosts(switches, links, root.id);
  const byId = Object.fromEntries(switches.map((s) => [s.id, s]));

  // Root port: on each non-root switch, the link giving the least-cost path to
  // the root (tie → neighbour with the lower Bridge ID).
  const rootPortLink: Record<string, string> = {};
  for (const s of switches) {
    if (s.id === root.id) continue;
    let bestLink: StpLink | null = null;
    let bestCost = Infinity;
    let bestNeighbor: StpSwitch | null = null;
    for (const l of links.filter((l) => l.a === s.id || l.b === s.id)) {
      const nId = l.a === s.id ? l.b : l.a;
      const c = rpc[nId] + l.cost;
      if (c < bestCost || (c === bestCost && bestNeighbor && bidLess(byId[nId], bestNeighbor))) {
        bestCost = c;
        bestLink = l;
        bestNeighbor = byId[nId];
      }
    }
    if (bestLink) rootPortLink[s.id] = bestLink.id;
  }

  // Per link, the designated bridge is the end with the lower root-path cost
  // (tie → lower Bridge ID). Each port is then Root / Designated / Blocking.
  const ports: StpPort[] = [];
  for (const l of links) {
    const designated =
      rpc[l.a] !== rpc[l.b]
        ? rpc[l.a] < rpc[l.b]
          ? l.a
          : l.b
        : bidLess(byId[l.a], byId[l.b])
          ? l.a
          : l.b;

    for (const end of [l.a, l.b]) {
      const neighbor = end === l.a ? l.b : l.a;
      let role: PortRole;
      if (rootPortLink[end] === l.id) role = "root";
      else if (designated === end) role = "designated";
      else role = "blocking";
      ports.push({ switchId: end, linkId: l.id, neighborId: neighbor, role });
    }
  }

  return { rootId: root.id, rpc, ports };
}
