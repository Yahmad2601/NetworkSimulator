import { useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw, ShieldOff, Crown } from "lucide-react";
import SimulatorLayout, { FooterControl } from "../../components/SimulatorLayout";
import {
  computeStp,
  DEFAULT_SWITCHES,
  DEFAULT_LINKS,
  type PortRole,
} from "../../lib/stp";

const LAYER_COLOR = "#f59e0b";
const ROLE_COLOR: Record<PortRole, string> = {
  root: "#22c55e",
  designated: "#06b6d4",
  blocking: "#ef4444",
};
const ROLE_ABBR: Record<PortRole, string> = { root: "RP", designated: "DP", blocking: "✕" };
const PORT_STATES = ["Blocking", "Listening", "Learning", "Forwarding"] as const;

const POS: Record<string, { x: number; y: number }> = {
  S1: { x: 400, y: 90 },
  S2: { x: 180, y: 320 },
  S3: { x: 620, y: 320 },
};

const FAIL_OPTIONS: Record<string, string | null> = {
  None: null,
  "S1–S2": "L12",
  "S1–S3": "L13",
  "S2–S3": "L23",
};

function pointAlong(a: { x: number; y: number }, b: { x: number; y: number }, t: number, perp = 0) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: a.x + dx * t - (dy / len) * perp, y: a.y + dy * t + (dx / len) * perp };
}

export default function STPSimulator() {
  const [failLabel, setFailLabel] = useState("None");
  const [noStp, setNoStp] = useState(false);
  const [convergeStep, setConvergeStep] = useState(3);
  const [stormCount, setStormCount] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const failedLinkId = FAIL_OPTIONS[failLabel] ?? null;
  const activeLinks = useMemo(() => DEFAULT_LINKS.filter((l) => l.id !== failedLinkId), [failedLinkId]);
  const stp = useMemo(() => computeStp(DEFAULT_SWITCHES, activeLinks), [activeLinks]);
  const byId = Object.fromEntries(DEFAULT_SWITCHES.map((s) => [s.id, s]));

  const blockedPorts = stp.ports.filter((p) => p.role === "blocking");
  const converged = convergeStep >= 3;

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  // Animate the port-state convergence whenever the topology changes.
  useEffect(() => {
    if (noStp) return;
    clearTimers();
    setConvergeStep(0);
    [1, 2, 3].forEach((step) => {
      timers.current.push(setTimeout(() => setConvergeStep(step), step * 650));
    });
    return clearTimers;
  }, [activeLinks, noStp]);

  // Broadcast storm counter while STP is disabled.
  useEffect(() => {
    if (!noStp) return;
    setStormCount(0);
    const iv = setInterval(() => setStormCount((c) => c + Math.floor(Math.random() * 40 + 20)), 120);
    return () => clearInterval(iv);
  }, [noStp]);

  const portState = (role: PortRole): string =>
    role === "blocking" ? "Blocking" : PORT_STATES[convergeStep];

  const reset = () => {
    setFailLabel("None");
    setNoStp(false);
  };

  const footerControls: FooterControl[] = [
    {
      key: "nostp",
      type: "toggle",
      label: "Disable STP",
      value: noStp,
      onChange: (v) => setNoStp(v as boolean),
      icon: <ShieldOff size={12} />,
    },
    { key: "sp1", type: "spacer" },
    {
      key: "fail",
      type: "segmented",
      options: Object.keys(FAIL_OPTIONS),
      value: failLabel,
      onChange: (v) => setFailLabel(v as string),
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

  const sidebar = (
    <div className="flex flex-col h-full overflow-y-auto logs-scroll p-3 gap-3">
      <div className="glass-panel border border-white/10 bg-[#141b24] p-3 rounded-xl shrink-0">
        <div className="text-[10px] uppercase tracking-widest font-bold mb-2" style={{ color: LAYER_COLOR }}>
          How STP Breaks Loops
        </div>
        <ol className="flex flex-col gap-1.5 text-[11px] text-slate-300 leading-relaxed list-decimal list-inside">
          <li>Elect the <span className="font-bold">root bridge</span> — lowest Bridge ID (priority, then MAC).</li>
          <li>Each other switch picks a <span style={{ color: ROLE_COLOR.root }} className="font-bold">Root Port</span> — lowest path cost to root.</li>
          <li>Each link picks a <span style={{ color: ROLE_COLOR.designated }} className="font-bold">Designated Port</span>; the leftover port <span style={{ color: ROLE_COLOR.blocking }} className="font-bold">Blocks</span>, breaking the loop.</li>
        </ol>
      </div>

      <div className="glass-panel border border-white/10 bg-[#141b24] p-3 rounded-xl shrink-0">
        <div className="text-[10px] uppercase tracking-widest font-bold mb-2 text-slate-400">Path Costs (802.1D)</div>
        <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono text-slate-300">
          <span>10 Gbps → 2</span>
          <span>1 Gbps → 4</span>
          <span>100 Mbps → 19</span>
          <span>10 Mbps → 100</span>
        </div>
      </div>

      <div className="glass-panel border border-white/10 bg-[#141b24] p-3 rounded-xl shrink-0">
        <div className="text-[10px] uppercase tracking-widest font-bold mb-2 text-slate-400">Port States</div>
        <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 flex-wrap">
          {PORT_STATES.map((s, i) => (
            <span key={s} className="flex items-center gap-1">
              <span style={{ color: i === convergeStep && !noStp ? LAYER_COLOR : "#64748b" }}>{s}</span>
              {i < PORT_STATES.length - 1 && <span className="text-slate-600">→</span>}
            </span>
          ))}
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed mt-2">
          Forwarding ports pass through Listening (15s) and Learning (15s) before forwarding — classic
          802.1D takes ~30–50s to converge.
        </p>
      </div>
    </div>
  );

  const trianglePath = `M ${POS.S1.x} ${POS.S1.y} L ${POS.S2.x} ${POS.S2.y} L ${POS.S3.x} ${POS.S3.y} Z`;

  return (
    <SimulatorLayout
      title="Spanning Tree Protocol"
      subtitle="Breaking Switching Loops (802.1D)"
      layerBadge="L2"
      layerColor={LAYER_COLOR}
      footerControls={footerControls}
      sidebar={sidebar}
    >
      <div className="h-full flex flex-col p-4 select-none overflow-hidden text-slate-400 bg-[#0a0e14]">
        {/* Status metrics */}
        <div className="grid grid-cols-3 gap-3 shrink-0 mb-3">
          {[
            { label: "ROOT BRIDGE", value: noStp ? "—" : `${stp.rootId} · pri ${byId[stp.rootId].priority}`, color: noStp ? "#64748b" : "#22c55e" },
            {
              label: "BLOCKED PORT",
              value: noStp ? "NONE!" : blockedPorts.length ? `${blockedPorts[0].switchId} · ${blockedPorts[0].linkId}` : "none",
              color: noStp ? "#ef4444" : blockedPorts.length ? ROLE_COLOR.blocking : "#64748b",
            },
            {
              label: "STATE",
              value: noStp ? "Broadcast Storm" : converged ? "Forwarding" : "Converging…",
              color: noStp ? "#ef4444" : converged ? "#22c55e" : LAYER_COLOR,
            },
          ].map((item) => (
            <div key={item.label} className="glass-panel border border-white/5 bg-[#141b24] p-3 rounded-xl shadow-lg flex flex-col items-center">
              <div className="text-[10px] uppercase tracking-widest mb-1">{item.label}</div>
              <div className="font-mono font-bold text-base" style={{ color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Topology */}
        <div className="flex-1 relative border rounded-xl bg-[#0c1219] shadow-[inset_0_0_30px_rgba(0,0,0,0.4)] overflow-hidden min-h-0"
          style={{ borderColor: noStp ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.05)" }}
        >
          {noStp && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 rounded-full border border-red-500/40 bg-red-500/15 flex items-center gap-2">
              <span className="text-red-400 uppercase tracking-widest font-bold text-xs animate-pulse">⚠ Broadcast Storm</span>
              <span className="font-mono text-red-300 text-xs">{stormCount.toLocaleString()} frames/s ↑</span>
            </div>
          )}

          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 410" preserveAspectRatio="xMidYMid meet">
            {/* Links */}
            {DEFAULT_LINKS.map((l) => {
              const a = POS[l.a];
              const b = POS[l.b];
              const failed = l.id === failedLinkId;
              const hasBlock = !noStp && stp.ports.some((p) => p.linkId === l.id && p.role === "blocking");
              const color = failed
                ? "#475569"
                : noStp
                  ? "#ef4444"
                  : hasBlock
                    ? "#ef4444"
                    : converged
                      ? "#22c55e"
                      : LAYER_COLOR;
              const mid = pointAlong(a, b, 0.5);
              return (
                <g key={l.id}>
                  <line
                    x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                    stroke={color}
                    strokeWidth={3}
                    strokeOpacity={failed ? 0.3 : 0.5}
                    strokeDasharray={failed ? "4 6" : hasBlock ? "8 8" : undefined}
                  />
                  {(noStp || (!failed && !hasBlock && converged)) && (
                    <line
                      x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                      stroke={color} strokeWidth={3} strokeOpacity={0.9} strokeDasharray="6 10"
                      style={{ animation: `dash-flow ${noStp ? "0.4s" : "1.2s"} linear infinite` }}
                    />
                  )}
                  <text x={mid.x} y={mid.y - 8} fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="monospace">
                    {failed ? "DOWN" : `cost ${l.cost}`}
                  </text>
                </g>
              );
            })}

            {/* Storm packets looping the triangle */}
            {noStp &&
              [0, 0.33, 0.66].map((begin, i) => (
                <circle key={i} r={5} fill="#ef4444">
                  <animateMotion dur="1.4s" repeatCount="indefinite" path={trianglePath} begin={`${begin * 1.4}s`} />
                </circle>
              ))}

            {/* Port role badges */}
            {!noStp &&
              stp.ports.map((p) => {
                const a = POS[p.switchId];
                const b = POS[p.neighborId];
                const pt = pointAlong(a, b, 0.26, 16);
                const color = ROLE_COLOR[p.role];
                return (
                  <g key={`${p.switchId}-${p.linkId}`} transform={`translate(${pt.x}, ${pt.y})`}>
                    <rect x={-13} y={-9} width={26} height={18} rx={5} fill="#0c1219" stroke={color} strokeWidth={1.5} />
                    <text y={4} fill={color} fontSize="9" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
                      {ROLE_ABBR[p.role]}
                    </text>
                  </g>
                );
              })}

            {/* Switch nodes */}
            {DEFAULT_SWITCHES.map((s) => {
              const pos = POS[s.id];
              const isRoot = !noStp && s.id === stp.rootId;
              return (
                <g key={s.id} transform={`translate(${pos.x}, ${pos.y})`}>
                  <rect x={-44} y={-26} width={88} height={52} rx={10} fill="#141b24" stroke={isRoot ? "#22c55e" : "#475569"} strokeWidth={isRoot ? 2.5 : 1.5} />
                  <text y={-6} fill="#ffffff" fontSize="14" textAnchor="middle" fontFamily="monospace" fontWeight="bold">{s.id}</text>
                  <text y={9} fill="#64748b" fontSize="8" textAnchor="middle" fontFamily="monospace">pri {s.priority}</text>
                  {!noStp && (
                    <text y={20} fill="#94a3b8" fontSize="8" textAnchor="middle" fontFamily="monospace">
                      cost {stp.rpc[s.id]}
                    </text>
                  )}
                  {isRoot && (
                    <foreignObject x={-10} y={-46} width={20} height={20}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 20, height: 20 }}>
                        <Crown size={16} color="#22c55e" />
                      </div>
                    </foreignObject>
                  )}
                  {isRoot && (
                    <text y={-30} fill="#22c55e" fontSize="8" textAnchor="middle" fontFamily="monospace" fontWeight="bold">ROOT</text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Port table */}
        <div className="shrink-0 mt-3 border border-white/5 rounded-xl bg-[#0c1219] p-3">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Port Roles &amp; States</div>
          {noStp ? (
            <p className="text-[12px] text-red-300 leading-relaxed">
              With STP disabled, the redundant triangle is a loop: a single broadcast is forwarded forever,
              multiplying around the ring until the switches are saturated. STP exists to block one port and
              break exactly this.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {stp.ports.map((p) => {
                const color = ROLE_COLOR[p.role];
                const state = portState(p.role);
                return (
                  <div key={`${p.switchId}-${p.linkId}`} className="rounded-lg border px-2.5 py-1.5 flex items-center justify-between" style={{ borderColor: `${color}40`, background: `${color}0d` }}>
                    <span className="text-[11px] font-mono text-slate-300">
                      {p.switchId} → {p.neighborId}
                    </span>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>
                        {p.role === "root" ? "Root" : p.role === "designated" ? "Desig." : "Blocking"}
                      </span>
                      <span className="text-[9px] font-mono" style={{ color: state === "Forwarding" ? "#22c55e" : state === "Blocking" ? "#ef4444" : LAYER_COLOR }}>
                        {state}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </SimulatorLayout>
  );
}
