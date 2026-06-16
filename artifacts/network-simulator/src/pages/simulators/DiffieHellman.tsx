import { useMemo, useState } from "react";
import { User, Eye, Lock, Shield, ArrowRight, ArrowLeft, RefreshCw, KeyRound } from "lucide-react";
import SimulatorLayout, { FooterControl } from "../../components/SimulatorLayout";
import { computeExchange } from "../../lib/dh";

const LAYER_COLOR = "#a855f7";
const ALICE = "#06b6d4";
const BOB = "#a855f7";
const EVE = "#ef4444";
const PUBLIC = "#f59e0b";
const SHARED = "#22c55e";

const PRESETS = [
  { label: "g=5, p=23", g: 5, p: 23 },
  { label: "g=2, p=11", g: 2, p: 11 },
  { label: "g=3, p=17", g: 3, p: 17 },
];

export default function DiffieHellman() {
  const [presetLabel, setPresetLabel] = useState(PRESETS[0].label);
  const [a, setA] = useState(6);
  const [b, setB] = useState(15);

  const preset = PRESETS.find((p) => p.label === presetLabel) ?? PRESETS[0];
  const { g, p } = preset;

  const ex = useMemo(() => computeExchange(g, p, a, b), [g, p, a, b]);

  const changePreset = (label: string) => {
    const next = PRESETS.find((pr) => pr.label === label) ?? PRESETS[0];
    setPresetLabel(label);
    // Keep secrets within range for the new modulus.
    setA((v) => Math.min(Math.max(1, v), next.p - 1));
    setB((v) => Math.min(Math.max(1, v), next.p - 1));
  };

  const reset = () => {
    setPresetLabel(PRESETS[0].label);
    setA(6);
    setB(15);
  };

  const footerControls: FooterControl[] = [
    {
      key: "params",
      type: "segmented",
      options: PRESETS.map((pr) => pr.label),
      value: presetLabel,
      onChange: (v) => changePreset(v as string),
    },
    { key: "sp1", type: "spacer" },
    {
      key: "a",
      type: "slider",
      label: "Alice secret a",
      min: 1,
      max: p - 1,
      step: 1,
      value: a,
      onChange: (v) => setA(v as number),
    },
    {
      key: "b",
      type: "slider",
      label: "Bob secret b",
      min: 1,
      max: p - 1,
      step: 1,
      value: b,
      onChange: (v) => setB(v as number),
    },
    { key: "sp2", type: "spacer" },
    {
      key: "reset",
      type: "button",
      label: "Reset",
      variant: "secondary",
      icon: <RefreshCw size={12} />,
      onClick: reset,
    },
  ];

  // Step-by-step derivation for the sidebar.
  const steps: Array<{ text: string; color: string }> = [
    { text: `Public parameters: g = ${g}, p = ${p}`, color: PUBLIC },
    { text: `Alice keeps a = ${a} secret`, color: EVE },
    { text: `Bob keeps b = ${b} secret`, color: EVE },
    { text: `Alice → A = ${g}^${a} mod ${p} = ${ex.aPublic}`, color: ALICE },
    { text: `Bob → B = ${g}^${b} mod ${p} = ${ex.bPublic}`, color: BOB },
    { text: `Exchange A and B over the open channel (Eve sees both)`, color: PUBLIC },
    { text: `Alice computes B^a mod p = ${ex.bPublic}^${a} mod ${p} = ${ex.aShared}`, color: SHARED },
    { text: `Bob computes A^b mod p = ${ex.aPublic}^${b} mod ${p} = ${ex.bShared}`, color: SHARED },
    { text: `Shared secret = ${ex.shared} — identical, and never transmitted`, color: SHARED },
  ];

  const sidebar = (
    <div className="flex flex-col h-full overflow-y-auto logs-scroll p-3 gap-3">
      <div className="glass-panel border border-white/10 bg-[#141b24] p-3 rounded-xl shrink-0">
        <div className="text-[10px] uppercase tracking-widest font-bold mb-2" style={{ color: LAYER_COLOR }}>
          Derivation
        </div>
        <ol className="flex flex-col gap-1.5">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-2 text-[11px] leading-snug">
              <span className="text-slate-600 font-mono shrink-0">{i + 1}.</span>
              <span className="font-mono break-all" style={{ color: s.color }}>
                {s.text}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="glass-panel border border-red-500/20 bg-red-500/5 p-3 rounded-xl shrink-0">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Eye size={12} className="text-red-400" />
          <span className="text-[10px] uppercase tracking-widest font-bold text-red-400">
            Eve's Problem
          </span>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          Eve sees <span className="font-mono text-amber-300">g, p, A={ex.aPublic}, B={ex.bPublic}</span> —
          everything except the secrets. To find the shared key she'd have to recover{" "}
          <span className="font-mono">a</span> or <span className="font-mono">b</span> by solving the{" "}
          <span className="font-bold text-red-300">discrete logarithm</span>. Trivial for p=23, but
          infeasible for the 2048-bit+ primes used in practice.
        </p>
      </div>
    </div>
  );

  return (
    <SimulatorLayout
      title="Diffie–Hellman Key Exchange"
      subtitle="A Shared Secret Over a Public Channel"
      layerBadge="DH"
      layerColor={LAYER_COLOR}
      footerControls={footerControls}
      sidebar={sidebar}
    >
      <div className="h-full flex flex-col p-4 select-none overflow-hidden text-slate-400 bg-[#0a0e14]">
        {/* Status metrics */}
        <div className="grid grid-cols-3 gap-3 shrink-0 mb-3">
          {[
            { label: "PUBLIC PARAMS", value: `g=${g}, p=${p}`, color: PUBLIC },
            { label: "SHARED SECRET", value: String(ex.shared), color: SHARED },
            { label: "SECRET TRANSMITTED?", value: "Never", color: SHARED },
          ].map((item) => (
            <div
              key={item.label}
              className="glass-panel border border-white/5 bg-[#141b24] p-3 rounded-xl shadow-lg flex flex-col items-center"
            >
              <div className="text-[10px] uppercase tracking-widest mb-1">{item.label}</div>
              <div className="font-mono font-bold text-lg" style={{ color: item.color }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {/* Stage */}
        <div className="flex-1 relative border border-white/5 rounded-xl bg-[#0c1219] shadow-[inset_0_0_30px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden">
          {/* Public params banner */}
          <div className="shrink-0 flex items-center justify-center gap-2 py-2 border-b border-white/5">
            <span className="text-[9px] uppercase tracking-widest text-slate-500">Public &amp; visible to all:</span>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded" style={{ color: PUBLIC, background: `${PUBLIC}15` }}>
              g = {g}
            </span>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded" style={{ color: PUBLIC, background: `${PUBLIC}15` }}>
              p = {p}
            </span>
          </div>

          {/* Alice · public channel (with Eve on the wire) · Bob */}
          <div className="flex-1 flex items-center justify-between px-8 gap-4">
            <Party
              name="Alice"
              color={ALICE}
              secretLabel="a"
              secret={a}
              publicLabel="A"
              publicVal={ex.aPublic}
              g={g}
              p={p}
              sharedExpr={`B^a = ${ex.bPublic}^${a} mod ${p}`}
              shared={ex.aShared}
            />

            {/* Public channel + eavesdropper */}
            <div className="flex-1 flex flex-col items-center justify-center gap-4 max-w-md">
              <div className="w-full flex flex-col gap-3">
                <ExchangeArrow dir="right" label={`A = ${ex.aPublic}`} color={ALICE} />
                <ExchangeArrow dir="left" label={`B = ${ex.bPublic}`} color={BOB} />
              </div>

              <div
                className="w-full glass-panel border rounded-xl p-3"
                style={{ borderColor: `${EVE}40`, background: `${EVE}0d` }}
              >
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Eye size={13} style={{ color: EVE }} />
                  <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: EVE }}>
                    Eve · Eavesdropper
                  </span>
                </div>
                <div className="text-[10px] font-mono text-center text-slate-400">
                  sees A={ex.aPublic}, B={ex.bPublic}, g={g}, p={p}
                </div>
                <div className="text-[11px] font-mono font-bold text-center mt-1" style={{ color: EVE }}>
                  shared = ??? (discrete log)
                </div>
              </div>
            </div>

            <Party
              name="Bob"
              color={BOB}
              secretLabel="b"
              secret={b}
              publicLabel="B"
              publicVal={ex.bPublic}
              g={g}
              p={p}
              sharedExpr={`A^b = ${ex.aPublic}^${b} mod ${p}`}
              shared={ex.bShared}
              mirror
            />
          </div>

          {/* Shared secret result */}
          <div className="shrink-0 m-3 mt-0 rounded-xl border p-3 flex items-center justify-center gap-4" style={{ borderColor: `${SHARED}40`, background: `${SHARED}10` }}>
            <Shield size={18} style={{ color: SHARED }} />
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-0.5">
                Both sides independently computed the same value
              </div>
              <div className="font-mono font-bold text-lg" style={{ color: SHARED }}>
                Shared Secret = {ex.shared}
                {ex.agree && <span className="ml-2 text-[11px] uppercase tracking-widest">✓ match</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SimulatorLayout>
  );
}

function Party(props: {
  name: string;
  color: string;
  secretLabel: string;
  secret: number;
  publicLabel: string;
  publicVal: number;
  g: number;
  p: number;
  sharedExpr: string;
  shared: number;
  mirror?: boolean;
}) {
  return (
    <div className="relative z-10 flex flex-col items-center gap-3 w-52 shrink-0">
      <div
        className="w-20 h-20 rounded-full border-4 flex items-center justify-center bg-[#141b24] shadow-xl"
        style={{ borderColor: props.color, boxShadow: `0 0 20px ${props.color}40` }}
      >
        <User size={34} style={{ color: props.color }} />
      </div>
      <span className="text-[12px] uppercase tracking-widest font-bold text-white">{props.name}</span>

      <div className="w-full flex flex-col gap-2">
        {/* Private secret */}
        <div className="rounded-lg border p-2 flex items-center justify-between" style={{ borderColor: `${EVE}30`, background: `${EVE}0d` }}>
          <span className="flex items-center gap-1 text-[9px] uppercase tracking-widest" style={{ color: EVE }}>
            <Lock size={10} /> Private {props.secretLabel}
          </span>
          <span className="font-mono font-bold text-sm" style={{ color: EVE }}>{props.secret}</span>
        </div>

        {/* Public value */}
        <div className="rounded-lg border p-2" style={{ borderColor: `${props.color}40`, background: `${props.color}0d` }}>
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-widest" style={{ color: props.color }}>
              Public {props.publicLabel} (sent)
            </span>
            <span className="font-mono font-bold text-sm" style={{ color: props.color }}>{props.publicVal}</span>
          </div>
          <div className="text-[9px] font-mono text-slate-600 mt-0.5">
            {props.g}^{props.secretLabel} mod {props.p}
          </div>
        </div>

        {/* Computed shared */}
        <div className="rounded-lg border p-2" style={{ borderColor: `${SHARED}40`, background: `${SHARED}0d` }}>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-[9px] uppercase tracking-widest" style={{ color: SHARED }}>
              <KeyRound size={10} /> Shared
            </span>
            <span className="font-mono font-bold text-sm" style={{ color: SHARED }}>{props.shared}</span>
          </div>
          <div className="text-[9px] font-mono text-slate-600 mt-0.5 break-all">{props.sharedExpr}</div>
        </div>
      </div>
    </div>
  );
}

function ExchangeArrow({ dir, label, color }: { dir: "left" | "right"; label: string; color: string }) {
  return (
    <div className="w-full flex items-center gap-2">
      {dir === "left" && <ArrowLeft size={16} style={{ color }} className="shrink-0" />}
      <div className="flex-1 h-px" style={{ background: `${color}55` }} />
      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded shrink-0" style={{ color, background: `${color}15` }}>
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: `${color}55` }} />
      {dir === "right" && <ArrowRight size={16} style={{ color }} className="shrink-0" />}
    </div>
  );
}
