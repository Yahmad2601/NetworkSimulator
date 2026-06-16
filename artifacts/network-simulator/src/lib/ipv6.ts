// Pure IPv6 address helpers — expansion, RFC 5952 compression, type
// classification, and EUI-64 / SLAAC derivation. No React, so all of it is
// unit-testable (see ipv6.test.ts).

/** True if `addr` is a syntactically valid IPv6 address (one optional `::`). */
export function isValidIPv6(addr: string): boolean {
  const a = addr.trim().toLowerCase();
  if (a === "") return false;
  if (!/^[0-9a-f:]+$/.test(a)) return false;
  if ((a.match(/::/g) ?? []).length > 1) return false;
  if (a.includes(":::")) return false;

  if (a.includes("::")) {
    const [l, r] = a.split("::");
    const head = l ? l.split(":") : [];
    const tail = r ? r.split(":") : [];
    if (head.length + tail.length > 7) return false; // :: must cover >=1 group
    return [...head, ...tail].every((g) => /^[0-9a-f]{1,4}$/.test(g));
  }

  const groups = a.split(":");
  return groups.length === 8 && groups.every((g) => /^[0-9a-f]{1,4}$/.test(g));
}

/** Expand to the full eight-group, zero-padded form. */
export function expandIPv6(addr: string): string {
  const a = addr.trim().toLowerCase();
  let groups: string[];

  if (a.includes("::")) {
    const [l, r] = a.split("::");
    const head = l ? l.split(":") : [];
    const tail = r ? r.split(":") : [];
    const missing = 8 - head.length - tail.length;
    groups = [...head, ...Array(Math.max(0, missing)).fill("0"), ...tail];
  } else {
    groups = a.split(":");
  }

  return groups.map((g) => g.padStart(4, "0")).join(":");
}

/** Compress to RFC 5952 canonical form (longest zero run → `::`, never a single 0 group). */
export function compressIPv6(addr: string): string {
  const groups = expandIPv6(addr)
    .split(":")
    .map((g) => g.replace(/^0+/, "") || "0");

  let bestStart = -1;
  let bestLen = 0;
  let curStart = -1;
  let curLen = 0;
  for (let i = 0; i < 8; i++) {
    if (groups[i] === "0") {
      if (curStart < 0) {
        curStart = i;
        curLen = 1;
      } else {
        curLen++;
      }
      if (curLen > bestLen) {
        bestLen = curLen;
        bestStart = curStart;
      }
    } else {
      curStart = -1;
      curLen = 0;
    }
  }

  // RFC 5952: only collapse a run of two or more zero groups.
  if (bestLen >= 2) {
    const before = groups.slice(0, bestStart);
    const after = groups.slice(bestStart + bestLen);
    return `${before.join(":")}::${after.join(":")}`;
  }

  return groups.join(":");
}

export interface IPv6Type {
  type: string;
  prefix: string;
  description: string;
}

/** Classify an address into its IPv6 type by prefix. */
export function classifyIPv6(addr: string): IPv6Type {
  const groups = expandIPv6(addr).split(":");
  const g0 = parseInt(groups[0], 16);
  const allZero = groups.every((g) => g === "0000");
  const loopback = groups.slice(0, 7).every((g) => g === "0000") && groups[7] === "0001";

  if (allZero) {
    return { type: "Unspecified", prefix: "::/128", description: "No address yet (::), e.g. during initialization." };
  }
  if (loopback) {
    return { type: "Loopback", prefix: "::1/128", description: "The local host (::1), like 127.0.0.1 in IPv4." };
  }
  if ((g0 & 0xff00) === 0xff00) {
    return { type: "Multicast", prefix: "ff00::/8", description: "One-to-many delivery. IPv6 has no broadcast." };
  }
  if ((g0 & 0xffc0) === 0xfe80) {
    return { type: "Link-Local", prefix: "fe80::/10", description: "Auto-configured, valid only on the local link; never routed." };
  }
  if ((g0 & 0xfe00) === 0xfc00) {
    return { type: "Unique Local", prefix: "fc00::/7", description: "Private addressing, not routed on the global internet." };
  }
  if ((g0 & 0xe000) === 0x2000) {
    return { type: "Global Unicast", prefix: "2000::/3", description: "Publicly routable, like a public IPv4 address." };
  }
  return { type: "Other / Reserved", prefix: "—", description: "Reserved or special-purpose range." };
}

/** Normalise a MAC string to six byte values, or null if invalid. */
export function parseMac(mac: string): number[] | null {
  const parts = mac.trim().toLowerCase().split(/[:-]/);
  if (parts.length !== 6) return null;
  if (!parts.every((p) => /^[0-9a-f]{1,2}$/.test(p))) return null;
  return parts.map((p) => parseInt(p, 16));
}

/**
 * Build the 64-bit interface identifier from a 48-bit MAC via EUI-64:
 * insert FFFE in the middle and flip the Universal/Local (7th) bit.
 * Returns four zero-padded hex groups joined by ":".
 */
export function eui64(mac: string): string {
  const bytes = parseMac(mac);
  if (!bytes) throw new Error(`Invalid MAC: ${mac}`);
  const b = [...bytes];
  b[0] = b[0] ^ 0x02; // flip the U/L bit
  const eui = [b[0], b[1], b[2], 0xff, 0xfe, b[3], b[4], b[5]];
  const groups: string[] = [];
  for (let i = 0; i < 8; i += 2) {
    groups.push(((eui[i] << 8) | eui[i + 1]).toString(16).padStart(4, "0"));
  }
  return groups.join(":");
}

/** Combine a /64 prefix with an EUI-64 interface ID into a compressed SLAAC address. */
export function slaacAddress(prefix: string, mac: string): string {
  const cleanPrefix = prefix.split("/")[0];
  const prefixGroups = expandIPv6(cleanPrefix).split(":").slice(0, 4);
  const iid = eui64(mac).split(":");
  return compressIPv6([...prefixGroups, ...iid].join(":"));
}
