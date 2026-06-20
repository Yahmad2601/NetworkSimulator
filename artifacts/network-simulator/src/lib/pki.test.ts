import { describe, it, expect } from "vitest";
import { buildScenario, validateChain, type ChainScenario } from "./pki";

const run = (s: ChainScenario) => validateChain(buildScenario(s));

describe("validateChain — valid chain", () => {
  it("trusts a well-formed chain", () => {
    const r = run("valid");
    expect(r.trusted).toBe(true);
    expect(r.failedAt).toBeNull();
    expect(r.steps.every((step) => step.ok)).toBe(true);
  });
});

describe("validateChain — failure scenarios fail at the right step", () => {
  const cases: Array<[ChainScenario, string]> = [
    ["hostname-mismatch", "Hostname matches SAN"],
    ["expired", "Within validity period"],
    ["revoked", "Not revoked"],
    ["missing-intermediate", "Signature chain intact"],
    ["untrusted-root", "Chains to a trusted root"],
  ];

  for (const [scenario, step] of cases) {
    it(`${scenario} → fails at "${step}"`, () => {
      const r = run(scenario);
      expect(r.trusted).toBe(false);
      expect(r.failedAt).toBe(step);
    });
  }
});

describe("validateChain — only the relevant check fails", () => {
  it("a revoked cert still has a valid hostname and intact chain", () => {
    const r = run("revoked");
    const byName = Object.fromEntries(r.steps.map((s) => [s.name, s.ok]));
    expect(byName["Hostname matches SAN"]).toBe(true);
    expect(byName["Signature chain intact"]).toBe(true);
    expect(byName["Not revoked"]).toBe(false);
  });
});
