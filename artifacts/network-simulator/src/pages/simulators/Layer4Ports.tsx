import { useState, useEffect } from "react";
import { Globe, Terminal as TerminalIcon, ShieldAlert, Lock } from "lucide-react";
import SimulatorLayout, { FooterControl } from "../../components/SimulatorLayout";

type PortType = "HTTP" | "HTTPS" | "SSH" | "Telnet";

interface Packet {
  id: number;
  type: PortType;
  port: number;
  phase: number; // 0: spawn, 1: travel, 2: enter/reject
}

export default function Layer4Ports() {
  const [packets, setPackets] = useState<Packet[]>([]);

  const handleSend = (type: PortType, port: number) => {
    const id = Date.now();
    setPackets(prev => [...prev, { id, type, port, phase: 0 }]);

    setTimeout(() => {
      setPackets(prev => prev.map(p => p.id === id ? { ...p, phase: 1 } : p));
    }, 50);

    setTimeout(() => {
      setPackets(prev => prev.map(p => p.id === id ? { ...p, phase: 2 } : p));
    }, 1500);

    // Cleanup after animation completes
    setTimeout(() => {
      setPackets(prev => prev.filter(p => p.id !== id));
    }, 3500);
  };

  const footerControls: FooterControl[] = [
    { type: "spacer" },
    {
      key: "http", type: "button", label: "HTTP (Port 80)", variant: "cyan",
      onClick: () => handleSend("HTTP", 80),
    },
    {
      key: "https", type: "button", label: "HTTPS (Port 443)", variant: "teal",
      onClick: () => handleSend("HTTPS", 443),
    },
    {
      key: "ssh", type: "button", label: "SSH (Port 22)", variant: "primary", // Uses primary as purple-ish or fallback
      onClick: () => handleSend("SSH", 22),
    },
    {
      key: "telnet", type: "button", label: "Telnet (Port 23)", variant: "danger",
      onClick: () => handleSend("Telnet", 23),
    },
    { type: "spacer" },
  ];

  return (
    <SimulatorLayout
      title="Port Multiplexing Simulator"
      subtitle="Routing internal traffic by port numbers"
      layerBadge="L4"
      layerColor="#06b6d4"
      footerControls={footerControls}
      sidebar={
        <div className="p-6 flex flex-col h-full bg-[#0d1520]">
          <div className="bg-[#141b24] border border-white/10 p-4 rounded-lg shadow-sm w-full">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-3 pb-2 border-b border-white/5">What is Multiplexing?</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Multiplexing allows one IP address to handle multiple apps simultaneously.
            </p>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              The 'Port' acts like an apartment number at a single building address (IP). 
            </p>
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded">
              <p className="text-xs text-red-400 leading-relaxed">
                 Port 23 is closed, so the server rejects it.
              </p>
            </div>
          </div>
        </div>
      }
    >
      <div className="h-full flex flex-col p-6 overflow-hidden">
        {/* Metrics Header */}
        <div className="grid grid-cols-2 gap-4 mb-4 bg-[#141b24] border border-white/5 rounded-lg p-4 shadow-lg shrink-0">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Server IP</span>
            <span className="text-sm font-mono font-bold text-cyan-400">
              192.168.1.100
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Status</span>
            <span className="text-sm font-mono font-bold text-emerald-400">
              LISTENING ON 80, 443, 22
            </span>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-[#0c1219] rounded-xl border border-white/5 relative overflow-hidden flex items-center shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]">
          <div className="relative w-full h-full min-h-[400px]">
            
            {/* Server Box (Right side) */}
            <div className="absolute right-12 top-1/2 -translate-y-1/2 w-80 bg-[#141b24] border-2 border-slate-700/50 rounded-xl p-6 shadow-[0_0_40px_rgba(0,0,0,0.5)] z-10 flex flex-col justify-center">
              <div className="flex flex-col items-center mb-6">
                <div className="w-16 h-16 bg-[#1a2430] rounded-lg border border-slate-600 flex items-center justify-center shadow-inner mb-3">
                  <TerminalIcon size={32} className="text-slate-400" />
                </div>
                <h2 className="text-sm font-bold text-white tracking-widest">SERVER</h2>
                <div className="text-xs font-mono text-cyan-400 mt-1 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">192.168.1.100</div>
              </div>

              <div className="space-y-4">
                {/* 80 */}
                <div className="relative p-3 bg-[#1a2430] border border-cyan-500/30 rounded-lg flex items-center gap-4 transition-all duration-300">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                    <Globe size={20} className="text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-cyan-400 uppercase tracking-widest">HTTP Server</div>
                    <div className="text-[10px] font-mono text-slate-500 uppercase mt-1">Listening on Port :80</div>
                  </div>
                  {/* Indicator glow when active */}
                  {packets.some(p => p.port === 80 && p.phase === 2) && (
                    <div className="absolute inset-0 border-2 border-cyan-400 rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.5)] animate-pulse pointer-events-none" />
                  )}
                </div>

                {/* 443 */}
                <div className="relative p-3 bg-[#1a2430] border border-teal-500/30 rounded-lg flex items-center gap-4 transition-all duration-300">
                  <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center shrink-0">
                    <Lock size={20} className="text-teal-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-teal-400 uppercase tracking-widest">HTTPS Server</div>
                    <div className="text-[10px] font-mono text-slate-500 uppercase mt-1">Listening on Port :443</div>
                  </div>
                  {packets.some(p => p.port === 443 && p.phase === 2) && (
                    <div className="absolute inset-0 border-2 border-teal-400 rounded-lg shadow-[0_0_20px_rgba(20,184,166,0.5)] animate-pulse pointer-events-none" />
                  )}
                </div>

                {/* 22 */}
                <div className="relative p-3 bg-[#1a2430] border border-purple-500/30 rounded-lg flex items-center gap-4 transition-all duration-300">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                    <TerminalIcon size={20} className="text-purple-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-purple-400 uppercase tracking-widest">SSH Service</div>
                    <div className="text-[10px] font-mono text-slate-500 uppercase mt-1">Listening on Port :22</div>
                  </div>
                  {packets.some(p => p.port === 22 && p.phase === 2) && (
                    <div className="absolute inset-0 border-2 border-purple-400 rounded-lg shadow-[0_0_20px_rgba(168,85,247,0.5)] animate-pulse pointer-events-none" />
                  )}
                </div>
              </div>
            </div>

            {/* Packets */}
            {packets.map(p => {
              let targetY = "50%";
              let targetX = "calc(100% - 380px)"; // hits the server box outer edge
              let colorClasses = "bg-red-500/20 border-red-400 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]";
              
              if (p.port === 80) {
                targetY = "calc(50% - 85px)";
                targetX = "calc(100% - 180px)"; // slides inwards to HTTP container
                colorClasses = "bg-cyan-500/20 border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)]";
              } else if (p.port === 443) {
                targetY = "calc(50%)"; // middle
                targetX = "calc(100% - 180px)";
                colorClasses = "bg-teal-500/20 border-teal-400 text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.5)]";
              } else if (p.port === 22) {
                targetY = "calc(50% + 85px)"; // bottom
                targetX = "calc(100% - 180px)";
                colorClasses = "bg-purple-500/20 border-purple-400 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.5)]";
              } else if (p.port === 23) {
                targetY = "50%"; // hits the server shell dead center
                targetX = "calc(100% - 350px)";
              }

              return (
                <div
                  key={p.id}
                  className={`absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded flex items-center justify-center font-mono font-bold text-xs border-2 transition-all duration-[1500ms] ease-in-out z-20 backdrop-blur-md
                    ${colorClasses}
                    ${p.phase === 0 ? "opacity-0 translate-x-12 scale-50" : ""}
                    ${p.phase === 2 && p.port === 23 ? "opacity-0 scale-150 blur-sm duration-500 delay-500" : ""}
                    ${p.phase === 2 && p.port !== 23 ? "opacity-0 scale-50 duration-500" : ""}
                  `}
                  style={{
                    left: p.phase >= 1 ? targetX : "48px",
                    top: p.phase >= 1 ? targetY : "50%",
                  }}
                >
                  :{p.port}
                  
                  {/* Reject Icon */}
                  {p.phase === 2 && p.port === 23 && (
                    <div className="absolute inset-0 flex items-center justify-center text-red-500">
                      <ShieldAlert size={32} className="drop-shadow-[0_0_10px_rgba(239,68,68,1)]" />
                    </div>
                  )}
                </div>
              );
            })}

          </div>
        </div>
      </div>
    </SimulatorLayout>
  );
}