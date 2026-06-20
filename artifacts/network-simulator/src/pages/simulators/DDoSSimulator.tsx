import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Server as ServerIcon, ShieldCheck, Users, RefreshCw, Bot } from "lucide-react";
import SimulatorLayout, { FooterControl } from "../../components/SimulatorLayout";
import { computeImpact, ATTACKS, MITIGATIONS, type AttackType, type Mitigation } from "../../lib/ddos";

const STATE_COLOR = { NORMAL: "#22c55e", DEGRADED: "#f59e0b", SATURATED: "#ef4444" } as const;
const ATTACK_LABELS: Record<string, AttackType> = {
  "SYN Flood": "syn-flood",
  "Amplification": "udp-amplification",
  "HTTP Flood": "http-flood",
};

export default function DDoSSimulator() {
  const [attackLabel, setAttackLabel] = useState("SYN Flood");
  const [bots, setBots] = useState(700);
  const [mitigations, setMitigations] = useState<Mitigation[]>([]);

  const attack = ATTACK_LABELS[attackLabel];
  const profile = ATTACKS.find((a) => a.id === attack)!;
  const impact = useMemo(() => computeImpact(attack, bots, mitigations), [attack, bots, mitigations]);
  const stateColor = STATE_COLOR[impact.state];
  const shielded = impact.appliedMitigations.length > 0;

  const toggleMitigation = (m: Mitigation) =>
    setMitigations((cur) => (cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m]));

  const reset = () => {
    setAttackLabel("SYN Flood");
    setBots(700);
    setMitigations([]);
  };

  const footerControls: FooterControl[] = [
    {
      key: "attack",
      type: "segmented",
      options: Object.keys(ATTACK_LABELS),
      value: attackLabel,
      onChange: (v) => setAttackLabel(v as string),
    },
    { key: "sp1", type: "spacer" },
    { key: "bots", type: "slider", label: "Botnet size", min: 0, max: 1000, step: 50, value: bots, onChange: (v) => setBots(v as number) },
    { key: "sp2", type: "spacer" },
    { key: "reset", type: "button", label: "Reset", variant: "secondary", icon: <RefreshCw size={12} />, onClick: reset },
  ];

  // Visual traffic density scales with the (mitigated) attack load.
  const redCount = Math.min(16, Math.round(impact.mitigatedLoad / 7));
  const greenSuccess = Math.round((impact.legitSuccess / 100) * 4);

  const sidebar = (
    <div className="flex flex-col h-full overflow-y-auto logs-scroll p-3 gap-3">
      <div className="glass-panel border border-white/10 bg-[#141b24] p-3 rounded-xl shrink-0">
        <div className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: "#ef4444" }}>
          {profile.name} · {profile.category}
        </div>
        <div className="text-[10px] text-slate-500 mb-2">Exhausts: <span className="text-slate-300 font-mono">{profile.resource}</span></div>
        <p className="text-[11px] text-slate-300 leading-relaxed">{profile.description}</p>
      </div>

      <div className="glass-panel border border-white/10 bg-[#141b24] p-3 rounded-xl shrink-0">
        <div className="text-[10px] uppercase tracking-widest font-bold mb-2 text-slate-400">Mitigations</div>
        <div className="flex flex-col gap-1.5">
          {MITIGATIONS.map((m) => {
            const active = mitigations.includes(m.id);
            const effective = profile.effectiveMitigations.includes(m.id);
            return (
              <div key={m.id} className="text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold" style={{ color: active ? (effective ? "#22c55e" : "#f59e0b") : "#94a3b8" }}>{m.name}</span>
                  {active && !effective && <span className="text-[9px] text-amber-400 uppercase tracking-widest">no effect here</span>}
                </div>
                <div className="text-[10px] text-slate-500">{m.note}</div>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">A mitigation only helps against the attacks it's designed for — match the defense to the threat.</p>
      </div>
    </div>
  );

  return (
    <SimulatorLayout
      title="DDoS & Mitigation"
      subtitle="Exhausting a Server's Finite Resources"
      layerBadge="SEC"
      layerColor="#ef4444"
      footerControls={footerControls}
      sidebar={sidebar}
    >
      <div className="h-full flex flex-col p-4 select-none overflow-hidden text-slate-400 bg-[#0a0e14]">
        {/* Status metrics */}
        <div className="grid grid-cols-3 gap-3 shrink-0 mb-3">
          {[
            { label: "ATTACK", value: profile.name, color: "#ef4444" },
            { label: "SERVER LOAD", value: `${impact.serverLoad}%`, color: stateColor },
            { label: "LEGIT SUCCESS", value: `${impact.legitSuccess}%`, color: impact.legitSuccess > 60 ? "#22c55e" : impact.legitSuccess > 20 ? "#f59e0b" : "#ef4444" },
          ].map((item) => (
            <div key={item.label} className="glass-panel border border-white/5 bg-[#141b24] p-3 rounded-xl shadow-lg flex flex-col items-center">
              <div className="text-[10px] uppercase tracking-widest mb-1">{item.label}</div>
              <div className="font-mono font-bold text-lg" style={{ color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Mitigation toggles */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 mb-3">
          <span className="text-[10px] uppercase tracking-widest text-slate-500 mr-1">Mitigations:</span>
          {MITIGATIONS.map((m) => {
            const active = mitigations.includes(m.id);
            const effective = profile.effectiveMitigations.includes(m.id);
            const c = active ? (effective ? "#22c55e" : "#f59e0b") : "#64748b";
            return (
              <button
                key={m.id}
                onClick={() => toggleMitigation(m.id)}
                className="px-3 py-1.5 rounded-full border text-[11px] font-semibold uppercase tracking-widest transition-colors"
                style={{ borderColor: active ? c : "rgba(255,255,255,0.1)", background: active ? `${c}15` : "transparent", color: c }}
              >
                {active ? "✓ " : "✕ "}
                {m.name}
              </button>
            );
          })}
        </div>

        {/* Battlefield */}
        <div className="flex-1 relative border border-white/5 rounded-xl bg-[#0c1219] shadow-[inset_0_0_30px_rgba(0,0,0,0.4)] overflow-hidden flex items-center min-h-0">
          {/* Botnet */}
          <div className="relative z-10 w-44 shrink-0 flex flex-col items-center gap-2 pl-4">
            <div className="grid grid-cols-4 gap-1">
              {Array.from({ length: 16 }).map((_, i) => (
                <Bot key={i} size={14} className="text-red-500" style={{ opacity: i < Math.round((bots / 1000) * 16) ? 0.9 : 0.15 }} />
              ))}
            </div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-red-400">Botnet</span>
            <span className="text-[10px] font-mono text-slate-500">{bots} bots</span>
          </div>

          {/* Lane */}
          <div className="flex-1 relative h-full">
            {/* attack packets */}
            {Array.from({ length: redCount }).map((_, i) => (
              <motion.span
                key={`r-${i}`}
                className="absolute w-1.5 h-1.5 rounded-full bg-red-500"
                style={{ top: `${20 + ((i * 37) % 60)}%`, filter: "drop-shadow(0 0 3px #ef4444)" }}
                initial={{ left: "0%" }}
                animate={{ left: shielded ? "48%" : "100%", opacity: shielded ? [1, 1, 0] : [0.3, 1, 1] }}
                transition={{ duration: shielded ? 1 : 1.4, repeat: Infinity, ease: "linear", delay: (i % 8) * 0.16 }}
              />
            ))}
            {/* legit users */}
            {Array.from({ length: 4 }).map((_, i) => {
              const ok = i < greenSuccess;
              return (
                <motion.span
                  key={`g-${i}`}
                  className="absolute w-2 h-2 rounded-full bg-green-400"
                  style={{ top: `${30 + i * 12}%`, filter: "drop-shadow(0 0 3px #22c55e)" }}
                  initial={{ left: "0%" }}
                  animate={{ left: ok ? "100%" : "55%", opacity: ok ? [0.5, 1, 1] : [0.6, 0.6, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "linear", delay: i * 0.4 }}
                />
              );
            })}

            {/* Mitigation shield */}
            {shielded && (
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center">
                <div className="w-1 h-3/4 rounded-full bg-cyan-400/40" style={{ boxShadow: "0 0 14px rgba(6,182,212,0.6)" }} />
                <ShieldCheck size={18} className="text-cyan-400 absolute" />
                <div className="absolute -bottom-1 text-[8px] uppercase tracking-widest text-cyan-400 font-bold whitespace-nowrap">
                  {impact.appliedMitigations.length} active
                </div>
              </div>
            )}
          </div>

          {/* Target server */}
          <div className="relative z-10 w-52 shrink-0 flex flex-col items-center gap-2 pr-4">
            <div
              className="w-20 h-20 rounded-2xl border-4 flex items-center justify-center bg-[#141b24] transition-colors duration-300"
              style={{ borderColor: stateColor, boxShadow: `0 0 24px ${stateColor}${impact.state === "SATURATED" ? "88" : "44"}`, animation: impact.state === "SATURATED" ? "threat-blink 1s ease-in-out infinite" : undefined }}
            >
              <ServerIcon size={34} style={{ color: stateColor }} />
            </div>
            <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: stateColor }}>{impact.state}</span>

            {/* Gauges */}
            <div className="w-full flex flex-col gap-2 mt-1">
              <Gauge label={profile.resource} value={impact.serverLoad} color={stateColor} icon={<ServerIcon size={10} />} />
              <Gauge label="Legit users served" value={impact.legitSuccess} color={impact.legitSuccess > 60 ? "#22c55e" : impact.legitSuccess > 20 ? "#f59e0b" : "#ef4444"} icon={<Users size={10} />} />
            </div>
          </div>
        </div>
      </div>
    </SimulatorLayout>
  );
}

function Gauge({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-0.5">
        <span className="flex items-center gap-1 text-[8px] uppercase tracking-widest text-slate-500">{icon}{label}</span>
        <span className="text-[9px] font-mono font-bold" style={{ color }}>{value}%</span>
      </div>
      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}
