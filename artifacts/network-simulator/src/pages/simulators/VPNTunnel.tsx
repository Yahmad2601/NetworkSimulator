import { useState, useEffect } from "react";
import { Laptop, ShieldAlert, Server, Globe as GlobeIcon, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import SimulatorLayout, { FooterControl } from "../../components/SimulatorLayout";

type Mode = "Direct Connection" | "VPN Tunnel";
type SimStatus = "idle" | "transmitting" | "blocked" | "success";

export default function VPNTunnel() {
  const [mode, setMode] = useState<Mode>("Direct Connection");
  const [simStatus, setSimStatus] = useState<SimStatus>("idle");
  const [animPhase, setAnimPhase] = useState(0);

  // Nodes Coordinates
  const USER_X = 100;
  const FW_X = 300;
  const VPN_X = 500;
  const DEST_X = 700;
  const Y = 250;

  const handleSimulate = () => {
    if (simStatus === "transmitting") return;
    
    // Reset state instantly to phase 1 (at the source)
    setSimStatus("transmitting");
    setAnimPhase(1); 

    // Once DOM allows Phase 1 to render, start moving to Phase 2
    setTimeout(() => {
      setAnimPhase(2); // Slide to Firewall

      if (mode === "Direct Connection") {
        setTimeout(() => {
          setSimStatus("blocked");
        }, 1500);
      } else {
        setTimeout(() => setAnimPhase(3), 1500); // Slide to VPN Server
        setTimeout(() => setAnimPhase(4), 3000); // Slide to Social Media
        setTimeout(() => setSimStatus("success"), 4500);
      }
    }, 50);
  };

  const getSubtitle = () => {
    return mode === "Direct Connection"
      ? "Without encapsulation, the firewall reads the destination IP and drops the packet."
      : "VPN encapsulation hides the true destination inside a wrapper, bypassing the firewall.";
  };

  const handleReset = () => {
    setSimStatus("idle");
    setAnimPhase(0);
  };

  const footerControls: FooterControl[] = [
    {
      type: "segmented",
      key: "mode",
      options: ["Direct Connection", "VPN Tunnel"],
      value: mode,
      onChange: (val) => {
        setMode(val as Mode);
        setSimStatus("idle");
        setAnimPhase(0);
      }
    },
    { type: "spacer" },
    {
      type: "button",
      key: "reset",
      label: "Reset",
      onClick: handleReset,
      variant: "secondary",
      icon: <RotateCcw size={16} />
    },
    {
      type: "button",
      key: "simulate",
      label: "Send Web Request",
      onClick: handleSimulate,
      disabled: simStatus === "transmitting",
      variant: mode === "VPN Tunnel" ? "cyan" : "danger",
      icon: <GlobeIcon size={16} />
    }
  ];

  return (
    <SimulatorLayout
      title="VPN Tunnel & Encapsulation Simulator"
      subtitle={getSubtitle()}
      layerBadge="L3/L4"
      layerColor={mode === "VPN Tunnel" ? "#a855f7" : "#06b6d4"}
      footerControls={footerControls}
      sidebar={
        <div className="p-6 flex flex-col h-full bg-[#0d1520]">
          <div className="bg-[#141b24] border border-white/10 p-4 rounded-lg shadow-sm w-full">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/5">
              <ShieldAlert className="text-slate-400" size={16} />
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">How DPI Works</h3>
            </div>
            <ul className="space-y-3 text-xs text-slate-400 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold mt-0.5">•</span>
                <span><strong className="text-white">ENCAPSULATION:</strong> The VPN client wraps your packet in a second packet.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold mt-0.5">•</span>
                <span>The 'Outer IP' points to the VPN server, hiding the real destination.</span>
              </li>
              <li className="flex items-start gap-2 mt-3 pt-3 border-t border-white/5">
                <span className="text-red-400 font-bold mt-0.5">↳</span>
                <span className="italic">DPI (Deep Packet Inspection): Firewalls check Outer IPs to block access. If the outer IP is allowed, it passes.</span>
              </li>
            </ul>
          </div>
        </div>
      }
    >
      <div className="h-full flex flex-col p-6 overflow-hidden">
        {/* Metrics Header */}
        <div className="grid grid-cols-3 gap-4 mb-4 bg-[#141b24] border border-white/5 rounded-lg p-4 shadow-lg shrink-0">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">System</span>
            <span className={`text-sm font-mono font-bold ${
              simStatus === "transmitting" ? "text-amber-400 animate-pulse" :
              simStatus === "success" ? "text-cyan-400" :
              simStatus === "blocked" ? "text-red-400" : "text-slate-400"
            }`}>
              {simStatus === "transmitting" ? "TRANSMITTING..." : 
               simStatus === "success" ? "CONNECTION ESTABLISHED" :
               simStatus === "blocked" ? "CONNECTION DROPPED" : "READY"}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Selected Mode</span>
            <span className={`text-sm font-mono font-bold ${mode === "VPN Tunnel" ? "text-purple-400" : "text-cyan-400"}`}>
              {mode.toUpperCase()}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Firewall Rule</span>
            <span className="text-sm font-mono font-bold text-red-400">
              BLOCK SOCIAL MEDIA
            </span>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-[#0c1219] rounded-xl border border-white/5 relative overflow-hidden flex items-center justify-center shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]">
          <div className="relative w-[800px] h-[500px]" style={{ transform: "scale(0.95)", transformOrigin: "center" }}>

            {/* Connection Lines (SVG) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 800 500">
              {/* Line: User to FW */}
              <line x1={USER_X} y1={Y} x2={FW_X} y2={Y} 
                stroke={mode === "VPN Tunnel" ? "#a855f7" : "#06b6d4"} 
                strokeWidth="2" strokeDasharray="6 6" className="opacity-30" 
              />
              
              {/* Line: FW to VPN (if tunnel) */}
              {mode === "VPN Tunnel" && (
                <line x1={FW_X} y1={Y} x2={VPN_X} y2={Y} 
                  stroke="#a855f7" strokeWidth="2" strokeDasharray="6 6" className="opacity-30" 
                />
              )}
              {/* Line: VPN to Dest (if tunnel) */}
              {mode === "VPN Tunnel" && (
                <line x1={VPN_X} y1={Y} x2={DEST_X} y2={Y} 
                  stroke="#06b6d4" strokeWidth="2" strokeDasharray="6 6" className="opacity-30" 
                />
              )}
              {/* Line: FW to Dest (if direct) */}
              {mode === "Direct Connection" && (
                <line x1={FW_X} y1={Y} x2={DEST_X} y2={Y} 
                  stroke="#ef4444" strokeWidth="2" strokeDasharray="6 6" className="opacity-30" 
                />
              )}

              {/* Animated Path (User -> FW) */}
              {animPhase >= 1 && (
                <line x1={USER_X} y1={Y} x2={FW_X} y2={Y} 
                  stroke={mode === "VPN Tunnel" ? "#a855f7" : "#06b6d4"} 
                  strokeWidth="4" strokeDasharray="8 12" 
                  className={simStatus === "transmitting" ? "animate-[dash_1s_linear_infinite]" : "opacity-0"}
                />
              )}

              {/* Animated Path (FW -> VPN) */}
              {mode === "VPN Tunnel" && animPhase >= 2 && animPhase < 3 && (
                <line x1={FW_X} y1={Y} x2={VPN_X} y2={Y} 
                  stroke="#a855f7" strokeWidth="4" strokeDasharray="8 12" 
                  className="animate-[dash_1s_linear_infinite]"
                />
              )}

              {/* Animated Path (VPN -> Dest) */}
              {mode === "VPN Tunnel" && animPhase >= 3 && animPhase < 4 && (
                <line x1={VPN_X} y1={Y} x2={DEST_X} y2={Y} 
                  stroke="#06b6d4" strokeWidth="4" strokeDasharray="8 12" 
                  className="animate-[dash_1s_linear_infinite]"
                />
              )}
            </svg>

            {/* User Node */}
            <div className="absolute left-[100px] top-[250px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
              <div className="w-16 h-16 bg-[#1a2430] border-2 border-cyan-500/50 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                <Laptop className="text-cyan-400" size={30} />
              </div>
              <span className="mt-3 text-xs font-bold text-slate-300 uppercase bg-[#0c1219]/80 px-2 py-1 rounded border border-white/5">User Device</span>
              <span className="mt-1 text-[10px] text-cyan-400 font-mono">IP: 10.0.0.5</span>
            </div>

            {/* Firewall Node */}
            <div className="absolute left-[300px] top-[250px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 group">
              <div className={`w-16 h-16 bg-[#1a2430] border-2 rounded-full flex items-center justify-center transition-all duration-300
                ${
                  (mode === "Direct Connection" && animPhase === 2 && simStatus === "blocked") 
                    ? "border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.6)]" 
                    : (mode === "VPN Tunnel" && animPhase >= 2 && simStatus !== "idle")
                    ? "border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.4)]"
                    : "border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.1)]"
                }
              `}>
                <ShieldAlert className={
                  (mode === "Direct Connection" && animPhase === 2 && simStatus === "blocked") ? "text-red-400" 
                  : (mode === "VPN Tunnel" && animPhase >= 2 && simStatus !== "idle") ? "text-emerald-400"
                  : "text-red-400/70"
                } size={30} />
              </div>
              <span className="mt-3 text-xs font-bold text-slate-300 uppercase bg-[#0c1219]/80 px-2 py-1 rounded border border-white/5">Corp Firewall</span>
              <span className={`mt-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                simStatus === "blocked" ? "bg-red-500/20 text-red-400" :
                (mode === "VPN Tunnel" && animPhase >= 2 && simStatus !== "idle") ? "bg-emerald-500/20 text-emerald-400" : "text-slate-500"
              }`}>
                {simStatus === "blocked" ? "BLOCKED" : 
                 (mode === "VPN Tunnel" && animPhase >= 2 && simStatus !== "idle") ? "ALLOWED" : "INSPECTING"}
              </span>
            </div>

            {/* VPN Server Node */}
            <div className={`absolute left-[500px] top-[250px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 transition-all duration-500
              ${mode === "VPN Tunnel" ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none"}
            `}>
              <div className="w-16 h-16 bg-[#1a2430] border-2 border-purple-500/50 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                <Server className="text-purple-400" size={30} />
              </div>
              <span className="mt-3 text-xs font-bold text-slate-300 uppercase bg-[#0c1219]/80 px-2 py-1 rounded border border-white/5">VPN Server</span>
              <span className="mt-1 text-[10px] text-purple-400 font-mono">IP: 198.51.100.1</span>
            </div>

            {/* Target Node */}
            <div className="absolute left-[700px] top-[250px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
              <div className={`w-16 h-16 bg-[#1a2430] border-2 rounded-full flex items-center justify-center transition-all duration-500
                ${simStatus === "success" ? "border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.5)]" : "border-amber-500/30"}
              `}>
                <GlobeIcon className={simStatus === "success" ? "text-amber-400" : "text-amber-500/50"} size={30} />
              </div>
              <span className="mt-3 text-xs font-bold text-amber-500/80 uppercase bg-[#0c1219]/80 px-2 py-1 rounded border border-amber-500/20">Social Media</span>
              <span className="mt-1 text-[10px] text-amber-500/50 font-mono">IP: 203.0.113.5</span>
            </div>

            {/* Packet Animation */}
            {simStatus !== "idle" && animPhase > 0 && (
              <div 
                className={`absolute z-20 flex items-center justify-center rounded-sm font-mono tracking-wider font-bold transition-all duration-[1500ms] ease-linear`}
                style={{
                  left: animPhase === 1 ? USER_X : 
                        animPhase === 2 ? FW_X : 
                        animPhase === 3 ? VPN_X : DEST_X,
                  top: Y,
                  transform: "translate(-50%, -50%)",
                  opacity: (mode === "Direct Connection" && animPhase === 2 && simStatus === "blocked") ? 0 : 1,
                  width: mode === "VPN Tunnel" && animPhase < 3 ? '85px' : '56px',
                  height: mode === "VPN Tunnel" && animPhase < 3 ? '48px' : '32px'
                }}
              >
                {mode === "Direct Connection" ? (
                  // Normal Packet
                  <div className="w-14 h-8 bg-cyan-500/20 border border-cyan-400 text-cyan-400 flex items-center justify-center text-[10px] shadow-[0_0_15px_rgba(6,182,212,0.3)] backdrop-blur-sm relative group">
                    DATA
                    {simStatus === "blocked" && <XCircle size={28} className="absolute text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,1)] z-30 opacity-100 transition-opacity duration-300" />}
                  </div>
                ) : (
                  // VPN Mode Path Checks
                  animPhase < 3 ? (
                    // Encapsulated
                    <div className="w-full h-full bg-purple-500/20 border-2 border-purple-400 text-purple-200 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)] backdrop-blur-md relative rounded-md">
                      <div className="w-10 h-6 bg-cyan-500/40 border border-cyan-400/50 text-cyan-100 flex items-center justify-center text-[8px] rounded-sm">
                        DATA
                      </div>
                      <div className="absolute -top-5 text-[9px] text-purple-400 font-bold whitespace-nowrap bg-[#0a0e14]/90 px-1.5 py-0.5 rounded shadow-xl border border-white/5">VPN WRAPPER</div>
                    </div>
                  ) : (
                    // Decapsulated (Naked Packet again after VPN server)
                    <div className="w-14 h-8 bg-cyan-500/20 border border-cyan-400 text-cyan-400 flex items-center justify-center text-[10px] shadow-[0_0_15px_rgba(6,182,212,0.3)] backdrop-blur-sm transition-all duration-300">
                      DATA
                    </div>
                  )
                )}
              </div>
            )}

            {/* Blocked message popup */}
            {mode === "Direct Connection" && simStatus === "blocked" && (
              <div className="absolute z-30" style={{ left: FW_X, top: Y - 60, transform: "translateX(-50%)" }}>
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-3 py-1.5 rounded text-xs font-bold font-mono shadow-[0_0_20px_rgba(239,68,68,0.3)] backdrop-blur-md whitespace-nowrap animate-in fade-in slide-in-from-bottom-2">
                  Request Blocked! Destination not allowed.
                </div>
              </div>
            )}

            {/* Success message popup */}
            {simStatus === "success" && (
              <div className="absolute z-30" style={{ left: DEST_X, top: Y - 60, transform: "translateX(-50%)" }}>
                <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 px-3 py-1.5 rounded text-xs font-bold font-mono shadow-[0_0_20px_rgba(16,185,129,0.3)] backdrop-blur-md whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 flex items-center gap-1.5">
                  <CheckCircle2 size={14} />
                  Request Successful!
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Global Context Styles */}
        <style>{`
          @keyframes dash {
            to { stroke-dashoffset: -40; }
          }
        `}</style>
      </div>
    </SimulatorLayout>
  );
}