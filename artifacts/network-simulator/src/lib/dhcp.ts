// Pure DHCP (DORA) model — kept free of React so the message definitions,
// client state machine, and lease timers can be unit-tested (see dhcp.test.ts).

export type DhcpPhase =
  | "INIT"
  | "SELECTING"
  | "REQUESTING"
  | "BOUND"
  | "RENEWING"
  | "REBINDING"
  | "EXPIRED";

export type DhcpMessageType = "DISCOVER" | "OFFER" | "REQUEST" | "ACK";

export type DhcpDirection = "client-to-server" | "server-to-client";

/** A DHCP client uses UDP/68, the server UDP/67. */
export const CLIENT_PORT = 68;
export const SERVER_PORT = 67;

export interface DhcpField {
  label: string;
  value: string;
}

export interface DhcpMessage {
  type: DhcpMessageType;
  direction: DhcpDirection;
  /** Discover and Request are broadcast; Offer and Ack are unicast to the client's MAC. */
  broadcast: boolean;
  srcIp: string;
  dstIp: string;
  srcPort: number;
  dstPort: number;
  summary: string;
  fields: DhcpField[];
}

export interface DhcpConfig {
  clientMac: string;
  serverIp: string;
  /** The server the client commits to — echoed in the Request's Server Identifier option. */
  serverIdentifier: string;
  offeredIp: string;
  subnetMask: string;
  gateway: string;
  dns: string;
  leaseSeconds: number;
  xid: string;
}

export const DEFAULT_DHCP_CONFIG: DhcpConfig = {
  clientMac: "00:1A:2B:3C:4D:5E",
  serverIp: "192.168.1.1",
  serverIdentifier: "192.168.1.1",
  offeredIp: "192.168.1.100",
  subnetMask: "255.255.255.0",
  gateway: "192.168.1.1",
  dns: "8.8.8.8",
  leaseSeconds: 3600,
  xid: "0x3D1F2A",
};

/** The four DORA messages, in order, built from a config. */
export function doraMessages(cfg: DhcpConfig = DEFAULT_DHCP_CONFIG): DhcpMessage[] {
  const { t1, t2 } = leaseTimers(cfg.leaseSeconds);
  return [
    {
      type: "DISCOVER",
      direction: "client-to-server",
      broadcast: true,
      srcIp: "0.0.0.0",
      dstIp: "255.255.255.255",
      srcPort: CLIENT_PORT,
      dstPort: SERVER_PORT,
      summary:
        "The client has no IP yet, so it broadcasts to locate any DHCP server on the segment.",
      fields: [
        { label: "Transaction ID (xid)", value: cfg.xid },
        { label: "Client MAC (chaddr)", value: cfg.clientMac },
        { label: "Source", value: "0.0.0.0 → 255.255.255.255" },
      ],
    },
    {
      type: "OFFER",
      direction: "server-to-client",
      broadcast: false,
      srcIp: cfg.serverIp,
      dstIp: cfg.offeredIp,
      srcPort: SERVER_PORT,
      dstPort: CLIENT_PORT,
      summary:
        "A server reserves an address and offers it, unicast to the client's MAC, with full configuration.",
      fields: [
        { label: "Offered IP (yiaddr)", value: cfg.offeredIp },
        { label: "Subnet Mask", value: cfg.subnetMask },
        { label: "Gateway", value: cfg.gateway },
        { label: "DNS", value: cfg.dns },
        { label: "Lease", value: `${cfg.leaseSeconds}s` },
        { label: "Server Identifier", value: cfg.serverIdentifier },
      ],
    },
    {
      type: "REQUEST",
      direction: "client-to-server",
      broadcast: true,
      srcIp: "0.0.0.0",
      dstIp: "255.255.255.255",
      srcPort: CLIENT_PORT,
      dstPort: SERVER_PORT,
      summary:
        "The client broadcasts its acceptance, naming the chosen server so other servers withdraw their offers.",
      fields: [
        { label: "Requested IP", value: cfg.offeredIp },
        { label: "Server Identifier", value: cfg.serverIdentifier },
        { label: "Transaction ID (xid)", value: cfg.xid },
      ],
    },
    {
      type: "ACK",
      direction: "server-to-client",
      broadcast: false,
      srcIp: cfg.serverIp,
      dstIp: cfg.offeredIp,
      srcPort: SERVER_PORT,
      dstPort: CLIENT_PORT,
      summary:
        "The chosen server confirms the lease. The client binds the address and starts its lease timers.",
      fields: [
        { label: "Assigned IP (yiaddr)", value: cfg.offeredIp },
        { label: "Lease", value: `${cfg.leaseSeconds}s` },
        { label: "T1 (renew)", value: `${t1}s` },
        { label: "T2 (rebind)", value: `${t2}s` },
      ],
    },
  ];
}

/**
 * Client DORA phase by step index:
 * 0 = nothing sent, 1 = Discover sent, 2 = Offer received,
 * 3 = Request sent, 4+ = Ack received (bound).
 */
export function clientPhaseForStep(step: number): DhcpPhase {
  switch (step) {
    case 0:
      return "INIT";
    case 1:
    case 2:
      return "SELECTING";
    case 3:
      return "REQUESTING";
    default:
      return "BOUND";
  }
}

export interface LeaseTimers {
  /** T1 — renewal begins at 50% of the lease (unicast to the leasing server). */
  t1: number;
  /** T2 — rebinding begins at 87.5% of the lease (broadcast to any server). */
  t2: number;
}

export function leaseTimers(leaseSeconds: number): LeaseTimers {
  return { t1: leaseSeconds * 0.5, t2: leaseSeconds * 0.875 };
}

/** Lease phase as a function of elapsed-lease fraction (0..1). */
export function phaseForLeaseProgress(
  progress: number,
): "BOUND" | "RENEWING" | "REBINDING" | "EXPIRED" {
  if (progress >= 1) return "EXPIRED";
  if (progress >= 0.875) return "REBINDING";
  if (progress >= 0.5) return "RENEWING";
  return "BOUND";
}
