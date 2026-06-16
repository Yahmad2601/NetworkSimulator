import { describe, it, expect } from "vitest";
import { sha256Hex, toHex, combineWithSalt, randomSalt, bitDifference } from "./hashing";

describe("toHex", () => {
  it("encodes bytes as zero-padded lowercase hex", () => {
    expect(toHex(new Uint8Array([0, 255, 16, 1]))).toBe("00ff1001");
  });
});

describe("sha256Hex", () => {
  it("matches known SHA-256 test vectors", async () => {
    expect(await sha256Hex("")).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
    expect(await sha256Hex("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("is deterministic — identical input yields identical hash", async () => {
    expect(await sha256Hex("password")).toBe(await sha256Hex("password"));
  });

  it("salting makes identical passwords hash differently", async () => {
    const plain = await sha256Hex("password");
    const salted = await sha256Hex(combineWithSalt("a1b2c3d4", "password"));
    expect(salted).not.toBe(plain);
  });
});

describe("combineWithSalt", () => {
  it("prepends the salt to the password", () => {
    expect(combineWithSalt("SALT", "pw")).toBe("SALTpw");
  });
});

describe("randomSalt", () => {
  it("produces hex of the requested byte length and varies", () => {
    expect(randomSalt(8)).toMatch(/^[0-9a-f]{16}$/);
    expect(randomSalt(4)).toHaveLength(8);
    expect(randomSalt()).not.toBe(randomSalt());
  });
});

describe("bitDifference (avalanche measure)", () => {
  it("is zero for identical strings", () => {
    expect(bitDifference("00ff", "00ff").differingBits).toBe(0);
  });

  it("counts every differing bit", () => {
    expect(bitDifference("00", "ff")).toEqual({ differingBits: 8, totalBits: 8, percent: 100 });
    expect(bitDifference("00", "01").differingBits).toBe(1);
  });

  it("reports a percentage of bits changed", () => {
    expect(bitDifference("0", "f").percent).toBe(100);
    expect(bitDifference("0", "1").percent).toBe(25); // 1 of 4 bits
  });
});
