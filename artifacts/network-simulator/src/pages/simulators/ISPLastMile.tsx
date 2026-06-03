import { useState, useEffect } from "react";
import { Cloud, Wifi, Home, Router, Network } from "lucide-react";
import SimulatorLayout, { FooterControl } from "../../components/SimulatorLayout";

type TopologyType = "GPON - Fiber Optic" | "WISP - Radio Link";
type HazardState = "OPTIMAL" | "HEAVY RAINSTORM" | "CONSTRUCTION CABLE CUT";

export default function ISPLastMile() {
  const [topology, setTopology] = useState<TopologyType>("GPON - Fiber Optic");
  const [hazardEnabled, setHazardEnabled] = useState(false);
  const [phase, setPhase] = useState<"IDLE" | "PHASE1" | "PHASE2">("IDLE");
  const [cutPaths, setCutPaths] = useState<boolean[]>([false, false, false, false, false]);
  const [rainDrops, setRainDrops] = useState<boolean[]>([false, false, false, false, false]);

  const handleTransmit = () => {
    if (phase !== "IDLE") return;
    
    // Determine random faults
    if (hazardEnabled) {
      if (topology === "GPON - Fiber Optic") {
        setCutPaths(Array.from({ length: 5 }).map(() => Math.random() > 0.6)); // random cable cuts
        setRainDrops([false, false, false, false, false]);
      } else {
        setCutPaths([false, false, false, false, false]);
        setRainDrops(Array.from({ length: 5 }).map(() => Math.random() > 0.4)); // random packet drop / severe attenuation
      }
    } else {
      setCutPaths([false, false, false, false, false]);
      setRainDrops([false, false, false, false, false]);
    }

    setPhase("PHASE1");

    setTimeout(() => {
      setPhase("PHASE2");
      setTimeout(() => {
        setPhase("IDLE");
      }, 1500); // Wait for Phase 2 completion (1s + leeway)
    }, 1000); // Duration of Phase 1
  };

  const getStatus = (): HazardState => {
    if (!hazardEnabled) return "OPTIMAL";
    return topology === "GPON - Fiber Optic" ? "CONSTRUCTION CABLE CUT" : "HEAVY RAINSTORM";
  };

  const status = getStatus();

  const getLatency = () => {
    if (topology === "GPON - Fiber Optic") {
      return status === "OPTIMAL" ? "5ms" : "∞ (Offline)";
    }
    return status === "OPTIMAL" ? "25ms" : "150ms+ (Lossy)";
  };

  const getDescription = () => {
    if (topology === "GPON - Fiber Optic") {
      return "OLT (Optical Line Terminal) → Splitter → ONT (Optical Network Terminal). Pros: High bandwidth, immune to EMI/weather, low latency.";
    }
    return "Sector Antenna → CPE (Customer Premises Equipment) / Dish. Pros: Fast deployment, bypasses difficult terrain.";
  };

  const footerControls: FooterControl[] = [
    {
      type: "segmented",
      key: "topology",
      options: ["GPON - Fiber Optic", "WISP - Radio Link"],
      value: topology,
      onChange: (val) => {
        setTopology(val as TopologyType);
        setPhase("IDLE");
        setCutPaths([false, false, false, false, false]);
        setRainDrops([false, false, false, false, false]);
      }
    },
    {
      type: "toggle",
      key: "hazard",
      label: "Enable Hazard",
      value: hazardEnabled,
      onChange: (val) => {
        setHazardEnabled(val as boolean);
        setPhase("IDLE");
        // Clear immediately so UI reflects clean state, or keep them until transmit? Let's clear visual hazards if toggled off
        if (!val) {
          setCutPaths([false, false, false, false, false]);
          setRainDrops([false, false, false, false, false]);
        }
      }
    },
    { type: "spacer" },
    {
      type: "button",
      key: "transmit",
      label: "Transmit Data",
      onClick: handleTransmit,
      disabled: phase !== "IDLE",
      variant: "primary"
    }
  ];

  return (
    <SimulatorLayout
      title="ISP Last Mile Simulator"
      subtitle="Last Mile Architecture"
      layerBadge="L1/L2"
      layerColor="#3b82f6"
      footerControls={footerControls}
    >
      <div className="h-full flex flex-col p-6 overflow-hidden">
        {/* Metrics Header */}
        <div className="grid grid-cols-4 gap-4 mb-4 bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Architecture</span>
            <span className="text-sm font-mono text-white">{topology === "GPON - Fiber Optic" ? "GPON" : "WISP"}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Status</span>
            <span className={`text-sm font-mono font-bold ${status === "OPTIMAL" ? "text-green-400" : "text-red-400"}`}>
              {status}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Latency</span>
            <span className="text-sm font-mono text-cyan-400">{getLatency()}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Vulnerability</span>
            <span className="text-sm font-mono text-slate-300">
              {topology === "GPON - Fiber Optic" ? "Construction Cable Cut" : "Heavy Rainstorm"}
            </span>
          </div>
          <div className="col-span-4 mt-2 pt-2 border-t border-white/5 text-xs text-slate-400">
            {getDescription()}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 glass-panel rounded-xl border border-white/5 relative overflow-hidden flex items-center justify-center">
          <div className="relative w-[800px] h-[500px]" style={{ transform: "scale(0.95)", transformOrigin: "center" }}>
            
            {/* Core elements */}
            <div className="absolute left-10 top-1/2 -translate-y-1/2 flex flex-col items-center">
              <Cloud size={64} className="text-blue-400 mb-2" />
              <div className="px-3 py-1 bg-white/5 border border-white/20 rounded-full text-xs font-bold text-slate-300">ISP CORE</div>
            </div>

            {/* Middle Element (Splitter or Mast) */}
            <div className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center z-10">
              {topology === "GPON - Fiber Optic" ? (
                <>
                  <div className="w-12 h-12 flex items-center justify-center bg-[#0a0e14] border-2 border-purple-500/50 rounded z-10 mb-2">
                    <Network className="text-purple-400" size={24} />
                  </div>
                  <div className="px-3 py-1 bg-white/5 border border-white/20 rounded-full text-xs font-bold text-slate-300">OPTICAL SPLITTER</div>
                </>
              ) : (
                <>
                  <div className="relative mb-2 flex items-center justify-center">
                    <Wifi size={80} className="text-blue-500/50 absolute -rotate-90 -left-10" />
                    <span className="text-4xl font-black text-purple-500 tracking-widest z-10" style={{ textShadow: "0 0 10px rgba(168,85,247,0.5)" }}>TOWER</span>
                  </div>
                  <div className="px-3 py-1 bg-white/5 border border-white/20 rounded-full text-xs font-bold text-slate-300 mt-2">SECTOR MAST</div>
                </>
              )}
            </div>

            {/* Target Homes */}
            {Array.from({ length: 5 }).map((_, i) => {
              const startX = 400; // center
              const startY = 250;
              const endX = 700;
              const yPositions = [80, 170, 260, 350, 440];
              const endY = yPositions[i];
              
              const isCut = cutPaths[i];
              const isRain = topology === "WISP - Radio Link" && hazardEnabled;
              const willDrop = isRain && rainDrops[i];

              const midX = startX + (endX - startX) * 0.4;
              const midY = startY + (endY - startY) * 0.4;

              return (
                <div key={i}>
                  {/* Connection Lines */}
                  {topology === "GPON - Fiber Optic" ? (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 500">
                      {/* Core to Splitter stays solid (drawn in only index 0 to avoid duplicates) */}
                      {i === 0 && <line x1="84" y1="250" x2="400" y2="250" stroke="#3b82f6" strokeWidth="4" />}
                      
                      {/* Splitter to properties */}
                      <path 
                        d={`M ${startX} ${startY} L ${endX - 30} ${endY}`} 
                        stroke={isCut ? "#ef4444" : "#3b82f6"} 
                        strokeWidth="3" 
                        strokeDasharray={isCut ? "4 4" : "none"}
                        fill="none" 
                      />
                      {isCut && (
                        <text x={midX} y={midY - 10} fill="#ef4444" fontSize="24" fontWeight="bold">X</text>
                      )}
                    </svg>
                  ) : (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 500">
                      {i === 0 && <line x1="84" y1="250" x2="400" y2="250" stroke="#64748b" strokeWidth="2" strokeDasharray="6 6" />}
                      <path 
                        d={`M ${startX} ${startY} Q ${(startX+endX)/2} ${startY + (endY-startY)/2 - (isRain?20:0)} ${endX - 30} ${endY}`} 
                        stroke={isRain ? "#ef4444" : "#3b82f6"} 
                        strokeWidth="2" 
                        strokeDasharray="4 4"
                        opacity={isRain ? "0.3" : "0.5"}
                        fill="none" 
                      />
                    </svg>
                  )}

                  {/* Destination House */}
                  <div className="absolute flex flex-col items-center" style={{ left: endX, top: endY, transform: "translate(-50%, -50%)" }}>
                    <div className="mb-1 text-blue-400">
                      {topology === "WISP - Radio Link" ? (
                        <Wifi size={16} className={isRain ? "text-red-400/50" : ""} />
                      ) : (
                        <Router size={16} className={isCut ? "text-red-400" : ""} />
                      )}
                    </div>
                    <Home size={32} className={topology === "GPON - Fiber Optic" && isCut ? "text-slate-600" : "text-slate-300"} />
                  </div>

                  {/* Phase 1 Packet: Core to Splitter (Drawn only once) */}
                  {i === 0 && phase === "PHASE1" && (
                    <div 
                      className="absolute w-4 h-4 bg-white rounded-full shadow-[0_0_15px_#ffffff] z-20"
                      style={{
                        animation: `coreToMiddle 1s ease-in-out forwards`,
                        left: 84,
                        top: 250,
                      }}
                    />
                  )}

                  {/* Phase 2 Packets: Splitter to Homes */}
                  {phase === "PHASE2" && (
                    <div 
                      className="absolute w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_10px_#22d3ee] z-20"
                      style={{
                        animation: isCut
                          ? `middleToCut${i} 0.5s ease-in forwards ${i * 100}ms`
                          : willDrop
                          ? `middleToCut${i} 0.5s ease-in forwards ${i * 100}ms`
                          : `middleToHome${i} 1s ease-out forwards ${i * 100}ms`,
                        left: startX,
                        top: startY,
                        opacity: 0 // Fades in instantly inside animation
                      }}
                    />
                  )}
                  
                  {/* Custom Animations */}
                  <style>{`
                    ${i === 0 ? `
                    @keyframes coreToMiddle {
                      0% { opacity: 1; transform: translate(0, 0); }
                      100% { opacity: 1; transform: translate(${400 - 84}px, 0); }
                    }
                    ` : ""}

                    @keyframes middleToHome${i} {
                      0% { opacity: 1; transform: translate(0, 0); }
                      90% { opacity: 1; transform: translate(${endX - startX}px, ${endY - startY}px); }
                      100% { opacity: 0; transform: translate(${endX - startX}px, ${endY - startY}px); }
                    }

                    @keyframes middleToCut${i} {
                      0% { opacity: 1; transform: translate(0, 0); }
                      95% { opacity: 1; transform: translate(${midX - startX}px, ${midY - startY}px); }
                      100% { opacity: 0; transform: translate(${midX - startX}px, ${midY - startY}px); }
                    }
                  `}</style>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </SimulatorLayout>
  );
}