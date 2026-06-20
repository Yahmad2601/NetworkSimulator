import { useMemo, useState } from "react";
import { Lock, ShieldCheck, ShieldAlert, Award, FileBadge, ArrowDown, RefreshCw } from "lucide-react";
import SimulatorLayout, { FooterControl } from "../../components/SimulatorLayout";
import { buildScenario, validateChain, type ChainScenario, type Certificate } from "../../lib/pki";

const LAYER_COLOR = "#22c55e";

const SCENARIOS: Record<string, ChainScenario> = {
  Valid: "valid",
  Expired: "expired",
  "No Intermediate": "missing-intermediate",
  Untrusted: "untrusted-root",
  Mismatch: "hostname-mismatch",
  Revoked: "revoked",
};

export default function PKICertChain() {
  const [label, setLabel] = useState("Valid");
  const scenario = SCENARIOS[label];

  const inputs = useMemo(() => buildScenario(scenario), [scenario]);
  const result = useMemo(() => validateChain(inputs), [inputs]);

  const reset = () => setLabel("Valid");

  const footerControls: FooterControl[] = [
    {
      key: "scenario",
      type: "segmented",
      options: Object.keys(SCENARIOS),
      value: label,
      onChange: (v) => setLabel(v as string),
    },
    { key: "sp", type: "spacer" },
    {
      key: "reset",
      type: "button",
      label: "Reset",
      variant: "secondary",
      icon: <RefreshCw size={12} />,
      onClick: reset,
    },
  ];

  // Top of the array is the leaf; render the chain root-first (top-down).
  const ordered = [...inputs.chain].reverse();

  const sidebar = (
    <div className="flex flex-col h-full overflow-y-auto logs-scroll p-3 gap-3">
      <div className="glass-panel border border-white/10 bg-[#141b24] p-3 rounded-xl shrink-0">
        <div className="text-[10px] uppercase tracking-widest font-bold mb-2" style={{ color: LAYER_COLOR }}>
          Validation Pipeline
        </div>
        <div className="flex flex-col gap-1.5">
          {result.steps.map((s) => (
            <div
              key={s.name}
              className="rounded-lg border p-2"
              style={{
                borderColor: s.ok ? "#22c55e30" : "#ef444450",
                background: s.ok ? "#22c55e0a" : "#ef44440f",
              }}
            >
              <div className="flex items-center gap-1.5">
                {s.ok ? <ShieldCheck size={12} className="text-green-400 shrink-0" /> : <ShieldAlert size={12} className="text-red-400 shrink-0" />}
                <span className="text-[11px] font-bold" style={{ color: s.ok ? "#86efac" : "#fca5a5" }}>{s.name}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 ml-5 leading-snug">{s.detail}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="glass-panel border border-white/10 bg-[#141b24] p-3 rounded-xl shrink-0">
        <div className="text-[10px] uppercase tracking-widest font-bold mb-2 text-slate-400">Why It Works</div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          The browser trusts a site because its certificate is signed by a chain that ends at a{" "}
          <span className="font-bold" style={{ color: LAYER_COLOR }}>Root CA already in its trust store</span>. Break
          any link — expired, revoked, wrong hostname, missing issuer, untrusted root — and the whole chain of
          trust collapses.
        </p>
      </div>
    </div>
  );

  return (
    <SimulatorLayout
      title="PKI & Certificate Chains"
      subtitle="The Chain of Trust Behind HTTPS"
      layerBadge="SEC"
      layerColor={LAYER_COLOR}
      footerControls={footerControls}
      sidebar={sidebar}
    >
      <div className="h-full flex flex-col p-4 select-none overflow-y-auto logs-scroll text-slate-400 bg-[#0a0e14]">
        {/* Browser address bar */}
        <div className="shrink-0 mb-3 flex items-center gap-2 bg-[#141b24] border rounded-full px-4 py-2"
          style={{ borderColor: result.trusted ? "#22c55e40" : "#ef444440" }}
        >
          {result.trusted ? <Lock size={14} className="text-green-400" /> : <ShieldAlert size={14} className="text-red-400" />}
          <span className="font-mono text-sm" style={{ color: result.trusted ? "#e2e8f0" : "#fca5a5" }}>
            https://{inputs.hostname}
          </span>
          <span className="ml-auto text-[10px] uppercase tracking-widest font-bold" style={{ color: result.trusted ? "#22c55e" : "#ef4444" }}>
            {result.trusted ? "Connection secure" : `Not secure — ${result.failedAt}`}
          </span>
        </div>

        {/* Certificate chain */}
        <div className="flex-1 flex flex-col items-center justify-start gap-0 min-h-0">
          {ordered.map((cert, i) => {
            const isRoot = i === 0;
            const isLeaf = i === ordered.length - 1;
            // Which validation issue applies to this card?
            const cardFailed =
              (isRoot && result.failedAt === "Chains to a trusted root") ||
              (isLeaf && ["Hostname matches SAN", "Within validity period", "Not revoked"].includes(result.failedAt ?? "")) ||
              (!isRoot && result.failedAt === "Signature chain intact");
            const color = cardFailed ? "#ef4444" : isRoot ? "#22c55e" : "#06b6d4";

            return (
              <div key={cert.subject + i} className="flex flex-col items-center w-full max-w-xl">
                <CertCard cert={cert} isRoot={isRoot} isLeaf={isLeaf} color={color} failed={cardFailed} result={result} />
                {!isLeaf && (
                  <div className="flex flex-col items-center py-1">
                    <span className="text-[8px] uppercase tracking-widest text-slate-600">signs</span>
                    <ArrowDown size={16} className={result.failedAt === "Signature chain intact" ? "text-red-400" : "text-slate-600"} />
                  </div>
                )}
              </div>
            );
          })}
          {scenario === "missing-intermediate" && (
            <div className="text-[10px] text-red-400 mt-2 font-mono">⚠ Intermediate CA certificate is missing from the chain</div>
          )}
        </div>
      </div>
    </SimulatorLayout>
  );
}

function CertCard({
  cert,
  isRoot,
  isLeaf,
  color,
  failed,
  result,
}: {
  cert: Certificate;
  isRoot: boolean;
  isLeaf: boolean;
  color: string;
  failed: boolean;
  result: { failedAt: string | null };
}) {
  return (
    <div
      className="w-full rounded-xl border bg-[#141b24] p-3 transition-colors"
      style={{ borderColor: `${color}${failed ? "" : "40"}`, boxShadow: failed ? `0 0 16px ${color}40` : "none" }}
    >
      <div className="flex items-center gap-2 mb-2">
        {isRoot ? <Award size={15} style={{ color }} /> : <FileBadge size={15} style={{ color }} />}
        <span className="text-[11px] uppercase tracking-widest font-bold" style={{ color }}>
          {isRoot ? "Root CA · Trust Anchor" : isLeaf ? "Leaf · Website" : "Intermediate CA"}
        </span>
        {failed && <span className="ml-auto text-[9px] uppercase tracking-widest font-bold text-red-400">✕ {result.failedAt}</span>}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] font-mono">
        <Field label="Subject" value={cert.subject} />
        <Field label="Issuer" value={cert.issuer} />
        <Field label="Valid from" value={cert.notBefore} />
        <Field label="Valid to" value={cert.notAfter} bad={isLeaf && result.failedAt === "Within validity period"} />
        {isLeaf && <Field label="SAN" value={cert.san.join(", ") || "—"} bad={result.failedAt === "Hostname matches SAN"} />}
        {isLeaf && cert.revoked && <Field label="Status" value="REVOKED" bad />}
      </div>
    </div>
  );
}

function Field({ label, value, bad }: { label: string; value: string; bad?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="text-[8px] uppercase tracking-widest text-slate-500">{label}</span>
      <span className="break-all" style={{ color: bad ? "#ef4444" : "#cbd5e1" }}>{value}</span>
    </div>
  );
}
