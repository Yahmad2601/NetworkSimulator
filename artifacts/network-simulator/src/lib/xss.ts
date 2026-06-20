// Pure XSS demo model. Decides whether a payload WOULD execute and whether a
// cookie WOULD be stolen, given the active defenses — the UI only ever *depicts*
// the effect, it never executes anything. No React, so it is unit-testable
// (see xss.test.ts). Educational use only.

/** HTML-escape so a payload renders as inert text. */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** True if the input carries active content (script tag, event handler, or js: URI). */
export function detectScript(input: string): boolean {
  return /<script\b/i.test(input) || /\bon\w+\s*=/i.test(input) || /javascript:/i.test(input);
}

export interface XssDefenses {
  /** Output encoding — render input as text, not HTML. */
  sanitize: boolean;
  /** Content Security Policy — block inline script execution. */
  csp: boolean;
  /** HttpOnly cookie — script can't read document.cookie. */
  httpOnly: boolean;
}

export interface XssOutcome {
  /** What the page would actually render (escaped when sanitized). */
  rendered: string;
  isScript: boolean;
  executes: boolean;
  cookieStolen: boolean;
  /** The defense that stopped the cookie theft, if any. */
  blockedBy: "Output Encoding" | "Content Security Policy" | "HttpOnly Cookie" | null;
}

export function evaluateXss(input: string, defenses: XssDefenses): XssOutcome {
  const isScript = detectScript(input);
  const executes = isScript && !defenses.sanitize && !defenses.csp;
  const cookieStolen = executes && !defenses.httpOnly;

  const blockedBy = !isScript
    ? null
    : defenses.sanitize
      ? "Output Encoding"
      : defenses.csp
        ? "Content Security Policy"
        : defenses.httpOnly
          ? "HttpOnly Cookie"
          : null;

  return {
    rendered: defenses.sanitize ? escapeHtml(input) : input,
    isScript,
    executes,
    cookieStolen,
    blockedBy,
  };
}
