import { useState } from "react";
import { Router, Server, Route as RouteIcon, Navigation } from "lucide-react";
import SimulatorLayout, { FooterControl } from "../../components/SimulatorLayout";

type Protocol = "RIP" | "OSPF";

export default function RoutingProtocol() {
  const [protocol, setProtocol] = useState<Protocol>("RIP");
  const [simulating, setSimulating] = useState(false);

  const handleSimulate = () => {
    if (simulating) return;
    setSimulating(true);
    setTimeout(() => {
      setSimulating(false);
    }, 3000); // 3 seconds animation
  };

  const getSubtitle = () => {
    if (protocol === "RIP") {
      return "RIP routed via the shortest path (1 hop). It completely ignored the bandwidth speed.";
    }
    return "OSPF routed via the fastest path. It calculated bandwidth cost and ignored the hop count.";
  };

  const footerControls: FooterControl[] = [
    {
      type: "segmented",
      key: "protocol",
      options: ["RIP", "OSPF"],
      value: protocol,
      onChange: (val) => {
        setProtocol(val as Protocol);
        setSimulating(false);
      }
    },
    { type: "spacer" },
    {
      type: "button",
      key: "simulate",
      label: "Send Data Packet",
      onClick: handleSimulate,
      disabled: simulating,
      variant: protocol === "OSPF" ? "cyan" : "warning",
      icon: <Navigation size={16} className="rotate-90" />
    }
  ];

  return (
    <SimulatorLayout
      title="Routing Protocol Simulator"
      subtitle={getSubtitle()}
      layerBadge="L3"
      layerColor={protocol === "OSPF" ? "#06b6d4" : "#f59e0b"}
      footerControls={footerControls}
      sidebar={
        <div className="p-6 flex flex-col h-full bg-[#0d1520]">
          <div className="bg-[#141b24] border border-white/10 p-4 rounded-lg shadow-sm w-full">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/5">
              <RouteIcon className="text-slate-400" size={16} />
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Routing Logic</h3>
            </div>
            <ul className="space-y-3 text-xs text-slate-400 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold mt-0.5">•</span>
                <span><strong className="text-white">RIP:</strong> Distance Vector protocol. Primary metric is Hops.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold mt-0.5">•</span>
                <span><strong className="text-white">OSPF:</strong> Link-State protocol. Primary metric is Cost (100Mbps / Bandwidth).</span>
              </li>
              <li className="flex items-start gap-2 mt-3 pt-3 border-t border-white/5">
                <span className="text-slate-500 font-bold mt-0.5">↳</span>
                <span className="italic">Goal: Observe the difference between picking the 'Shortest' (fewest stops) vs the 'Fastest' (highest bandwidth) path.</span>
              </li>
            </ul>
          </div>
        </div>
      }
    >
      <div className="h-full flex flex-col p-6 overflow-hidden">
        {/* Metrics Header */}
        <div className="grid grid-cols-3 gap-4 mb-4 bg-[#141b24] border border-white/5 rounded-lg p-4 shadow-lg">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Selected Protocol</span>
            <span className={`text-sm font-mono font-bold ${protocol === "OSPF" ? "text-cyan-400" : "text-amber-400"}`}>
              {protocol}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">RIP Metric [Hops]</span>
            <span className={`text-sm font-mono ${protocol === "RIP" ? "text-white font-bold" : "text-slate-500"}`}>
              {protocol === "RIP" ? "1 Hop" : "Ignoring"}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">OSPF Cost</span>
            <span className={`text-sm font-mono ${protocol === "OSPF" ? "text-white font-bold" : "text-slate-500"}`}>
              {protocol === "OSPF" ? "10 (High Speed)" : "Ignoring"}
            </span>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-[#0c1219] rounded-xl border border-white/5 relative overflow-hidden flex items-center justify-center shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]">
          <div className="relative w-[800px] h-[500px]" style={{ transform: "scale(0.95)", transformOrigin: "center" }}>

            {/* Connection Lines (SVG) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 500">
              {/* Upper Path: SOURCE (150,380) -> R1 (300,120) -> R2 (500,120) -> DEST (650,380) */}
              <path 
                d="M 150 380 L 300 120 L 500 120 L 650 380" 
                fill="none"
                stroke={protocol === "OSPF" ? "#06b6d4" : "#475569"} 
                strokeWidth={protocol === "OSPF" ? "4" : "2"}
                className={protocol === "OSPF" ? "drop-shadow-[0_0_10px_rgba(6,182,212,0.5)] transition-all duration-500" : "transition-all duration-500 opacity-30"}
                strokeDasharray={simulating && protocol === "OSPF" ? "15 15" : "none"}
              />
              <text x="400" y="90" fill={protocol === "OSPF" ? "#06b6d4" : "#475569"} textAnchor="middle" className="text-[10px] font-bold tracking-widest uppercase transition-all duration-500">
                Fiber Optic Path (10 Gbps)
              </text>
              {simulating && protocol === "OSPF" && (
                <path 
                  d="M 150 380 L 300 120 L 500 120 L 650 380" 
                  fill="none" stroke="#06b6d4" strokeWidth="4" strokeDasharray="10 20" 
                  className="animate-[dash_1s_linear_infinite]"
                />
              )}

              {/* Lower Path: SOURCE (150,380) -> DEST (650,380) */}
              <path 
                d="M 150 380 L 650 380" 
                fill="none"
                stroke={protocol === "RIP" ? "#f59e0b" : "#475569"} 
                strokeWidth={protocol === "RIP" ? "4" : "2"}
                className={protocol === "RIP" ? "drop-shadow-[0_0_10px_rgba(245,158,11,0.5)] transition-all duration-500" : "transition-all duration-500 opacity-30"}
                strokeDasharray={simulating && protocol === "RIP" ? "15 15" : "none"}
              />
              <text x="400" y="410" fill={protocol === "RIP" ? "#f59e0b" : "#475569"} textAnchor="middle" className="text-[10px] font-bold tracking-widest uppercase transition-all duration-500">
                Copper Path (10 Mbps)
              </text>
              {simulating && protocol === "RIP" && (
                <path 
                  d="M 150 380 L 650 380" 
                  fill="none" stroke="#f59e0b" strokeWidth="4" strokeDasharray="10 20" 
                  className="animate-[dash_2s_linear_infinite]"
                />
              )}
            </svg>

            {/* Nodes */}
            <div className="absolute left-[150px] top-[380px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group z-10">
              <div className="w-16 h-16 bg-[#1a2430] border-2 border-white/20 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.1)] group-hover:scale-105 transition-transform">
                <Server className="text-white" size={32} />
              </div>
              <span className="mt-2 text-xs font-bold text-slate-300 uppercase bg-[#0c1219]/80 px-2 py-1 rounded">Source</span>
            </div>

            <div className="absolute left-[300px] top-[120px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group z-10">
              <div className={`w-14 h-14 bg-[#1a2430] border-2 rounded-full flex items-center justify-center transition-all duration-500 group-hover:scale-105 ${protocol === "OSPF" ? "border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.3)]" : "border-slate-600/50"}`}>
                <Router className={protocol === "OSPF" ? "text-cyan-400" : "text-slate-500"} size={28} />
              </div>
              <span className="mt-2 text-[10px] font-bold text-slate-400 uppercase">R1</span>
            </div>

            <div className="absolute left-[500px] top-[120px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group z-10">
              <div className={`w-14 h-14 bg-[#1a2430] border-2 rounded-full flex items-center justify-center transition-all duration-500 group-hover:scale-105 ${protocol === "OSPF" ? "border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.3)]" : "border-slate-600/50"}`}>
                <Router className={protocol === "OSPF" ? "text-cyan-400" : "text-slate-500"} size={28} />
              </div>
              <span className="mt-2 text-[10px] font-bold text-slate-400 uppercase">R2</span>
            </div>

            <div className="absolute left-[650px] top-[380px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group z-10">
              <div className="w-16 h-16 bg-[#1a2430] border-2 border-white/20 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.1)] group-hover:scale-105 transition-transform">
                <Server className="text-white" size={32} />
              </div>
              <span className="mt-2 text-xs font-bold text-slate-300 uppercase bg-[#0c1219]/80 px-2 py-1 rounded">Destination</span>
            </div>

            {/* Packet Animation Element */}
            {simulating && (
              <div 
                className={`absolute w-5 h-5 rounded-full z-20 flex items-center justify-center ${protocol === "RIP" ? "bg-amber-400 shadow-[0_0_20px_#f59e0b]" : "bg-cyan-400 shadow-[0_0_20px_#22d3ee]"}`}
                style={{
                  animation: protocol === "RIP" ? "ripPacket 3s linear forwards" : "ospfPacket 3s linear forwards",
                  left: 0,
                  top: 0,
                  transform: "translate(-50%, -50%)"
                }}
              >
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              </div>
            )}

            {/* Global Animation Styles */}
            <style>{`
              @keyframes dash {
                to {
                  stroke-dashoffset: -40;
                }
              }
              @keyframes ripPacket {
                0% { left: 150px; top: 380px; }
                100% { left: 650px; top: 380px; }
              }
              @keyframes ospfPacket {
                0% { left: 150px; top: 380px; }
                30% { left: 300px; top: 120px; }
                70% { left: 500px; top: 120px; }
                100% { left: 650px; top: 380px; }
              }
            `}</style>
          </div>
        </div>
      </div>
    </SimulatorLayout>
  );
}