import { useState, useEffect } from "react";
import { Play, RefreshCw, Info } from "lucide-react";
import SimulatorLayout, { FooterControl } from "../../components/SimulatorLayout";

type Mode = "circuit" | "packet";

interface Packet {
  id: number;
  src: number;
  dest: number;
  progress: number;
  path: number[];
  color: string;
  active: boolean;
}

const NODES = [
  { id: 0, x: 80, y: 150, label: "A" },
  { id: 1, x: 220, y: 80, label: "SW1" },
  { id: 2, x: 220, y: 220, label: "SW2" },
  { id: 3, x: 360, y: 80, label: "SW3" },
  { id: 4, x: 360, y: 220, label: "SW4" },
  { id: 5, x: 500, y: 150, label: "B" },
];

const ALL_LINKS = [
  [0, 1], [0, 2], [1, 3], [1, 4], [2, 3], [2, 4], [3, 5], [4, 5],
];

const PACKET_COLORS = ["#06b6d4", "#a855f7", "#14b8a6", "#f59e0b"];

export default function NetworkSwitching() {
  const [mode, setMode] = useState<Mode>("circuit");
  const [running, setRunning] = useState(false);
  const [circuitPath] = useState([0, 1, 3, 5]);
  const [packets, setPackets] = useState<Packet[]>([]);
  const [circuitProgress, setCircuitProgress] = useState(0);
  const [drops, setDrops] = useState(0);
  const [delivered, setDelivered] = useState(0);

  useEffect(() => {
    if (!running) return;

    if (mode === "circuit") {
      const interval = setInterval(() => {
        setCircuitProgress(p => {
          if (p >= 1) {
            setDelivered(d => d + 1);
            return 0;
          }
          return p + 0.02;
        });
      }, 50);
      return () => clearInterval(interval);
    } else {
      const spawnInterval = setInterval(() => {
        const paths = [
          [0, 1, 3, 5],
          [0, 2, 4, 5],
          [0, 1, 4, 5],
          [0, 2, 3, 5],
        ];
        const path = paths[Math.floor(Math.random() * paths.length)];
        const id = Date.now() + Math.random();
        setPackets(prev => [...prev.slice(-8), {
          id, src: 0, dest: 5, progress: 0, path,
          color: PACKET_COLORS[Math.floor(Math.random() * PACKET_COLORS.length)],
          active: true,
        }]);
      }, 800);

      const moveInterval = setInterval(() => {
        setPackets(prev => prev.map(p => {
          if (!p.active) return p;
          const newProg = p.progress + 0.04;
          if (newProg >= 1) {
            setDelivered(d => d + 1);
            return { ...p, progress: 1, active: false };
          }
          return { ...p, progress: newProg };
        }));
      }, 50);

      return () => {
        clearInterval(spawnInterval);
        clearInterval(moveInterval);
      };
    }
  }, [running, mode]);

  const simulateFailure = () => {
    if (mode === "circuit") {
      setRunning(false);
      setCircuitProgress(0);
      setDrops(d => d + 1);
    } else {
      setDrops(d => d + Math.floor(Math.random() * 2));
    }
  };

  const reset = () => {
    setRunning(false);
    setPackets([]);
    setCircuitProgress(0);
    setDrops(0);
    setDelivered(0);
  };

  const footerControls: FooterControl[] = [
    {
      key: "mode", type: "segmented",
      options: ["Circuit", "Packet"],
      value: mode === "circuit" ? "Circuit" : "Packet",
      onChange: v => { setMode(v === "Circuit" ? "circuit" : "packet"); reset(); },
    },
    {
      key: "play", type: "button",
      label: running ? "Pause" : "Start Transfer",
      variant: running ? "secondary" : "teal",
      icon: <Play size={12} />,
      onClick: () => setRunning(r => !r),
    },
    {
      key: "fail", type: "button",
      label: mode === "circuit" ? "Simulate Link Failure" : "Drop Packets",
      variant: "danger",
      onClick: simulateFailure,
    },
    { key: "sp", type: "spacer" },
    {
      key: "del", type: "stat",
      stat: { label: "Delivered", value: String(delivered), color: "#14b8a6" },
    },
    {
      key: "drops-stat", type: "stat",
      stat: { label: "Drops", value: String(drops), color: drops > 0 ? "#ef4444" : "#475569" },
    },
    {
      key: "reset", type: "button", label: "Reset", variant: "danger", icon: <RefreshCw size={12} />, onClick: reset,
    },
  ];

  function getNodePos(id: number) {
    return NODES.find(n => n.id === id)!;
  }

  function getPacketXY(path: number[], progress: number) {
    const seg = path.length - 1;
    const rawIdx = progress * seg;
    const segIdx = Math.min(Math.floor(rawIdx), seg - 1);
    const segProg = rawIdx - segIdx;
    const a = getNodePos(path[segIdx]);
    const b = getNodePos(path[segIdx + 1]);
    return { x: a.x + (b.x - a.x) * segProg, y: a.y + (b.y - a.y) * segProg };
  }

  return (
    <SimulatorLayout
      title="Network Switching Simulator"
      subtitle="Circuit vs Packet Switching"
      layerBadge="L2"
      layerColor="#f59e0b"
      footerControls={footerControls}
    >
      <div className="h-full flex gap-4 p-4 overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 glass-panel rounded-xl border border-white/5 relative overflow-hidden canvas-grid">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 580 300" preserveAspectRatio="xMidYMid meet">
            <defs>
              <filter id="glow-amber">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* All links */}
            {ALL_LINKS.map(([a, b]) => {
              const na = getNodePos(a), nb = getNodePos(b);
              const onCircuitPath = mode === "circuit" && circuitPath.some((n, i) =>
                (circuitPath[i] === a && circuitPath[i + 1] === b) ||
                (circuitPath[i] === b && circuitPath[i + 1] === a)
              );
              return (
                <line key={`${a}-${b}`}
                  x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
                  stroke={onCircuitPath ? "#f59e0b" : "#1e2d3d"}
                  strokeWidth={onCircuitPath ? 3 : 1.5}
                  strokeOpacity={onCircuitPath ? 0.8 : 0.4}
                  strokeDasharray={onCircuitPath && running ? "6 4" : undefined}
                  style={onCircuitPath && running ? { animation: "dash-flow 1s linear infinite" } : undefined}
                />
              );
            })}

            {/* Packet mode packets */}
            {mode === "packet" && packets.filter(p => p.active).map(pkt => {
              const pos = getPacketXY(pkt.path, pkt.progress);
              return (
                <circle key={pkt.id} cx={pos.x} cy={pos.y} r={5} fill={pkt.color}
                  filter="url(#glow-amber)" opacity={0.9} />
              );
            })}

            {/* Circuit mode packet */}
            {mode === "circuit" && running && circuitProgress < 1 && (() => {
              const pos = getPacketXY(circuitPath, circuitProgress);
              return <circle cx={pos.x} cy={pos.y} r={7} fill="#f59e0b" filter="url(#glow-amber)" />;
            })()}

            {/* Nodes */}
            {NODES.map(node => {
              const isEndpoint = node.id === 0 || node.id === 5;
              const onPath = mode === "circuit" && circuitPath.includes(node.id);
              return (
                <g key={node.id} transform={`translate(${node.x},${node.y})`}>
                  <circle r={isEndpoint ? 22 : 16}
                    fill={onPath ? "#1a0f00" : "#0c1219"}
                    stroke={isEndpoint ? "#f59e0b" : onPath ? "#f59e0b" : "#1e3148"}
                    strokeWidth={onPath || isEndpoint ? 2 : 1.5}
                    filter={onPath || isEndpoint ? "url(#glow-amber)" : undefined}
                  />
                  <text textAnchor="middle" y={4} fill={isEndpoint ? "#f59e0b" : "#94a3b8"}
                    fontSize={isEndpoint ? 13 : 10} fontWeight="bold" fontFamily="monospace">
                    {node.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Mode badge */}
          <div className="absolute top-4 left-4">
            <div
              className="px-3 py-1.5 rounded-full border font-bold uppercase tracking-widest"
              style={{
                fontSize: 9,
                background: mode === "circuit" ? "rgba(245,158,11,0.1)" : "rgba(6,182,212,0.1)",
                borderColor: mode === "circuit" ? "rgba(245,158,11,0.3)" : "rgba(6,182,212,0.3)",
                color: mode === "circuit" ? "#f59e0b" : "#06b6d4",
              }}
            >
              {mode === "circuit" ? "Circuit Switching — Dedicated Path Locked" : "Packet Switching — Dynamic Multi-Path"}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="w-64 shrink-0 flex flex-col gap-4">
          <div className="glass-panel rounded-xl border border-white/5 p-4 flex-1">
            <div className="text-slate-400 uppercase tracking-widest font-bold mb-4" style={{ fontSize: 9 }}>
              Comparison
            </div>
            {[
              { label: "Path Type", circuit: "Dedicated", packet: "Dynamic" },
              { label: "Bandwidth", circuit: "Reserved", packet: "Shared" },
              { label: "Latency", circuit: "Consistent", packet: "Variable" },
              { label: "On Failure", circuit: "Full Drop", packet: "Rerouted" },
              { label: "Used In", circuit: "Old Phone", packet: "Internet" },
              { label: "Efficiency", circuit: "Low", packet: "High" },
            ].map(row => (
              <div key={row.label} className="flex items-center gap-2 py-1.5 border-b border-white/3">
                <span className="text-slate-600 w-20 shrink-0 uppercase tracking-widest" style={{ fontSize: 8 }}>{row.label}</span>
                <span
                  className="flex-1 text-center text-xs font-semibold rounded-md py-0.5"
                  style={{
                    background: mode === "circuit" ? "rgba(245,158,11,0.12)" : "transparent",
                    color: mode === "circuit" ? "#f59e0b" : "#475569",
                  }}
                >
                  {row.circuit}
                </span>
                <span
                  className="flex-1 text-center text-xs font-semibold rounded-md py-0.5"
                  style={{
                    background: mode === "packet" ? "rgba(6,182,212,0.12)" : "transparent",
                    color: mode === "packet" ? "#06b6d4" : "#475569",
                  }}
                >
                  {row.packet}
                </span>
              </div>
            ))}
          </div>

          <div className="glass-panel rounded-xl border border-amber-500/15 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Info size={11} className="text-amber-400" />
              <span className="text-amber-400 uppercase tracking-widest font-bold" style={{ fontSize: 9 }}>Key Insight</span>
            </div>
            <p className="text-slate-400 leading-relaxed" style={{ fontSize: 10 }}>
              {mode === "circuit"
                ? "In circuit switching, if the dedicated path fails, the entire call drops and a new circuit must be established — even if other paths are free."
                : "In packet switching, each packet independently finds the best route. If one link fails, packets simply reroute, making the internet nearly unbreakable."
              }
            </p>
          </div>
        </div>
      </div>
    </SimulatorLayout>
  );
}
