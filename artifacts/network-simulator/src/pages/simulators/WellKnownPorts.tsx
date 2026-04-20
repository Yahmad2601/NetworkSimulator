import { useState, useEffect } from "react";
import { Play, RefreshCw, AlertTriangle } from "lucide-react";
import SimulatorLayout, { FooterControl } from "../../components/SimulatorLayout";

interface PortDef { port: number; service: string; protocol: string; encrypted: boolean; listening: boolean; color: string; }

const PORT_DEFS: PortDef[] = [
  { port: 80, service: "HTTP", protocol: "TCP", encrypted: false, listening: true, color: "#06b6d4" },
  { port: 443, service: "HTTPS", protocol: "TCP", encrypted: true, listening: true, color: "#14b8a6" },
  { port: 22, service: "SSH", protocol: "TCP", encrypted: true, listening: true, color: "#a855f7" },
  { port: 21, service: "FTP", protocol: "TCP", encrypted: false, listening: true, color: "#f59e0b" },
  { port: 25, service: "SMTP", protocol: "TCP", encrypted: false, listening: true, color: "#10b981" },
  { port: 23, service: "Telnet", protocol: "TCP", encrypted: false, listening: false, color: "#ef4444" },
  { port: 8080, service: "HTTP-Alt", protocol: "TCP", encrypted: false, listening: false, color: "#f97316" },
  { port: 3306, service: "MySQL", protocol: "TCP", encrypted: false, listening: false, color: "#64748b" },
];

interface Connection { id: number; port: number; srcPort: number; result: "accepted" | "rejected" | "pending"; progress: number; }

export default function WellKnownPorts() {
  const [ports, setPorts] = useState<PortDef[]>(PORT_DEFS);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [running, setRunning] = useState(false);
  const [accepted, setAccepted] = useState(0);
  const [rejected, setRejected] = useState(0);

  useEffect(() => {
    if (!running) return;
    const spawn = setInterval(() => {
      const p = ports[Math.floor(Math.random() * ports.length)];
      const srcPort = Math.floor(Math.random() * 30000) + 30000;
      const id = Date.now() + Math.random();
      setConnections(prev => [...prev.slice(-15), { id, port: p.port, srcPort, result: "pending", progress: 0 }]);
    }, 900);

    const move = setInterval(() => {
      setConnections(prev => prev.map(conn => {
        if (conn.result !== "pending") return conn;
        const newProg = conn.progress + 0.05;
        if (newProg >= 1) {
          const portDef = ports.find(p => p.port === conn.port)!;
          const result = portDef.listening ? "accepted" : "rejected";
          if (result === "accepted") setAccepted(a => a + 1);
          else setRejected(r => r + 1);
          return { ...conn, progress: 1, result };
        }
        return { ...conn, progress: newProg };
      }));
    }, 50);

    return () => { clearInterval(spawn); clearInterval(move); };
  }, [running, ports]);

  const togglePort = (port: number) => {
    setPorts(prev => prev.map(p => p.port === port ? { ...p, listening: !p.listening } : p));
  };

  const reset = () => { setRunning(false); setConnections([]); setAccepted(0); setRejected(0); };

  const footerControls: FooterControl[] = [
    {
      key: "play", type: "button",
      label: running ? "Pause Traffic" : "Send Traffic",
      variant: running ? "secondary" : "teal",
      icon: <Play size={12} />,
      onClick: () => setRunning(r => !r),
    },
    { key: "sp", type: "spacer" },
    { key: "acc", type: "stat", stat: { label: "Accepted", value: String(accepted), color: "#14b8a6" } },
    { key: "rej", type: "stat", stat: { label: "Rejected", value: String(rejected), color: rejected > 0 ? "#ef4444" : "#475569" } },
    { key: "listen", type: "stat", stat: { label: "Listening", value: String(ports.filter(p => p.listening).length), color: "#06b6d4" } },
    { key: "reset", type: "button", label: "Reset", variant: "danger", icon: <RefreshCw size={12} />, onClick: reset },
  ];

  return (
    <SimulatorLayout
      title="Well-Known Ports Simulator"
      subtitle="Layer 4 · Port Listeners"
      layerBadge="L4"
      layerColor="#f59e0b"
      footerControls={footerControls}
    >
      <div className="h-full flex gap-4 p-4 overflow-hidden">
        {/* Port listeners config */}
        <div className="w-72 shrink-0 glass-panel rounded-xl border border-white/5 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5">
            <span className="text-slate-400 uppercase tracking-widest font-bold" style={{ fontSize: 9 }}>
              Server Port Configuration
            </span>
          </div>
          <div className="flex-1 overflow-y-auto logs-scroll px-3 py-3 space-y-2">
            {ports.map(p => (
              <div key={p.port}
                className="flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer hover:bg-white/3"
                style={{
                  background: p.listening ? p.color + "10" : "#0a0e14",
                  borderColor: p.listening ? p.color + "35" : "#1e2d3d",
                }}
                onClick={() => togglePort(p.port)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono font-bold text-xs" style={{ color: p.listening ? p.color : "#475569" }}>
                      :{p.port}
                    </span>
                    <span className="text-slate-400 text-xs">{p.service}</span>
                    {p.encrypted && (
                      <span className="px-1.5 py-0.5 rounded font-bold uppercase"
                        style={{ fontSize: 7, background: "#14b8a615", color: "#14b8a6" }}>
                        TLS
                      </span>
                    )}
                    {!p.listening && p.port === 23 && (
                      <span className="px-1.5 py-0.5 rounded font-bold uppercase"
                        style={{ fontSize: 7, background: "#ef444415", color: "#ef4444" }}>
                        Insecure
                      </span>
                    )}
                  </div>
                  <div className="text-slate-600" style={{ fontSize: 9 }}>{p.protocol} · {p.encrypted ? "Encrypted" : "Plaintext"}</div>
                </div>
                {/* Toggle */}
                <div className={`w-8 h-4 rounded-full transition-all duration-300 relative ${p.listening ? "" : "bg-[#1e2d3d]"}`}
                  style={{ background: p.listening ? p.color : "#1e2d3d" }}>
                  <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all duration-300 ${p.listening ? "left-4" : "left-0.5"}`} />
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 py-2 border-t border-white/5">
            <p className="text-slate-600 leading-relaxed" style={{ fontSize: 9 }}>
              Click any port to toggle its listener. Traffic to closed ports is REJECTED (RST packet).
            </p>
          </div>
        </div>

        {/* Connection log */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="text-slate-400 uppercase tracking-widest font-bold mb-3" style={{ fontSize: 9 }}>
            Incoming Connection Attempts
          </div>
          <div className="flex-1 glass-panel rounded-xl border border-white/5 overflow-hidden flex flex-col">
            {/* Column header */}
            <div className="flex items-center gap-4 px-4 py-2 border-b border-white/5 text-slate-600 uppercase tracking-widest font-bold" style={{ fontSize: 8 }}>
              <span className="w-24">Source</span>
              <span className="w-20">Dest Port</span>
              <span className="flex-1">Progress</span>
              <span className="w-20 text-right">Result</span>
            </div>
            <div className="flex-1 overflow-y-auto logs-scroll divide-y divide-white/3">
              {connections.length === 0 && (
                <div className="text-center py-10 text-slate-600 text-sm">
                  Start traffic to see incoming connections
                </div>
              )}
              {[...connections].reverse().map(conn => {
                const portDef = ports.find(p => p.port === conn.port)!;
                const pct = conn.progress * 100;
                const isPending = conn.result === "pending";
                const isAccepted = conn.result === "accepted";

                return (
                  <div key={conn.id} className="flex items-center gap-4 px-4 py-2.5 hover:bg-white/2 transition-colors">
                    <span className="font-mono text-slate-500 w-24 shrink-0" style={{ fontSize: 10 }}>
                      :{conn.srcPort}
                    </span>
                    <div className="w-20 shrink-0 flex items-center gap-1">
                      <span className="font-mono font-bold" style={{ fontSize: 10, color: portDef.color }}>
                        :{conn.port}
                      </span>
                      <span className="text-slate-600" style={{ fontSize: 8 }}>{portDef.service}</span>
                    </div>
                    <div className="flex-1 h-1.5 rounded-full bg-[#0a0e14] overflow-hidden">
                      {isPending && (
                        <div className="h-full rounded-full transition-all duration-100"
                          style={{ width: `${pct}%`, background: portDef.color }} />
                      )}
                    </div>
                    <div className="w-20 text-right">
                      {isPending ? (
                        <span className="text-slate-600 text-xs">SYN...</span>
                      ) : isAccepted ? (
                        <span className="text-teal-400 font-bold uppercase tracking-widest" style={{ fontSize: 9 }}>
                          ✓ ACCEPT
                        </span>
                      ) : (
                        <span className="text-red-400 font-bold uppercase tracking-widest" style={{ fontSize: 9 }}>
                          ✕ RST
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Telnet warning */}
          {ports.find(p => p.port === 23 && p.listening) && (
            <div className="mt-3 glass-panel rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 flex items-center gap-2">
              <AlertTriangle size={13} className="text-red-400 shrink-0" />
              <span className="text-red-300 text-xs">
                <strong>Warning:</strong> Telnet (port 23) transmits credentials in plaintext. Never enable in production.
              </span>
            </div>
          )}
        </div>
      </div>
    </SimulatorLayout>
  );
}
