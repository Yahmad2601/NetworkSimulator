import { describe, it, expect } from "vitest";
import { computeImpact } from "./ddos";

describe("computeImpact — baseline", () => {
  it("is idle with no bots", () => {
    const r = computeImpact("syn-flood", 0, []);
    expect(r.serverLoad).toBe(0);
    expect(r.legitSuccess).toBe(100);
    expect(r.state).toBe("NORMAL");
  });

  it("saturates the server under a full unmitigated attack", () => {
    const r = computeImpact("syn-flood", 1000, []);
    expect(r.state).toBe("SATURATED");
    expect(r.serverLoad).toBeGreaterThanOrEqual(90);
    expect(r.legitSuccess).toBe(0);
  });
});

describe("computeImpact — effective mitigations", () => {
  it("SYN cookies rescue a SYN flood", () => {
    const before = computeImpact("syn-flood", 1000, []);
    const after = computeImpact("syn-flood", 1000, ["syn-cookies"]);
    expect(after.serverLoad).toBeLessThan(before.serverLoad);
    expect(after.legitSuccess).toBeGreaterThan(before.legitSuccess);
    expect(after.appliedMitigations).toContain("syn-cookies");
  });

  it("scrubbing helps against amplification", () => {
    const after = computeImpact("udp-amplification", 1000, ["scrubbing", "rate-limit"]);
    expect(after.state).not.toBe("SATURATED");
    expect(after.legitSuccess).toBeGreaterThan(0);
  });

  it("a WAF absorbs an HTTP flood", () => {
    const before = computeImpact("http-flood", 1000, []);
    const after = computeImpact("http-flood", 1000, ["waf"]);
    expect(after.serverLoad).toBeLessThan(before.serverLoad);
  });
});

describe("computeImpact — wrong mitigation does nothing", () => {
  it("SYN cookies don't help against amplification", () => {
    const none = computeImpact("udp-amplification", 800, []);
    const wrong = computeImpact("udp-amplification", 800, ["syn-cookies"]);
    expect(wrong.serverLoad).toBe(none.serverLoad);
    expect(wrong.appliedMitigations).toHaveLength(0);
  });

  it("a WAF doesn't help against a SYN flood", () => {
    const none = computeImpact("syn-flood", 800, []);
    const wrong = computeImpact("syn-flood", 800, ["waf"]);
    expect(wrong.serverLoad).toBe(none.serverLoad);
  });
});
