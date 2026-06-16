// Pure 802.1Q / VLAN model — tag construction and broadcast-domain rules.
// No React, so it is fully unit-testable (see vlan.test.ts).

export interface VlanHost {
  id: string;
  name: string;
  vlan: number;
  switchId: string;
}

export interface Dot1qTag {
  /** Tag Protocol Identifier — always 0x8100 for 802.1Q. */
  tpid: number;
  /** Priority Code Point (3 bits). */
  pcp: number;
  /** Drop Eligible Indicator (1 bit). */
  dei: number;
  /** VLAN Identifier (12 bits). */
  vid: number;
}

export const VLAN_COLORS: Record<number, string> = {
  10: "#3b82f6",
  20: "#f59e0b",
};

export function buildTag(vid: number, pcp = 0, dei = 0): Dot1qTag {
  return { tpid: 0x8100, pcp, dei, vid };
}

/** The 16-bit Tag Control Information field: PCP(3) | DEI(1) | VID(12). */
export function tci(tag: Dot1qTag): number {
  return ((tag.pcp & 0x7) << 13) | ((tag.dei & 0x1) << 12) | (tag.vid & 0xfff);
}

/** The 4 tag bytes (TPID high/low, TCI high/low) as lowercase hex. */
export function tagBytes(tag: Dot1qTag): string[] {
  const t = tci(tag);
  const hex = (n: number) => (n & 0xff).toString(16).padStart(2, "0");
  return [hex(tag.tpid >> 8), hex(tag.tpid), hex(t >> 8), hex(t)];
}

/** Tag as a spaced uppercase hex string, e.g. "81 00 00 0A". */
export function tagHex(tag: Dot1qTag): string {
  return tagBytes(tag)
    .map((b) => b.toUpperCase())
    .join(" ");
}

/** Hosts that receive a broadcast from `sourceId` — same VLAN only (across the trunk). */
export function broadcastRecipients(hosts: VlanHost[], sourceId: string): string[] {
  const src = hosts.find((h) => h.id === sourceId);
  if (!src) return [];
  return hosts.filter((h) => h.vlan === src.vlan && h.id !== sourceId).map((h) => h.id);
}

/** On a trunk, a frame is tagged unless it belongs to the (untagged) native VLAN. */
export function isTaggedOnTrunk(vid: number, nativeVlan: number): boolean {
  return vid !== nativeVlan;
}

/** Valid VLAN IDs are 1–4094 (0 and 4095 are reserved). */
export function isValidVid(vid: number): boolean {
  return Number.isInteger(vid) && vid >= 1 && vid <= 4094;
}
