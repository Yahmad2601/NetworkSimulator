import { useEffect, useRef, useState } from "react";
import { Laptop, Network as SwitchIcon, Radio, RefreshCw } from "lucide-react";
import SimulatorLayout, { FooterControl } from "../../components/SimulatorLayout";
import {
  buildTag,
  tagBytes,
  broadcastRecipients,
  VLAN_COLORS,
  type VlanHost,
} from "../../lib/vlan";

const LAYER_COLOR = "#f59e0b";
const NATIVE_VLAN = 1;

const HOSTS: VlanHost[] = [
  { id: "A", name: "PC-A", vlan: 10, switchId: "SW1" },
  { id: "B", name: "PC-B", vlan: 20, switchId: "SW1" },
  { id: "C", name: "PC-C", vlan: 10, switchId: "SW2" },
  { id: "D", name: "PC-D", vlan: 20, switchId: "SW2" },
];

const POS: Record<string, { x: number; y: number }> = {
  A: { x: 110, y: 95 },
  B: { x: 110, y: 300 },
  SW1: { x: 300, y: 197 },
  SW2: { x: 500, y: 197 },
  C: { x: 690, y: 95 },
  D: { x: 690, y: 300 },
};

type Phase = "idle" | "access-in" | "trunk" | "deliver" | "done";

export default function VLANSimulator() {
  const [sourceId, setSourceId] = useState("A");
  const [phase, setPhase] = useState<Phase>("idle");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  const source = HOSTS.find((h) => h.id === sourceId)!;
  const recipients = broadcastRecipients(HOSTS, sourceId);
  const blocked = HOSTS.filter((h) => h.vlan !== source.vlan).map((h) => h.id);
  const tag = buildTag(source.vlan);
  const vlanColor = VLAN_COLORS[source.vlan];

  const animating = phase !== "idle" && phase !== "done";
  const tagged = phase === "trunk";
  const delivered = phase === "deliver" || phase === "done";

  const sendBroadcast = () => {
    if (animating) return;
    clearTimers();
    setPhase("access-in");
    timers.current.push(setTimeout(() => setPhase("trunk"), 900));
    timers.current.push(setTimeout(() => setPhase("deliver"), 1900));
    timers.current.push(setTimeout(() => setPhase("done"), 2900));
  };

  const reset = () => {
    clearTimers();
    setPhase("idle");
  };

  const selectSource = (id: string) => {
    if (animating) return;
    setSourceId(id);
    setPhase("idle");
    clearTimers();
  };

  const footerControls: FooterControl[] = [
    { key: "sp0", type: "spacer" },
    {
      key: "send",
      type: "button",
      label: animating ? "Broadcasting…" : `Broadcast from ${source.name}`,
      variant: "warning",
      icon: <Radio size={12} />,
      onClick: sendBroadcast,
      disabled: animating,
    },
    { key: "sp1", type: "spacer" },
    {
      key: "reset",
      type: "button",
      label: "Reset",
      variant: "secondary",
      icon: <RefreshCw size={12} />,
      onClick: reset,
    },
  ];

  // Which links are "hot" in the current phase.
  const linkActive = (from: string, to: string): boolean => {
    const host = HOSTS.find((h) => h.id === (from.startsWith("SW") ? to : from));
    const isAccess = from.startsWith("SW") !== to.startsWith("SW");
    const isTrunk = from.startsWith("SW") && to.startsWith("SW");
    if (phase === "access-in") return isAccess && (from === sourceId || to === sourceId);
    if (phase === "trunk") return isTrunk;
    if (delivered) return isAccess && host !== undefined && recipients.includes(host.id);
    return false;
  };

  const links: Array<[string, string]> = [
    ["A", "SW1"],
    ["B", "SW1"],
    ["SW1", "SW2"],
    ["C", "SW2"],
    ["D", "SW2"],
  ];

  const sidebar = (
    <div className="flex flex-col h-full overflow-y-auto logs-scroll p-3 gap-3">
      <div className="glass-panel border border-white/10 bg-[#141b24] p-3 rounded-xl shrink-0">
        <div className="text-[10px] uppercase tracking-widest font-bold mb-2" style={{ color: LAYER_COLOR }}>
          The 802.1Q Tag
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          A 4-byte tag inserted between the Source MAC and EtherType: TPID{" "}
          <span className="font-mono text-amber-300">0x8100</span>, then a 16-bit TCI carrying PCP (3 bits),
          DEI (1 bit), and the 12-bit <span className="font-bold">VLAN ID</span> (1–4094).
        </p>
      </div>
      <div className="glass-panel border border-white/10 bg-[#141b24] p-3 rounded-xl shrink-0">
        <div className="text-[10px] uppercase tracking-widest font-bold mb-2 text-slate-400">Access vs. Trunk</div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          <span className="text-slate-200 font-bold">Access</span> ports carry one VLAN and send frames{" "}
          <span className="font-bold">untagged</span> to the host. <span className="text-slate-200 font-bold">Trunk</span>{" "}
          ports carry many VLANs and <span className="font-bold">tag</span> each frame — except the untagged
          native VLAN (default 1).
        </p>
      </div>
      <div className="glass-panel border border-white/10 bg-[#141b24] p-3 rounded-xl shrink-0">
        <div className="text-[10px] uppercase tracking-widest font-bold mb-2 text-slate-400">VLANs</div>
        <div className="flex flex-col gap-1.5">
          {[10, 20].map((v) => (
            <div key={v} className="flex items-center gap-2 text-[11px]">
              <span className="w-3 h-3 rounded" style={{ background: VLAN_COLORS[v] }} />
              <span className="text-slate-300">VLAN {v}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed mt-2">
          A broadcast stays inside its VLAN. Reaching another VLAN needs a Layer-3 device (router / SVI).
        </p>
      </div>
    </div>
  );

  return (
    <SimulatorLayout
      title="VLANs & 802.1Q Tagging"
      subtitle="Isolated Broadcast Domains on One Switch"
      layerBadge="L2"
      layerColor={LAYER_COLOR}
      footerControls={footerControls}
      sidebar={sidebar}
    >
      <div className="h-full flex flex-col p-4 select-none overflow-hidden text-slate-400 bg-[#0a0e14]">
        {/* Status metrics */}
        <div className="grid grid-cols-3 gap-3 shrink-0 mb-3">
          {[
            { label: "SOURCE", value: `${source.name} · VLAN ${source.vlan}`, color: vlanColor },
            {
              label: "FRAME ON WIRE",
              value: phase === "idle" ? "—" : tagged ? "Tagged" : delivered || phase === "access-in" ? "Untagged" : "—",
              color: tagged ? LAYER_COLOR : "#94a3b8",
            },
            { label: "REACHES", value: delivered ? `${recipients.length} host(s)` : "—", color: "#22c55e" },
          ].map((item) => (
            <div
              key={item.label}
              className="glass-panel border border-white/5 bg-[#141b24] p-3 rounded-xl shadow-lg flex flex-col items-center"
            >
              <div className="text-[10px] uppercase tracking-widest mb-1">{item.label}</div>
              <div className="font-mono font-bold text-base" style={{ color: item.color }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {/* Topology */}
        <div className="flex-1 relative border border-white/5 rounded-xl bg-[#0c1219] shadow-[inset_0_0_30px_rgba(0,0,0,0.4)] overflow-hidden min-h-0">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid meet">
            {/* Links */}
            {links.map(([from, to]) => {
              const a = POS[from];
              const b = POS[to];
              const isTrunk = from.startsWith("SW") && to.startsWith("SW");
              const hostId = from.startsWith("SW") ? to : from;
              const host = HOSTS.find((h) => h.id === hostId);
              const active = linkActive(from, to);
              const baseColor = isTrunk ? "#64748b" : VLAN_COLORS[host?.vlan ?? 0] ?? "#334155";
              return (
                <g key={`${from}-${to}`}>
                  <line
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={active ? (isTrunk ? vlanColor : baseColor) : baseColor}
                    strokeWidth={isTrunk ? 3 : 2}
                    strokeOpacity={active ? 0.95 : 0.25}
                    strokeDasharray={isTrunk ? "2 0" : undefined}
                  />
                  {active && (
                    <line
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke={isTrunk ? vlanColor : baseColor}
                      strokeWidth={isTrunk ? 3 : 2}
                      strokeDasharray="6 8"
                      style={{ animation: "dash-flow 0.7s linear infinite" }}
                    />
                  )}
                  {isTrunk && (
                    <text x={(a.x + b.x) / 2} y={a.y - 12} fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="monospace">
                      TRUNK · 802.1Q
                    </text>
                  )}
                </g>
              );
            })}

            {/* Switch nodes */}
            {["SW1", "SW2"].map((id) => {
              const pos = POS[id];
              return (
                <g key={id} transform={`translate(${pos.x}, ${pos.y})`}>
                  <rect x={-26} y={-20} width={52} height={40} rx={8} fill="#141b24" stroke="#475569" strokeWidth={2} />
                  <foreignObject x={-12} y={-18} width={24} height={24}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 24 }}>
                      <SwitchIcon size={18} color="#94a3b8" />
                    </div>
                  </foreignObject>
                  <text y={14} fill="#cbd5e1" fontSize="10" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
                    {id}
                  </text>
                </g>
              );
            })}

            {/* Host nodes */}
            {HOSTS.map((h) => {
              const pos = POS[h.id];
              const color = VLAN_COLORS[h.vlan];
              const isSource = h.id === sourceId;
              const isRecipient = delivered && recipients.includes(h.id);
              const isBlocked = delivered && blocked.includes(h.id);
              const ring = isSource ? "#ffffff" : isRecipient ? "#22c55e" : isBlocked ? "#ef4444" : color;
              return (
                <g
                  key={h.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  style={{ cursor: animating ? "default" : "pointer" }}
                  onClick={() => selectSource(h.id)}
                >
                  <circle r={26} fill="#141b24" stroke={ring} strokeWidth={isSource ? 3 : 2} />
                  <foreignObject x={-12} y={-16} width={24} height={24}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 24 }}>
                      <Laptop size={18} color={color} />
                    </div>
                  </foreignObject>
                  <text y={16} fill={color} fontSize="9" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
                    V{h.vlan}
                  </text>
                  <text y={44} fill="#cbd5e1" fontSize="11" textAnchor="middle" fontFamily="monospace">
                    {h.name}
                  </text>
                  {isSource && (
                    <text y={-34} fill="#ffffff" fontSize="9" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
                      SOURCE
                    </text>
                  )}
                  {isRecipient && (
                    <text y={-34} fill="#22c55e" fontSize="9" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
                      ✓ RECEIVED
                    </text>
                  )}
                  {isBlocked && (
                    <text y={-34} fill="#ef4444" fontSize="9" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
                      ✕ BLOCKED
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {phase === "idle" && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[11px] uppercase tracking-widest text-slate-600">
              Click a PC to choose the source, then broadcast
            </div>
          )}
        </div>

        {/* Frame inspector */}
        <div className="shrink-0 mt-3 border border-white/5 rounded-xl bg-[#0c1219] p-3">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">
            Ethernet Frame {tagged ? "· on the trunk (tagged)" : "· on an access link (untagged)"}
          </div>
          <div className="flex items-stretch gap-1.5 text-center font-mono">
            {[
              { label: "Dest MAC", value: "ff:ff:ff:ff:ff:ff", color: "#475569" },
              { label: "Src MAC", value: source.name, color: "#475569" },
            ].map((f) => (
              <FrameField key={f.label} {...f} />
            ))}

            {/* 802.1Q tag — present only when tagged on the trunk */}
            <div
              className="rounded-md border px-2 py-1.5 transition-all duration-300 flex flex-col justify-center"
              style={{
                flex: 1.4,
                borderColor: tagged ? LAYER_COLOR : "rgba(255,255,255,0.08)",
                background: tagged ? `${LAYER_COLOR}1a` : "transparent",
                opacity: tagged ? 1 : 0.35,
              }}
            >
              <div className="text-[8px] uppercase tracking-widest" style={{ color: tagged ? LAYER_COLOR : "#475569" }}>
                802.1Q Tag (4 bytes)
              </div>
              <div className="text-[12px] font-bold" style={{ color: tagged ? LAYER_COLOR : "#475569" }}>
                {tagBytes(tag).join(" ")}
              </div>
              <div className="text-[8px]" style={{ color: tagged ? "#fcd34d" : "#475569" }}>
                TPID 0x8100 · VID {source.vlan}
              </div>
            </div>

            {[
              { label: "EtherType", value: "0x0800", color: "#475569" },
              { label: "Payload", value: "…", color: "#475569" },
              { label: "FCS", value: "CRC32", color: "#475569" },
            ].map((f) => (
              <FrameField key={f.label} {...f} />
            ))}
          </div>
        </div>
      </div>
    </SimulatorLayout>
  );
}

function FrameField({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex-1 rounded-md border border-white/8 bg-[#141b24] px-2 py-1.5 flex flex-col justify-center">
      <div className="text-[8px] uppercase tracking-widest text-slate-500">{label}</div>
      <div className="text-[11px] truncate" style={{ color: color === "#475569" ? "#cbd5e1" : color }}>
        {value}
      </div>
    </div>
  );
}
