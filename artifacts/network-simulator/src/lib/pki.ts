// Pure PKI / certificate-chain model — builds a chain for a scenario and runs
// the validation pipeline a browser performs. No React, so it is unit-testable
// (see pki.test.ts).

export interface Certificate {
  subject: string;
  issuer: string;
  isCA: boolean;
  notBefore: string;
  notAfter: string;
  san: string[];
  revoked?: boolean;
}

export type ChainScenario =
  | "valid"
  | "expired"
  | "missing-intermediate"
  | "untrusted-root"
  | "hostname-mismatch"
  | "revoked";

export interface ValidationStep {
  name: string;
  ok: boolean;
  detail: string;
}

export interface ValidationResult {
  trusted: boolean;
  steps: ValidationStep[];
  failedAt: string | null;
}

export interface ScenarioInputs {
  chain: Certificate[];
  hostname: string;
  trustedRoots: string[];
  now: Date;
}

const ROOT = "CN=GlobalTech Root CA";
const INTERMEDIATE = "CN=GlobalTech Intermediate CA";
export const NOW = new Date("2026-06-20T00:00:00Z");

function baseChain(): Certificate[] {
  return [
    {
      subject: "CN=example.com",
      issuer: INTERMEDIATE,
      isCA: false,
      notBefore: "2026-01-01",
      notAfter: "2026-12-31",
      san: ["example.com", "www.example.com"],
    },
    { subject: INTERMEDIATE, issuer: ROOT, isCA: true, notBefore: "2024-01-01", notAfter: "2034-01-01", san: [] },
    { subject: ROOT, issuer: ROOT, isCA: true, notBefore: "2020-01-01", notAfter: "2040-01-01", san: [] },
  ];
}

/** Build the chain + connection context for a given scenario. */
export function buildScenario(scenario: ChainScenario): ScenarioInputs {
  const chain = baseChain();
  const base: ScenarioInputs = {
    chain,
    hostname: "example.com",
    trustedRoots: [ROOT],
    now: NOW,
  };

  switch (scenario) {
    case "expired":
      chain[0].notBefore = "2025-01-01";
      chain[0].notAfter = "2025-12-31"; // already lapsed by NOW
      return base;
    case "missing-intermediate":
      return { ...base, chain: [chain[0], chain[2]] }; // intermediate removed
    case "untrusted-root":
      return { ...base, trustedRoots: [] }; // root not in the store
    case "hostname-mismatch":
      chain[0].san = ["another-site.com"];
      return base;
    case "revoked":
      chain[0].revoked = true;
      return base;
    case "valid":
    default:
      return base;
  }
}

function within(now: Date, notBefore: string, notAfter: string): boolean {
  const t = now.getTime();
  return t >= new Date(notBefore).getTime() && t <= new Date(notAfter).getTime();
}

/** Run the browser's chain-validation checks in order. */
export function validateChain({ chain, hostname, trustedRoots, now }: ScenarioInputs): ValidationResult {
  const leaf = chain[0];
  const top = chain[chain.length - 1];

  const chainIntact = chain.every((c, i) => i === chain.length - 1 || c.issuer === chain[i + 1].subject);

  const steps: ValidationStep[] = [
    {
      name: "Hostname matches SAN",
      ok: leaf.san.includes(hostname),
      detail: leaf.san.includes(hostname)
        ? `${hostname} is covered by the certificate`
        : `${hostname} is not in [${leaf.san.join(", ") || "—"}]`,
    },
    {
      name: "Within validity period",
      ok: chain.every((c) => within(now, c.notBefore, c.notAfter)),
      detail: within(now, leaf.notBefore, leaf.notAfter)
        ? `Valid ${leaf.notBefore} → ${leaf.notAfter}`
        : `Expired (valid until ${leaf.notAfter})`,
    },
    {
      name: "Not revoked",
      ok: !leaf.revoked,
      detail: leaf.revoked ? "Listed on the CA's revocation list (CRL/OCSP)" : "No revocation found",
    },
    {
      name: "Signature chain intact",
      ok: chainIntact,
      detail: chainIntact ? "Each certificate is signed by the next" : "A link is missing — issuer not found",
    },
    {
      name: "Chains to a trusted root",
      ok: top.subject === top.issuer && trustedRoots.includes(top.subject),
      detail:
        top.subject === top.issuer && trustedRoots.includes(top.subject)
          ? "Terminates at a root in the trust store"
          : "Root is not trusted by the browser",
    },
  ];

  const failed = steps.find((s) => !s.ok) ?? null;
  return { trusted: !failed, steps, failedAt: failed?.name ?? null };
}
