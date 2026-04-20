export interface NetworkNode {
  id: string;
  label: string;
  ip: string;
  type: "router" | "server" | "laptop" | "firewall" | "switch" | "iot";
  x: number;
  y: number;
  status: "active" | "warning" | "threat" | "idle";
  packets_in: number;
  packets_out: number;
}

export interface NetworkEdge {
  id: string;
  from: string;
  to: string;
  bandwidth: string;
  protocol: string;
  active: boolean;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  event: string;
  type: "info" | "success" | "warning" | "error";
  source?: string;
  dest?: string;
}

export const NODES: NetworkNode[] = [
  {
    id: "router-main",
    label: "CORE-RTR-01",
    ip: "192.168.1.1",
    type: "router",
    x: 420,
    y: 200,
    status: "active",
    packets_in: 14823,
    packets_out: 12901,
  },
  {
    id: "firewall-1",
    label: "FW-EDGE-01",
    ip: "10.0.0.1",
    type: "firewall",
    x: 200,
    y: 200,
    status: "active",
    packets_in: 8200,
    packets_out: 7900,
  },
  {
    id: "server-web",
    label: "WEB-SRV-01",
    ip: "192.168.1.10",
    type: "server",
    x: 620,
    y: 100,
    status: "active",
    packets_in: 5400,
    packets_out: 4300,
  },
  {
    id: "server-db",
    label: "DB-SRV-01",
    ip: "192.168.1.20",
    type: "server",
    x: 620,
    y: 300,
    status: "warning",
    packets_in: 3100,
    packets_out: 2200,
  },
  {
    id: "switch-1",
    label: "SW-DIST-01",
    ip: "192.168.2.1",
    type: "switch",
    x: 420,
    y: 360,
    status: "active",
    packets_in: 11200,
    packets_out: 10900,
  },
  {
    id: "laptop-1",
    label: "WS-ANALYST-01",
    ip: "192.168.2.10",
    type: "laptop",
    x: 260,
    y: 420,
    status: "active",
    packets_in: 920,
    packets_out: 740,
  },
  {
    id: "laptop-2",
    label: "WS-DEV-02",
    ip: "192.168.2.11",
    type: "laptop",
    x: 420,
    y: 490,
    status: "idle",
    packets_in: 230,
    packets_out: 180,
  },
  {
    id: "iot-1",
    label: "CAM-LOBBY-01",
    ip: "192.168.3.50",
    type: "iot",
    x: 580,
    y: 450,
    status: "threat",
    packets_in: 4400,
    packets_out: 1200,
  },
];

export const EDGES: NetworkEdge[] = [
  { id: "e1", from: "firewall-1", to: "router-main", bandwidth: "1Gbps", protocol: "BGP", active: true },
  { id: "e2", from: "router-main", to: "server-web", bandwidth: "100Mbps", protocol: "HTTP/S", active: true },
  { id: "e3", from: "router-main", to: "server-db", bandwidth: "100Mbps", protocol: "MySQL", active: true },
  { id: "e4", from: "router-main", to: "switch-1", bandwidth: "1Gbps", protocol: "Ethernet", active: true },
  { id: "e5", from: "switch-1", to: "laptop-1", bandwidth: "100Mbps", protocol: "TCP/IP", active: true },
  { id: "e6", from: "switch-1", to: "laptop-2", bandwidth: "100Mbps", protocol: "TCP/IP", active: false },
  { id: "e7", from: "switch-1", to: "iot-1", bandwidth: "10Mbps", protocol: "UDP", active: true },
];

export const INITIAL_LOGS: LogEntry[] = [
  {
    id: "l1",
    timestamp: "10:42:01",
    event: "ARP Request Broadcast from 192.168.1.1",
    type: "info",
    source: "192.168.1.1",
  },
  {
    id: "l2",
    timestamp: "10:42:03",
    event: "TCP 3-Way Handshake OK — WEB-SRV-01",
    type: "success",
    source: "192.168.1.1",
    dest: "192.168.1.10",
  },
  {
    id: "l3",
    timestamp: "10:42:05",
    event: "TLS 1.3 Negotiation — Session Established",
    type: "success",
    source: "192.168.1.10",
  },
  {
    id: "l4",
    timestamp: "10:42:09",
    event: "ICMP Ping Reply — RTT: 1.2ms",
    type: "info",
    source: "192.168.1.1",
    dest: "192.168.1.20",
  },
  {
    id: "l5",
    timestamp: "10:42:12",
    event: "DNS Query: api.internal.corp → 192.168.1.10",
    type: "info",
  },
  {
    id: "l6",
    timestamp: "10:42:15",
    event: "WARN — High traffic on DB-SRV-01 port 3306",
    type: "warning",
    source: "192.168.1.20",
  },
  {
    id: "l7",
    timestamp: "10:42:18",
    event: "BGP Route Update — 3 prefixes received",
    type: "info",
    source: "10.0.0.1",
  },
  {
    id: "l8",
    timestamp: "10:42:20",
    event: "THREAT — Suspicious UDP flood from CAM-LOBBY-01",
    type: "error",
    source: "192.168.3.50",
  },
  {
    id: "l9",
    timestamp: "10:42:22",
    event: "Firewall rule triggered: DROP UDP 192.168.3.50:*",
    type: "warning",
    source: "10.0.0.1",
  },
  {
    id: "l10",
    timestamp: "10:42:24",
    event: "OSPF Hello Packet — Neighbor 192.168.1.1",
    type: "info",
    source: "192.168.2.1",
  },
];

export const LIVE_LOG_POOL: Omit<LogEntry, "id" | "timestamp">[] = [
  { event: "TCP SYN from 192.168.2.10 → 192.168.1.10:443", type: "info", source: "192.168.2.10", dest: "192.168.1.10" },
  { event: "HTTP 200 OK — GET /api/status", type: "success", source: "192.168.1.10" },
  { event: "ARP Cache Updated — 192.168.2.11 at aa:bb:cc:11:22", type: "info" },
  { event: "NTP Sync — Drift: +0.003ms", type: "success" },
  { event: "SNMP Poll — CPU 34% MEM 71% on WEB-SRV-01", type: "info", source: "192.168.1.10" },
  { event: "TLS Certificate Renewed — Valid 365 days", type: "success", source: "192.168.1.10" },
  { event: "WARN — DB connection pool at 87% capacity", type: "warning", source: "192.168.1.20" },
  { event: "SSH Login — admin@192.168.1.10 from 192.168.2.10", type: "info", source: "192.168.2.10" },
  { event: "THREAT — Port scan detected from 192.168.3.50", type: "error", source: "192.168.3.50" },
  { event: "UDP Fragmentation Attack — FW-EDGE-01 mitigating", type: "error", source: "10.0.0.1" },
  { event: "OSPF LSA Flood — 5 updates in 2s", type: "warning", source: "192.168.1.1" },
  { event: "HTTP/2 Stream Opened — PUSH promise to client", type: "info", source: "192.168.1.10" },
  { event: "ICMP TTL Exceeded — Traceroute detected", type: "info" },
  { event: "VPN Tunnel re-keyed — IPSec SA rotated", type: "success", source: "10.0.0.1" },
  { event: "BGP Peer Keepalive — 192.168.1.1 ↔ 10.0.0.1", type: "info" },
  { event: "Firewall rule matched: ALLOW TCP 192.168.2.10:* → 1.1.1.1:443", type: "success", source: "10.0.0.1" },
  { event: "DNS NXDOMAIN — unknown.host.corp not found", type: "warning" },
  { event: "CAM-LOBBY-01 — Anomalous outbound volume: 4.2MB/s", type: "error", source: "192.168.3.50" },
];
