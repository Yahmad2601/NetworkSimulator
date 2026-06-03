import React, { useState, useEffect } from "react";
import { SlidersVertical, Network, Usb, Router, Play } from "lucide-react";
import SimulatorLayout, { FooterControl } from "../../components/SimulatorLayout";

export default function Layer3Routing() {
  const [phase, setPhase] = useState<"IDLE" | "INGRESS" | "ROUTING" | "EGRESS">("IDLE");
  const [destIp, setDestIp] = useState("10.1.2.55");
  const [ttl, setTtl] = useState<number | null>(null);

  const getPortForIp = (ip: string) => {
    if (ip.startsWith("10.1.2.")) return 1;
    if (ip.startsWith("10.1.")) return 2;
    return 3;
  };

  const targetPort = getPortForIp(destIp);

  const handleSend = () => {
    if (phase !== "IDLE") return;
    setPhase("INGRESS");
    setTtl(64);
  };

  useEffect(() => {
    if (phase === "INGRESS") {
      const timer = setTimeout(() => setPhase("ROUTING"), 1000);
      return () => clearTimeout(timer);
    } else if (phase === "ROUTING") {
      const timer = setTimeout(() => {
        setPhase("EGRESS");
        setTtl(63);
      }, 1500);
      return () => clearTimeout(timer);
    } else if (phase === "EGRESS") {
      const timer = setTimeout(() => setPhase("IDLE"), 1500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [phase]);

  // Using a 800x500 coordinate system centered in the canvas
  const routerPos = { x: 400, y: 250 };
  const port0Pos = { x: 100, y: 350 };
  const port1Pos = { x: 700, y: 100 };
  const port2Pos = { x: 700, y: 250 };
  const port3Pos = { x: 700, y: 400 };

  const getPacketPos = () => {
    if (phase === "IDLE") return port0Pos;
    if (phase === "INGRESS") return routerPos;
    if (phase === "ROUTING") return routerPos;
    if (phase === "EGRESS") {
      if (targetPort === 1) return port1Pos;
      if (targetPort === 2) return port2Pos;
      return port3Pos;
    }
    return port0Pos;
  };

  const pPos = getPacketPos();

  const getStatusText = () => {
    if (phase === "IDLE") return "Packet successfully routed. Ready for next input.";
    if (phase === "INGRESS") return "Receiving packet on Port 0...";
    if (phase === "ROUTING") return "Looking up route in table...";
    if (phase === "EGRESS") return `Forwarding packet to Port ${targetPort}...`;
    return "";
  };

  const routingTable = [
    { prefix: "10.1.2.0/24", port: 1 },
    { prefix: "10.1.0.0/16", port: 2 },
    { prefix: "0.0.0.0/0", port: 3 }
  ];

  const footerControls: FooterControl[] = [
    {
      key: "ip-select",
      type: "segmented",
      options: ["10.1.2.55", "10.1.9.99", "8.8.8.8"],
      value: destIp,
      onChange: (val) => {
        if (phase === "IDLE") setDestIp(String(val));
      }
    },
    {
      key: "send",
      type: "button",
      label: phase === "IDLE" ? "Send Packet" : "Routing...",
      variant: phase === "IDLE" ? "cyan" : "secondary",
      icon: <Play size={12} />,
      onClick: handleSend,
      disabled: phase !== "IDLE"
    },
    { key: "sp", type: "spacer" },
    {
      key: "phase",
      type: "stat",
      stat: { label: "Phase", value: phase, color: "#06b6d4" }
    },
    {
      key: "ttl",
      type: "stat",
      stat: { label: "TTL", value: ttl === null ? "---" : String(ttl), color: "#f59e0b" }
    }
  ];

  return (
    <SimulatorLayout
      title="Layer 3 Routing Simulator"
      subtitle={getStatusText()}
      layerBadge="L3"
      layerColor="#0ea5e9"
      footerControls={footerControls}
    >
      <div className="h-full flex gap-4 p-4 overflow-hidden relative">
        {/* Routing Table Overlay (Absolutely positioned over the centering container) */}
        <div className="absolute left-6 top-6 bg-[#0c1219]/90 backdrop-blur-md border border-white/10 rounded-lg shadow-sm w-64 z-30">
          <div className="px-4 py-2 border-b border-white/5 bg-white/5 rounded-t-lg">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Routing Table</span>
          </div>
          <div className="p-2">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-slate-500">
                  <th className="font-medium pb-2">Prefix / Mask</th>
                  <th className="font-medium pb-2 text-right">Output Port</th>
                </tr>
              </thead>
              <tbody>
                {routingTable.map((route, i) => {
                  const isMatch = phase === "ROUTING" && route.port === targetPort;
                  return (
                    <tr key={i} className={`border-t border-white/5 transition-colors ${isMatch ? "bg-cyan-500/10" : ""}`}>
                      <td className={`py-2 font-mono ${isMatch ? "text-cyan-400 font-bold" : "text-slate-400"}`}>{route.prefix}</td>
                      <td className={`py-2 font-mono text-right ${isMatch ? "text-cyan-400 font-bold" : "text-slate-500"}`}>Port {route.port}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex-1 glass-panel rounded-xl border border-white/5 relative overflow-hidden canvas-grid flex items-center justify-center">
          {/* Centered Canvas Coordinate System Wrapper */}
          <div className="relative w-[800px] h-[500px]" style={{ transform: "scale(0.9)", transformOrigin: "center" }}>
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 500">
              <line x1={port0Pos.x} y1={port0Pos.y} x2={routerPos.x} y2={routerPos.y} stroke="#1e3148" strokeWidth="3" strokeDasharray="8 4" />
              <line x1={routerPos.x} y1={routerPos.y} x2={port1Pos.x} y2={port1Pos.y} stroke="#1e3148" strokeWidth="3" strokeDasharray="8 4" />
              <line x1={routerPos.x} y1={routerPos.y} x2={port2Pos.x} y2={port2Pos.y} stroke="#1e3148" strokeWidth="3" strokeDasharray="8 4" />
              <line x1={routerPos.x} y1={routerPos.y} x2={port3Pos.x} y2={port3Pos.y} stroke="#1e3148" strokeWidth="3" strokeDasharray="8 4" />
            </svg>

            {/* Port 0 */}
            <div className="absolute flex flex-col items-center transform -translate-x-1/2 -translate-y-1/2" style={{ left: port0Pos.x, top: port0Pos.y }}>
              <div className="absolute -top-3 px-2 py-0.5 bg-[#0a0e14] border border-white/10 text-[10px] font-bold text-slate-400 rounded-full shadow-sm z-10 whitespace-nowrap">
                PORT 0 (ETH)
              </div>
              <div className="w-16 h-16 bg-[#0c1219] border-2 border-slate-700/50 rounded-lg flex items-center justify-center shadow-sm relative">
                <SlidersVertical className="text-slate-400" size={28} />
              </div>
            </div>

            {/* Router */}
            <div className="absolute flex flex-col items-center transform -translate-x-1/2 -translate-y-1/2" style={{ left: routerPos.x, top: routerPos.y }}>
              <div className="w-24 h-24 bg-[#0a0e14] border-2 border-cyan-500/30 rounded-2xl flex items-center justify-center shadow-md relative group">
                <div className="absolute inset-0 bg-cyan-500/10 rounded-2xl group-hover:bg-cyan-500/20 transition-colors" />
                <Router className="text-cyan-400 relative z-10" size={40} />
              </div>
            </div>

            {/* Port 1 */}
            <div className="absolute flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2" style={{ left: port1Pos.x, top: port1Pos.y }}>
              <div className="absolute -top-3 px-2 py-0.5 bg-[#0a0e14] border border-white/10 text-[10px] font-bold text-slate-400 rounded-full shadow-sm z-10 whitespace-nowrap">
                PORT 1
              </div>
              <div className="w-16 h-16 bg-[#0c1219] border-2 border-slate-700/50 rounded-lg flex items-center justify-center shadow-sm relative">
                <Network className="text-slate-400" size={28} />
              </div>
            </div>

            {/* Port 2 */}
            <div className="absolute flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2" style={{ left: port2Pos.x, top: port2Pos.y }}>
              <div className="absolute -top-3 px-2 py-0.5 bg-[#0a0e14] border border-white/10 text-[10px] font-bold text-slate-400 rounded-full shadow-sm z-10 whitespace-nowrap">
                PORT 2
              </div>
              <div className="w-16 h-16 bg-[#0c1219] border-2 border-slate-700/50 rounded-lg flex items-center justify-center shadow-sm relative">
                <Network className="text-slate-400" size={28} />
              </div>
            </div>

            {/* Port 3 */}
            <div className="absolute flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2" style={{ left: port3Pos.x, top: port3Pos.y }}>
              <div className="absolute -top-3 px-2 py-0.5 bg-[#0a0e14] border border-white/10 text-[10px] font-bold text-slate-400 rounded-full shadow-sm z-10 whitespace-nowrap">
                PORT 3
              </div>
              <div className="w-16 h-16 bg-[#0c1219] border-2 border-slate-700/50 rounded-lg flex items-center justify-center shadow-sm relative">
                <Usb className="text-slate-400" size={28} />
              </div>
            </div>

            {/* Packet */}
            <div 
              className="absolute rounded-full shadow-md transform -translate-x-1/2 -translate-y-1/2 z-20"
              style={{
                left: pPos.x,
                top: pPos.y,
                transition: phase === "IDLE" ? "none" : "all 1s ease-in-out",
                opacity: phase === "IDLE" ? 0 : 1,
                width: 16,
                height: 16,
                background: "#22d3ee",
                boxShadow: "0 0 15px #22d3ee",
              }}
            />
          </div>
        </div>
      </div>
    </SimulatorLayout>
  );
}


