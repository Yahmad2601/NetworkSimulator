// Pure port-scan model — how a port responds to each scan technique, and how a
// firewall turns a closed port's RST into a silent "filtered". No React, so it
// is unit-testable (see portscan.test.ts). For authorized testing / education.

export type ScanType = "syn" | "connect" | "null" | "xmas" | "udp";
export type PortState = "open" | "closed" | "filtered" | "open|filtered";

export interface TargetPort {
  port: number;
  service: string;
  open: boolean;
}

export interface ScanResult {
  port: number;
  service: string;
  state: PortState;
  probe: string;
  response: string;
}

export const DEFAULT_PORTS: TargetPort[] = [
  { port: 22, service: "SSH", open: true },
  { port: 80, service: "HTTP", open: true },
  { port: 443, service: "HTTPS", open: true },
  { port: 3306, service: "MySQL", open: false },
  { port: 8080, service: "HTTP-alt", open: false },
  { port: 23, service: "Telnet", open: false },
];

const PROBE: Record<ScanType, string> = {
  syn: "TCP SYN",
  connect: "TCP connect()",
  null: "TCP NULL (no flags)",
  xmas: "TCP Xmas (FIN,PSH,URG)",
  udp: "UDP datagram",
};

export function scanPort(p: TargetPort, scan: ScanType, firewall: boolean): ScanResult {
  const meta = { port: p.port, service: p.service, probe: PROBE[scan] };
  const isTcpHandshake = scan === "syn" || scan === "connect";
  const isStealth = scan === "null" || scan === "xmas";

  if (p.open) {
    if (isTcpHandshake) return { ...meta, state: "open", response: "SYN-ACK" };
    // NULL/Xmas/UDP: an open port stays silent, so it can't be told from filtered.
    return { ...meta, state: "open|filtered", response: "(no response)" };
  }

  // Closed port. A firewall drops the probe instead of letting the RST through.
  if (firewall) return { ...meta, state: "filtered", response: "(no response — dropped)" };

  if (isTcpHandshake || isStealth) return { ...meta, state: "closed", response: "RST" };
  return { ...meta, state: "closed", response: "ICMP Port Unreachable" }; // UDP
}

export function runScan(ports: TargetPort[], scan: ScanType, firewall: boolean): ScanResult[] {
  return ports.map((p) => scanPort(p, scan, firewall));
}
