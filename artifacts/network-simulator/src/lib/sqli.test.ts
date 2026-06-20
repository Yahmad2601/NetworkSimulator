import { describe, it, expect } from "vitest";
import { detectInjection, evaluateLogin, buildConcatQuery } from "./sqli";

describe("detectInjection", () => {
  it("flags tautology and comment payloads", () => {
    expect(detectInjection("' OR '1'='1' --")).toBe(true);
    expect(detectInjection("admin'--")).toBe(true);
    expect(detectInjection("' OR 1=1 #")).toBe(true);
  });

  it("does not flag ordinary input or legitimate apostrophes", () => {
    expect(detectInjection("alice")).toBe(false);
    expect(detectInjection("S3cr3t!")).toBe(false);
    expect(detectInjection("O'Brien")).toBe(false);
  });
});

describe("evaluateLogin — vulnerable concatenation", () => {
  it("authenticates a genuine user", () => {
    const r = evaluateLogin("admin", "S3cr3t!", false);
    expect(r.authenticated).toBe(true);
    expect(r.injected).toBe(false);
    expect(r.matchedUser).toBe("admin");
  });

  it("rejects a wrong password", () => {
    const r = evaluateLogin("admin", "guess", false);
    expect(r.authenticated).toBe(false);
    expect(r.rowsReturned).toBe(0);
  });

  it("is bypassed by a tautology injection (returns every row)", () => {
    const r = evaluateLogin("' OR '1'='1' --", "", false);
    expect(r.injected).toBe(true);
    expect(r.authenticated).toBe(true);
    expect(r.rowsReturned).toBe(2);
    expect(r.query).toContain("OR '1'='1'");
  });

  it("is bypassed by commenting out the password check", () => {
    const r = evaluateLogin("admin'--", "anything", false);
    expect(r.injected).toBe(true);
    expect(r.authenticated).toBe(true);
    expect(r.matchedUser).toBe("admin");
  });
});

describe("evaluateLogin — parameterized", () => {
  it("treats the injection as a literal username, so it fails", () => {
    const r = evaluateLogin("' OR '1'='1' --", "", true);
    expect(r.injected).toBe(false);
    expect(r.authenticated).toBe(false);
    expect(r.query).toContain("?");
  });

  it("still authenticates a genuine user", () => {
    const r = evaluateLogin("admin", "S3cr3t!", true);
    expect(r.authenticated).toBe(true);
  });
});

describe("buildConcatQuery", () => {
  it("interpolates the raw input into the SQL string", () => {
    expect(buildConcatQuery("admin", "pw")).toBe(
      "SELECT * FROM users WHERE username='admin' AND password='pw'",
    );
  });
});
