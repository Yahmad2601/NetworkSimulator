import { describe, it, expect } from "vitest";
import { modPow, publicValue, sharedSecret, computeExchange } from "./dh";

describe("modPow", () => {
  it("matches the instructor-verified worked example (g=5, p=23)", () => {
    expect(modPow(5, 6, 23)).toBe(8); // Alice public
    expect(modPow(5, 15, 23)).toBe(19); // Bob public
    expect(modPow(19, 6, 23)).toBe(2); // Alice's shared
    expect(modPow(8, 15, 23)).toBe(2); // Bob's shared
  });

  it("handles the trivial cases", () => {
    expect(modPow(7, 0, 23)).toBe(1);
    expect(modPow(0, 5, 23)).toBe(0);
    expect(modPow(2, 10, 1000)).toBe(24); // 1024 mod 1000
  });
});

describe("computeExchange", () => {
  it("reproduces the canonical example and both sides agree on 2", () => {
    const e = computeExchange(5, 23, 6, 15);
    expect(e.aPublic).toBe(8);
    expect(e.bPublic).toBe(19);
    expect(e.aShared).toBe(2);
    expect(e.bShared).toBe(2);
    expect(e.shared).toBe(2);
    expect(e.agree).toBe(true);
  });

  it("both parties always derive the same secret across many inputs", () => {
    const params: Array<[number, number]> = [
      [5, 23],
      [2, 11],
      [3, 17],
    ];
    for (const [g, p] of params) {
      for (let a = 1; a < p; a++) {
        for (let b = 1; b < p; b++) {
          const e = computeExchange(g, p, a, b);
          expect(e.aShared).toBe(e.bShared);
        }
      }
    }
  });
});

describe("publicValue / sharedSecret helpers", () => {
  it("compose into the same shared secret", () => {
    const A = publicValue(5, 6, 23);
    const B = publicValue(5, 15, 23);
    expect(sharedSecret(B, 6, 23)).toBe(sharedSecret(A, 15, 23));
  });
});
