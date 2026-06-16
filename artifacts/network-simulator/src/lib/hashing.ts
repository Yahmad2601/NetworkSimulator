// Hashing helpers. The digest itself uses the real Web Crypto SHA-256 (accurate,
// not faked); the surrounding string/bit helpers are pure so they can be unit
// tested (see hashing.test.ts).

const encoder = new TextEncoder();

/** Lowercase hex encoding of a byte array. */
export function toHex(bytes: Uint8Array): string {
  let out = "";
  for (const b of bytes) out += b.toString(16).padStart(2, "0");
  return out;
}

/** Real SHA-256 of a UTF-8 string, returned as 64 lowercase hex chars. */
export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(text));
  return toHex(new Uint8Array(digest));
}

/** How a salt is combined with a password before hashing (salt prepended). */
export function combineWithSalt(salt: string, password: string): string {
  return `${salt}${password}`;
}

/** A random hex salt (default 8 bytes → 16 hex chars). */
export function randomSalt(bytes = 8): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return toHex(arr);
}

export interface BitDiff {
  differingBits: number;
  totalBits: number;
  percent: number;
}

/**
 * Counts how many bits differ between two equal-length hex strings — used to
 * quantify the avalanche effect (a good hash changes ~50% of output bits when
 * the input changes at all).
 */
export function bitDifference(hexA: string, hexB: string): BitDiff {
  const len = Math.min(hexA.length, hexB.length);
  let differingBits = 0;
  for (let i = 0; i < len; i++) {
    let xor = parseInt(hexA[i], 16) ^ parseInt(hexB[i], 16);
    while (xor) {
      differingBits += xor & 1;
      xor >>= 1;
    }
  }
  const totalBits = len * 4;
  return {
    differingBits,
    totalBits,
    percent: totalBits ? (differingBits / totalBits) * 100 : 0,
  };
}
