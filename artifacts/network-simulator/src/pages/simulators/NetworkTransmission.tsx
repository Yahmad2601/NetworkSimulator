import { useState, useEffect } from "react";
import { Play, RefreshCw } from "lucide-react";
import SimulatorLayout, { FooterControl } from "../../components/SimulatorLayout";

type CastType = "unicast" | "broadcast" | "multicast" | "anycast";

interface Host { id: number; x: number; y: number; label: string; subscribed?: boolean; isNearest?: boolean; }

const HOSTS: Host[] = [
  { id: 0, x: 100, y: 200, label: "SRC" },
  { id: 1, x: 300, y: 80, label: "H1" },
  { id: 2, x: 480, y: 80, label: "H2", subscribed: true },
  { id: 3, x: 300, y: 200, label: "H3", subscribed: true },
  { id: 4, x: 480, y: 200, label: "H4" },
  { id: 5, x: 300, y: 320, label: "H5" },
  { id: 6, x: 480, y: 320, label: "H6", isNearest: true },
];

interface Packet { id: number; destId: number; progress: number; active: boolean; }

const DESCRIPTIONS: Record<CastType, string> = {
  unicast: "One sender, one specific receiver. Each packet has a unique destination IP. Used for most internet traffic.",
  broadcast: "One sender, ALL receivers on the subnet. Dest IP: 255.255.255.255. Used for ARP, DHCP discovery.",
  multicast: "One sender, subscribed receivers only. Group IP: 224.x.x.x. Used for video streaming, routing protocols.",
  anycast: "One sender, nearest receiver (by routing metric). Same IP, multiple hosts — traffic goes to the closest one.",
};

export default function NetworkTransmission() {
  const [castType, setCastType] = useState<CastType>("unicast");
  const [running, setRunning] = useState(false);
  const [packets, setPackets] = useState<Packet[]>([]);
  const [delivered, setDelivered] = useState<Record<CastType, number>>({ unicast: 0, broadcast: 0, multicast: 0, anycast: 0 });

  function getTargets(type: CastType): number[] {
    switch (type) {
      case "unicast": return [2]; // one specific host
      case "broadcast": return [1, 2, 3, 4, 5, 6];
      case "multicast": return HOSTS.filter(h => h.subscribed).map(h => h.id);
      case "anycast": return [HOSTS.find(h => h.isNearest)!.id]; // nearest
    }
  }

  useEffect(() => {
    if (!running) return;
    const targets = getTargets(castType);
    const spawn = setInterval(() => {
      const newPkts = targets.map(destId => ({
        id: Date.now() + Math.random() + destId,
        destId,
        progress: 0,
        active: true,
      }));
      setPackets(prev => [...prev.slice(-20), ...newPkts]);
    }, 1200);

    const move = setInterval(() => {
      setPackets(prev => prev.map(p => {
        if (!p.active) return p;
        const newProg = p.progress + 0.04;
        if (newProg >= 1) {
          setDelivered(d => ({ ...d, [castType]: d[castType] + 1 }));
          return { ...p, progress: 1, active: false };
        }
        return { ...p, progress: newProg };
      }));
    }, 50);

    return () => { clearInterval(spawn); clearInterval(move); };
  }, [running, castType]);

  const reset = () => { setRunning(false); setPackets([]); };

  const castColors: Record<CastType, string> = {
    unicast: "#06b6d4",
    broadcast: "#f59e0b",
    multicast: "#a855f7",
    anycast: "#10b981",
  };

  const color = castColors[castType];

  const footerControls: FooterControl[] = [
    {
      key: "cast", type: "segmented",
      options: ["Unicast", "Broadcast", "Multicast", "Anycast"],
      value: castType.charAt(0).toUpperCase() + castType.slice(1),
      onChange: v => { setCastType(v.toString().toLowerCase() as CastType); reset(); },
    },
    {
      key: "play", type: "button",
      label: running ? "Pause" : "Send Packets",
      variant: running ? "secondary" : "teal",
      icon: <Play size={12} />,
      onClick: () => setRunning(r => !r),
    },
    { key: "sp", type: "spacer" },
    { key: "del", type: "stat", stat: { label: "Delivered", value: String(delivered[castType]), color } },
    {
      key: "reach", type: "stat",
      stat: { label: "Receivers", value: String(getTargets(castType).length), color },
    },
    { key: "reset", type: "button", label: "Reset", variant: "danger", icon: <RefreshCw size={12} />, onClick: reset },
  ];

  return (
    <SimulatorLayout
      title="Network Transmission Types"
      subtitle="Unicast · Broadcast · Multicast · Anycast"
      layerBadge="L3"
      layerColor={color}
      footerControls={footerControls}
    >
      <div className="h-full flex gap-4 p-4 overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 glass-panel rounded-xl border border-white/5 relative overflow-hidden canvas-grid">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 580 400" preserveAspectRatio="xMidYMid meet">
            <defs>
              <filter id="glow-cast">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* Connection lines */}
            {HOSTS.filter(h => h.id !== 0).map(h => (
              <line key={h.id}
                x1={HOSTS[0].x} y1={HOSTS[0].y}
                x2={h.x} y2={h.y}
                stroke="#1e2d3d" strokeWidth={1.5} strokeOpacity={0.5}
              />
            ))}

            {/* Animated packets */}
            {packets.filter(p => p.active).map(pkt => {
              const dest = HOSTS.find(h => h.id === pkt.destId)!;
              const src = HOSTS[0];
              const x = src.x + (dest.x - src.x) * pkt.progress;
              const y = src.y + (dest.y - src.y) * pkt.progress;
              return (
                <circle key={pkt.id} cx={x} cy={y} r={6} fill={color}
                  filter="url(#glow-cast)" opacity={0.9} />
              );
            })}

            {/* Nodes */}
            {HOSTS.map(host => {
              const isSrc = host.id === 0;
              const targets = getTargets(castType);
              const isTarget = targets.includes(host.id);
              const isSubscribed = host.subscribed && castType === "multicast";
              const isNearest = host.isNearest && castType === "anycast";

              return (
                <g key={host.id} transform={`translate(${host.x},${host.y})`}>
                  {(isTarget || isSrc) && (
                    <circle r={32} fill="none" stroke={color} strokeWidth={1} opacity={0.2}
                      style={{ animation: "node-pulse-ring 2s ease-out infinite" }} />
                  )}
                  <circle r={26}
                    fill={isSrc ? "#061820" : isTarget ? color + "15" : "#0c1219"}
                    stroke={isSrc ? color : isTarget ? color : "#1e3148"}
                    strokeWidth={isSrc || isTarget ? 2 : 1.5}
                    filter={isSrc || isTarget ? "url(#glow-cast)" : undefined}
                  />
                  <text textAnchor="middle" y={5} fill={isSrc ? color : isTarget ? color : "#475569"}
                    fontSize={11} fontWeight="bold" fontFamily="monospace">
                    {host.label}
                  </text>
                  {isSubscribed && (
                    <text textAnchor="middle" y={40} fill="#a855f7" fontSize={8}>✓ subscribed</text>
                  )}
                  {isNearest && (
                    <text textAnchor="middle" y={40} fill="#10b981" fontSize={8}>★ nearest</text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Cast type badge */}
          <div className="absolute top-4 left-4">
            <div className="px-3 py-1.5 rounded-full border font-bold uppercase tracking-widest"
              style={{ fontSize: 9, background: color + "15", borderColor: color + "40", color }}>
              {castType} — {DESCRIPTIONS[castType].split(".")[0]}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="w-60 shrink-0 flex flex-col gap-3">
          {/* Type comparison */}
          <div className="glass-panel rounded-xl border border-white/5 flex-1 p-4">
            <div className="text-slate-400 uppercase tracking-widest font-bold mb-4" style={{ fontSize: 9 }}>
              Addressing
            </div>
            {(["unicast", "broadcast", "multicast", "anycast"] as CastType[]).map(type => {
              const isActive = type === castType;
              const c = castColors[type];
              const addrs = {
                unicast: "Specific IP (1.2.3.4)",
                broadcast: "255.255.255.255",
                multicast: "224.0.0.0/4",
                anycast: "Shared IP (nearest)",
              };
              return (
                <div key={type}
                  className="mb-2 p-2.5 rounded-lg border transition-all cursor-pointer hover:opacity-90"
                  style={{
                    background: isActive ? c + "12" : "#0a0e14",
                    borderColor: isActive ? c + "40" : "#1e2d3d",
                  }}
                  onClick={() => { setCastType(type); reset(); }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: c }} />
                    <span className="font-bold uppercase tracking-widest" style={{ fontSize: 9, color: c }}>
                      {type}
                    </span>
                  </div>
                  <div className="font-mono text-slate-600" style={{ fontSize: 9 }}>{addrs[type]}</div>
                </div>
              );
            })}
          </div>

          {/* Description */}
          <div className="glass-panel rounded-xl border p-3" style={{ borderColor: color + "25" }}>
            <p className="text-slate-400 leading-relaxed" style={{ fontSize: 10 }}>
              {DESCRIPTIONS[castType]}
            </p>
          </div>
        </div>
      </div>
    </SimulatorLayout>
  );
}
