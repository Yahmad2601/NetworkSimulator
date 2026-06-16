// Pure Diffie–Hellman model. Uses small teaching primes so the modular
// arithmetic is exact in JS numbers and fully unit-testable (see dh.test.ts).

/** Modular exponentiation: base^exp mod m, via square-and-multiply. */
export function modPow(base: number, exp: number, m: number): number {
  if (m === 1) return 0;
  let result = 1;
  let b = base % m;
  let e = exp;
  while (e > 0) {
    if (e % 2 === 1) result = (result * b) % m;
    e = Math.floor(e / 2);
    b = (b * b) % m;
  }
  return result;
}

/** Public value g^priv mod p, shared openly. */
export function publicValue(g: number, priv: number, p: number): number {
  return modPow(g, priv, p);
}

/** Shared secret otherPublic^priv mod p — computed independently by each side. */
export function sharedSecret(otherPublic: number, priv: number, p: number): number {
  return modPow(otherPublic, priv, p);
}

export interface DhExchange {
  g: number;
  p: number;
  a: number;
  b: number;
  aPublic: number;
  bPublic: number;
  aShared: number;
  bShared: number;
  shared: number;
  /** Always true for valid inputs — both sides derive the same secret. */
  agree: boolean;
}

/** Run a full exchange for public params (g, p) and private secrets a, b. */
export function computeExchange(g: number, p: number, a: number, b: number): DhExchange {
  const aPublic = publicValue(g, a, p);
  const bPublic = publicValue(g, b, p);
  const aShared = sharedSecret(bPublic, a, p);
  const bShared = sharedSecret(aPublic, b, p);
  return {
    g,
    p,
    a,
    b,
    aPublic,
    bPublic,
    aShared,
    bShared,
    shared: aShared,
    agree: aShared === bShared,
  };
}
