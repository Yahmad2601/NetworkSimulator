// Pure traceroute model — given a path and a TTL, work out which node responds
// and how. No React, so it is fully unit-testable (see traceroute.test.ts).

export type TraceMode = "icmp" | "udp";

export type ResponseType = "time-exceeded" | "echo-reply" | "port-unreachable" | "no-response";

export interface TraceNode {
  ip: string;
  name: string;
  /** A hop that drops the probe silently (no ICMP) — shows as `* * *`. */
  filtered?: boolean;
}

export interface ProbeResult {
  ttl: number;
  /** Index into the path of the responding node. */
  hopIndex: number;
  ip: string | null;
  responseType: ResponseType;
  isDestination: boolean;
}

export const SOURCE: TraceNode = { ip: "192.168.1.50", name: "Your PC" };

export const DEFAULT_PATH: TraceNode[] = [
  { ip: "192.168.1.1", name: "Home Gateway" },
  { ip: "10.0.0.1", name: "ISP Edge" },
  { ip: "100.64.0.1", name: "Core Router", filtered: true },
  { ip: "203.0.113.1", name: "Transit" },
  { ip: "93.184.216.34", name: "example.com" },
];

/**
 * Send one probe with the given TTL. The router at hop `ttl` decrements the TTL
 * to zero and returns Time Exceeded; once a probe survives to the destination,
 * the host replies (Echo Reply for ICMP/Windows, Port Unreachable for UDP/Linux).
 */
export function probe(path: TraceNode[], ttl: number, mode: TraceMode): ProbeResult {
  const hopIndex = ttl - 1;
  const node = path[hopIndex];
  const isDestination = hopIndex === path.length - 1;

  if (!node) {
    return { ttl, hopIndex, ip: null, responseType: "no-response", isDestination: false };
  }
  if (node.filtered) {
    return { ttl, hopIndex, ip: null, responseType: "no-response", isDestination };
  }
  if (isDestination) {
    return {
      ttl,
      hopIndex,
      ip: node.ip,
      responseType: mode === "icmp" ? "echo-reply" : "port-unreachable",
      isDestination: true,
    };
  }
  return { ttl, hopIndex, ip: node.ip, responseType: "time-exceeded", isDestination: false };
}

/** Run the full trace from TTL 1 until the destination responds. */
export function runTraceroute(path: TraceNode[], mode: TraceMode): ProbeResult[] {
  const results: ProbeResult[] = [];
  for (let ttl = 1; ttl <= path.length; ttl++) {
    const r = probe(path, ttl, mode);
    results.push(r);
    if (r.isDestination) break;
  }
  return results;
}
