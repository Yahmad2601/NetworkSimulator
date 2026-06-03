import { useState, useEffect } from "react";
import { Router, Plug, Wifi, GitMerge, Power, Network } from "lucide-react";
import SimulatorLayout, { FooterControl } from "../../components/SimulatorLayout";

type TopologyType = "Single-Port Injector" | "Multi-Port PoE Switch";

export default function PoETopology() {
  const [topology, setTopology] = useState<TopologyType>("Single-Port Injector");
  const [cableLength, setCableLength] = useState(45);
  const [simulating, setSimulating] = useState(false);

  const isDegraded = cableLength > 100;

  const handleSimulate = () => {
    if (simulating) return;
    setSimulating(true);
    setTimeout(() => {
      setSimulating(false);
    }, 4000); // 4 seconds animation
  };

  const getArchitectureDesc = () => {
    if (topology === "Single-Port Injector") {
      return "PoE Injectors are ideal for retrofitting single APs. They inject power into the data line coming from a non-PoE switch.";
    }
    return "PoE Switches are required for scalable deployments, providing both data and power directly without external injectors.";
  };

  const footerControls: FooterControl[] = [
    {
      type: "segmented",
      key: "topology",
      options: ["Single-Port Injector", "Multi-Port PoE Switch"],
      value: topology,
      onChange: (val) => {
        setTopology(val as TopologyType);
        setSimulating(false);
      }
    },
    {
      type: "slider",
      key: "cableLength",
      label: "UTP Cable Length (m)",
      min: 10,
      max: 150,
      step: 5,
      value: cableLength,
      onChange: (val) => setCableLength(val as number)
    },
    { type: "spacer" },
    {
      type: "button",
      key: "simulate",
      label: "Simulate Power & Data",
      onClick: handleSimulate,
      disabled: simulating,
      variant: "teal",
      icon: <Power size={16} />
    }
  ];

  return (
    <SimulatorLayout
      title="PoE Topology Simulator"
      subtitle="Power over Ethernet"
      layerBadge="L1/L2"
      layerColor="#14b8a6"
      footerControls={footerControls}
    >
      <div className="h-full flex flex-col p-6 overflow-hidden">
        {/* Metrics Header */}
        <div className="grid grid-cols-4 gap-4 mb-4 bg-[#141b24] border border-white/5 rounded-lg p-4 shadow-lg">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Architecture</span>
            <span className="text-sm font-mono text-white">
              {topology === "Single-Port Injector" ? "PoE Injector" : "PoE Switch"}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Data Status</span>
            <span className={`text-sm font-mono font-bold ${isDegraded ? "text-red-500" : "text-cyan-400"}`}>
              {isDegraded ? "SIGNAL DEGRADED - PACKET LOSS" : "1000 Mbps - Optimal"}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Power Status</span>
            <span className="text-sm font-mono text-amber-500 font-bold">802.3at - 30W Active</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Cable Length</span>
            <span className="text-sm font-mono text-white">{cableLength} Meters</span>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-[#0c1219] rounded-xl border border-white/5 relative overflow-hidden flex items-center justify-center shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]">
          <div className="relative w-[800px] h-[500px]" style={{ transform: "scale(0.9)", transformOrigin: "center" }}>

            {topology === "Single-Port Injector" ? (
              // INJECTOR TOPOLOGY
              <>
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 500">
                  {/* Core to Injector (Data) */}
                  <line x1="120" y1="180" x2="380" y2="250" stroke="#06b6d4" strokeWidth="3" opacity="0.3" />
                  {simulating && (
                    <line x1="120" y1="180" x2="380" y2="250" stroke="#06b6d4" strokeWidth="4" strokeDasharray="10 10" className="opacity-80 animate-[dash_1s_linear_infinite]" />
                  )}
                  
                  {/* Outlet to Injector (Power) */}
                  <line x1="120" y1="320" x2="380" y2="250" stroke="#f59e0b" strokeWidth="3" opacity="0.3" />
                  {simulating && (
                    <line x1="120" y1="320" x2="380" y2="250" stroke="#f59e0b" strokeWidth="4" strokeDasharray="10 10" className="opacity-80 animate-[dash_1s_linear_infinite]" />
                  )}

                  {/* Injector to AP (Combined PoE) */}
                  <line x1="420" y1="250" x2="680" y2="250" stroke="#475569" strokeWidth="4" opacity="0.5" />
                  {simulating && (
                    <>
                      {/* Power Animation - Continues solid */}
                      <line x1="420" y1="250" x2="680" y2="250" stroke="#f59e0b" strokeWidth="4" strokeDasharray="15 15" className="animate-[dash_1s_linear_infinite]" />
                      {/* Data Animation - conditional degradation */}
                      <line x1="420" y1="250" x2="680" y2="250" stroke={isDegraded ? "#ef4444" : "#06b6d4"} strokeWidth="4" strokeDasharray="8 22" strokeDashoffset="5" className={`animate-[dash_${isDegraded ? "2s" : "1s"}_linear_infinite] ${isDegraded ? "animate-pulse" : ""}`} />
                    </>
                  )}
                </svg>

                {/* Nodes */}
                <div className="absolute left-[120px] top-[180px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group">
                  <div className="w-16 h-16 bg-[#1a2430] border-2 border-cyan-500/50 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.2)] group-hover:scale-105 transition-transform">
                    <Router className="text-cyan-400" size={32} />
                  </div>
                  <span className="mt-2 text-xs font-bold text-slate-400 uppercase">Core Router</span>
                </div>

                <div className="absolute left-[120px] top-[320px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group">
                  <div className="w-16 h-16 bg-[#1a2430] border-2 border-amber-500/50 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.2)] group-hover:scale-105 transition-transform">
                    <Plug className="text-amber-400" size={32} />
                  </div>
                  <span className="mt-2 text-xs font-bold text-slate-400 uppercase">Wall Power</span>
                </div>

                <div className="absolute left-[400px] top-[250px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group z-10">
                  <div className="w-20 h-20 bg-[#1a2430] border-2 border-teal-500/50 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(20,184,166,0.3)] group-hover:scale-105 transition-transform">
                    <GitMerge className="text-teal-400" size={40} />
                  </div>
                  <span className="mt-2 text-xs font-bold text-slate-400 uppercase bg-[#0c1219]/80 px-2 py-1 rounded">PoE Injector</span>
                </div>

                <div className="absolute left-[680px] top-[250px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group">
                  <div className="w-16 h-16 bg-[#1a2430] border-2 border-white/20 rounded-full flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                    <Wifi className={simulating ? (isDegraded ? "text-amber-500" : "text-cyan-400") : "text-slate-400"} size={32} />
                  </div>
                  <span className="mt-2 text-xs font-bold text-slate-400 uppercase">Access Point</span>
                </div>
              </>
            ) : (
              // SWITCH TOPOLOGY
              <>
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 500">
                  {/* Core to Switch (Data) */}
                  <line x1="120" y1="180" x2="380" y2="250" stroke="#06b6d4" strokeWidth="3" opacity="0.3" />
                  {simulating && (
                    <line x1="120" y1="180" x2="380" y2="250" stroke="#06b6d4" strokeWidth="4" strokeDasharray="10 10" className="opacity-80 animate-[dash_1s_linear_infinite]" />
                  )}
                  
                  {/* Outlet to Switch (Power) */}
                  <line x1="120" y1="320" x2="380" y2="250" stroke="#f59e0b" strokeWidth="3" opacity="0.3" />
                  {simulating && (
                    <line x1="120" y1="320" x2="380" y2="250" stroke="#f59e0b" strokeWidth="4" strokeDasharray="10 10" className="opacity-80 animate-[dash_1s_linear_infinite]" />
                  )}

                  {/* Switch to APs (Combined PoE) */}
                  {[100, 250, 400].map((y, i) => (
                    <g key={i}>
                      <line x1="420" y1="250" x2="680" y2={y} stroke="#475569" strokeWidth="4" opacity="0.5" />
                      {simulating && (
                        <>
                          <line x1="420" y1="250" x2="680" y2={y} stroke="#f59e0b" strokeWidth="4" strokeDasharray="15 15" className="animate-[dash_1s_linear_infinite]" />
                          <line x1="420" y1="250" x2="680" y2={y} stroke={isDegraded ? "#ef4444" : "#06b6d4"} strokeWidth="4" strokeDasharray="8 22" strokeDashoffset="5" className={`animate-[dash_${isDegraded ? "2s" : "1s"}_linear_infinite] ${isDegraded ? "animate-pulse" : ""}`} />
                        </>
                      )}
                    </g>
                  ))}
                </svg>

                {/* Nodes */}
                <div className="absolute left-[120px] top-[180px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group">
                  <div className="w-16 h-16 bg-[#1a2430] border-2 border-cyan-500/50 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.2)] group-hover:scale-105 transition-transform">
                    <Router className="text-cyan-400" size={32} />
                  </div>
                  <span className="mt-2 text-xs font-bold text-slate-400 uppercase">Core Router</span>
                </div>

                <div className="absolute left-[120px] top-[320px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group">
                  <div className="w-16 h-16 bg-[#1a2430] border-2 border-amber-500/50 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.2)] group-hover:scale-105 transition-transform">
                    <Plug className="text-amber-400" size={32} />
                  </div>
                  <span className="mt-2 text-xs font-bold text-slate-400 uppercase">Wall Power</span>
                </div>

                <div className="absolute left-[400px] top-[250px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group z-10">
                  <div className="w-24 h-24 bg-[#1a2430] border-2 border-teal-500/50 rounded-[20px] flex items-center justify-center shadow-[0_0_40px_rgba(20,184,166,0.3)] group-hover:scale-105 transition-transform">
                    <Network className="text-teal-400" size={48} />
                  </div>
                  <span className="mt-2 text-xs font-bold text-slate-400 uppercase bg-[#0c1219]/80 px-2 py-1 rounded">PoE Switch</span>
                </div>

                {[100, 250, 400].map((y, i) => (
                  <div key={i} className="absolute left-[680px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group" style={{ top: y }}>
                    <div className="w-16 h-16 bg-[#1a2430] border-2 border-white/20 rounded-full flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                      <Wifi className={simulating ? (isDegraded ? "text-amber-500" : "text-cyan-400") : "text-slate-400"} size={32} />
                    </div>
                    <span className="mt-2 text-xs font-bold text-slate-400 uppercase">AP {i + 1}</span>
                  </div>
                ))}
              </>
            )}

            {/* Info Overlay */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#141b24]/90 backdrop-blur-md border border-white/10 px-6 py-3 rounded-full text-center shadow-2xl max-w-2xl w-full mx-4">
              <span className="text-slate-300 text-xs font-medium tracking-wide">
                {getArchitectureDesc()}
              </span>
            </div>

            {/* Global Animation Styles */}
            <style>{`
              @keyframes dash {
                to {
                  stroke-dashoffset: -40;
                }
              }
            `}</style>
          </div>
        </div>
      </div>
    </SimulatorLayout>
  );
}