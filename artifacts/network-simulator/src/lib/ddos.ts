// Pure DDoS model — computes server load and legitimate-user success from the
// attack type, botnet size, and active mitigations (a mitigation only helps
// against the attacks it actually counters). No React, so it is unit-testable
// (see ddos.test.ts).

export type AttackType = "syn-flood" | "udp-amplification" | "http-flood";
export type Mitigation = "rate-limit" | "syn-cookies" | "scrubbing" | "waf";

export interface AttackProfile {
  id: AttackType;
  name: string;
  category: string;
  resource: string;
  description: string;
  effectiveMitigations: Mitigation[];
}

export const ATTACKS: AttackProfile[] = [
  {
    id: "syn-flood",
    name: "SYN Flood",
    category: "Protocol · L4",
    resource: "Connection table",
    description:
      "Half-open TCP connections are opened but never completed, filling the backlog so real clients can't connect.",
    effectiveMitigations: ["syn-cookies", "rate-limit", "scrubbing"],
  },
  {
    id: "udp-amplification",
    name: "UDP Amplification",
    category: "Volumetric · L3/4",
    resource: "Bandwidth",
    description:
      "Spoofed small queries to open servers trigger huge replies aimed at the victim, saturating the link.",
    effectiveMitigations: ["scrubbing", "rate-limit"],
  },
  {
    id: "http-flood",
    name: "HTTP Flood",
    category: "Application · L7",
    resource: "CPU / app workers",
    description:
      "Floods of realistic requests exhaust application resources — hard to tell apart from genuine traffic.",
    effectiveMitigations: ["waf", "rate-limit"],
  },
];

export const MITIGATIONS: { id: Mitigation; name: string; note: string }[] = [
  { id: "rate-limit", name: "Rate Limiting", note: "Caps requests per source." },
  { id: "syn-cookies", name: "SYN Cookies", note: "Stateless handshake — no half-open table." },
  { id: "scrubbing", name: "Scrubbing Center", note: "Filters malicious traffic upstream." },
  { id: "waf", name: "WAF / CDN", note: "Inspects and absorbs L7 floods." },
];

const BASE_LOAD: Record<AttackType, number> = {
  "syn-flood": 150,
  "udp-amplification": 210,
  "http-flood": 130,
};

const REDUCTION: Record<Mitigation, number> = {
  "rate-limit": 0.5,
  "syn-cookies": 0.8,
  scrubbing: 0.7,
  waf: 0.7,
};

export type ServerState = "NORMAL" | "DEGRADED" | "SATURATED";

export interface DdosImpact {
  rawLoad: number;
  mitigatedLoad: number;
  serverLoad: number; // 0–100 for the gauge
  legitSuccess: number; // 0–100
  state: ServerState;
  appliedMitigations: Mitigation[];
  resource: string;
}

/** `bots` is expected in the range 0–1000. */
export function computeImpact(attack: AttackType, bots: number, mitigations: Mitigation[]): DdosImpact {
  const profile = ATTACKS.find((a) => a.id === attack)!;
  const rawLoad = (Math.max(0, bots) / 1000) * BASE_LOAD[attack];

  const applied = mitigations.filter((m) => profile.effectiveMitigations.includes(m));
  let mitigatedLoad = rawLoad;
  for (const m of applied) mitigatedLoad *= 1 - REDUCTION[m];

  const serverLoad = Math.min(100, Math.round(mitigatedLoad));
  const legitSuccess = Math.max(0, Math.min(100, Math.round(100 - Math.max(0, mitigatedLoad - 30) * 1.4)));
  const state: ServerState = serverLoad >= 90 ? "SATURATED" : serverLoad >= 50 ? "DEGRADED" : "NORMAL";

  return { rawLoad, mitigatedLoad, serverLoad, legitSuccess, state, appliedMitigations: applied, resource: profile.resource };
}
