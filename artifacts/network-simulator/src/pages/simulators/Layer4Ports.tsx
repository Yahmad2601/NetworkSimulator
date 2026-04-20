import { useState, useEffect } from "react";
import { Play, RefreshCw, Wifi, Globe, Terminal, Radio } from "lucide-react";
import SimulatorLayout, { FooterControl } from "../../components/SimulatorLayout";

interface Port { port: number; protocol: string; service: string; color: string; icon: React.ReactNode; description: string; }
interface Arrival { id: number; port: number; label: string; progress: number; accepted: boolean; }

const PORTS: Port[] = [
  { port: 80, protocol: "HTTP", service: "Web Server", color: "#06b6d4", icon: <Globe size={14} />, description: "Hypertext Transfer Protocol — web traffic" },
  { port: 22, protocol: "SSH", service: "Secure Shell", color: "#14b8a6", icon: <Terminal size={14} />, description: "Encrypted remote terminal access" },
  { port: 1883, protocol: "MQTT", service: "IoT Broker", color: "#f59e0b", icon: <Wifi size={14} />, description: "Message Queue for IoT sensors" },
  { port: 443, protocol: "HTTPS", service: "Secure Web", color: "#a855f7", icon: <Globe size={14} />, description: "Encrypted web traffic via TLS" },
  { port: 8883, protocol: "MQTT+TLS", service: "IoT Secure", color: "#10b981", icon: <Radio size={14} />, description: "Encrypted IoT traffic" },
];

export default function Layer4Ports() {
  const [running, setRunning] = useState(false);
  const [arrivals, setArrivals] = useState<Arrival[]>([]);
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [totalPackets, setTotalPackets] = useState(0);

  useEffect(() => {
    if (!running) return;
    const spawn = setInterval(() => {
      const p = PORTS[Math.floor(Math.random() * PORTS.length)];
      const id = Date.now() + Math.random();
      setArrivals(prev => [...prev.slice(-12), { id, port: p.port, label: p.protocol, progress: 0, accepted: true }]);
      setTotalPackets(t => t + 1);
      setCounts(c => ({ ...c, [p.port]: (c[p.port] ?? 0) + 1 }));
    }, 700);

    const move = setInterval(() => {
      setArrivals(prev => prev.map(a => ({ ...a, progress: Math.min(a.progress + 0.05, 1) })));
    }, 50);

    return () => { clearInterval(spawn); clearInterval(move); };
  }, [running]);

  const reset = () => { setRunning(false); setArrivals([]); setCounts({}); setTotalPackets(0); };

  const footerControls: FooterControl[] = [
    {
      key: "play", type: "button",
      label: running ? "Pause" : "Start Traffic",
      variant: running ? "secondary" : "teal",
      icon: <Play size={12} />,
      onClick: () => setRunning(r => !r),
    },
    { key: "sp", type: "spacer" },
    { key: "total", type: "stat", stat: { label: "Total Packets", value: String(totalPackets), color: "#06b6d4" } },
    { key: "ports-open", type: "stat", stat: { label: "Open Ports", value: String(PORTS.length), color: "#14b8a6" } },
    { key: "reset", type: "button", label: "Reset", variant: "danger", icon: <RefreshCw size={12} />, onClick: reset },
  ];

  return (
    <SimulatorLayout
      title="Layer 4 Port Multiplexing"
      subtitle="Single IP · Multiple Services · IoT Focus"
      layerBadge="L4"
      layerColor="#10b981"
      footerControls={footerControls}
    >
      <div className="h-full flex gap-4 p-4 overflow-hidden">
        {/* Server SVG visualization */}
        <div className="flex-1 glass-panel rounded-xl border border-white/5 relative overflow-hidden canvas-grid">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 720 420" preserveAspectRatio="xMidYMid meet">
            <defs>
              <filter id="glow-green">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* Server block */}
            <rect x={480} y={60} width={160} height={300} rx={12}
              fill="#141b24" stroke="#10b981" strokeWidth={2} strokeOpacity={0.4} />
            <text x={560} y={48} textAnchor="middle" fill="#94a3b8" fontSize={10} fontFamily="monospace">
              192.168.1.100
            </text>
            <text x={560} y={35} textAnchor="middle" fill="#10b981" fontSize={12} fontWeight="bold">
              SERVER
            </text>

            {/* Port receivers */}
            {PORTS.map((p, i) => {
              const y = 90 + i * 52;
              const count = counts[p.port] ?? 0;
              return (
                <g key={p.port}>
                  <rect x={486} y={y} width={148} height={38} rx={6}
                    fill={count > 0 ? p.color + "15" : "#0c1219"}
                    stroke={p.color} strokeWidth={1.5} strokeOpacity={count > 0 ? 0.6 : 0.25}
                  />
                  <text x={498} y={y + 13} fill={p.color} fontSize={8} fontFamily="monospace" fontWeight="bold">
                    :{p.port}
                  </text>
                  <text x={498} y={y + 25} fill="#94a3b8" fontSize={8}>{p.service}</text>
                  <text x={622} y={y + 13} textAnchor="end" fill={count > 0 ? p.color : "#475569"} fontSize={9} fontFamily="monospace" fontWeight="bold">
                    {count}
                  </text>
                </g>
              );
            })}

            {/* Incoming packets */}
            {arrivals.filter(a => a.progress < 1).map(a => {
              const port = PORTS.find(p => p.port === a.port)!;
              const portIdx = PORTS.findIndex(p => p.port === a.port);
              const targetY = 109 + portIdx * 52;
              const startX = 80;
              const endX = 480;
              const x = startX + (endX - startX) * a.progress;
              const y = 200 - (200 - targetY) * a.progress;

              return (
                <g key={a.id}>
                  <rect x={x - 22} y={y - 10} width={44} height={20} rx={4}
                    fill={port.color + "20"} stroke={port.color} strokeWidth={1}
                  />
                  <text x={x} y={y + 3} textAnchor="middle" fill={port.color}
                    fontSize={8} fontFamily="monospace" fontWeight="bold">
                    :{a.port}
                  </text>
                </g>
              );
            })}

            {/* Internet cloud */}
            <ellipse cx={100} cy={200} rx={70} ry={50} fill="#0c1219" stroke="#1e3148" strokeWidth={2} />
            <text x={100} y={195} textAnchor="middle" fill="#94a3b8" fontSize={10} fontWeight="bold">Internet</text>
            <text x={100} y={210} textAnchor="middle" fill="#475569" fontSize={8}>Inbound Traffic</text>

            {/* IP label */}
            <text x={290} y={180} textAnchor="middle" fill="#06b6d4" fontSize={9} fontFamily="monospace">
              Dest IP: 192.168.1.100
            </text>
            <text x={290} y={196} textAnchor="middle" fill="#8b5cf6" fontSize={9} fontFamily="monospace">
              Port # determines service
            </text>
          </svg>
        </div>

        {/* Right panel */}
        <div className="w-64 shrink-0 flex flex-col gap-4">
          <div className="glass-panel rounded-xl border border-white/5 p-4 flex-1">
            <div className="text-slate-400 uppercase tracking-widest font-bold mb-4" style={{ fontSize: 9 }}>
              Active Ports
            </div>
            {PORTS.map(p => {
              const count = counts[p.port] ?? 0;
              return (
                <div key={p.port} className="mb-3 rounded-lg p-2.5 border transition-all duration-300"
                  style={{
                    background: count > 0 ? p.color + "10" : "#0a0e14",
                    borderColor: count > 0 ? p.color + "35" : "#1e2d3d",
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5" style={{ color: p.color }}>
                      {p.icon}
                      <span className="font-mono font-bold" style={{ fontSize: 11 }}>:{p.port}</span>
                      <span className="uppercase tracking-widest" style={{ fontSize: 8 }}>{p.protocol}</span>
                    </div>
                    <span className="font-mono font-bold text-xs" style={{ color: p.color }}>{count}</span>
                  </div>
                  <div className="text-slate-500" style={{ fontSize: 9 }}>{p.description}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </SimulatorLayout>
  );
}
