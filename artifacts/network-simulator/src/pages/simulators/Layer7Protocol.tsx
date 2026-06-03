import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Mail, Download, Search, LayoutTemplate } from "lucide-react";
import SimulatorLayout from "../../components/SimulatorLayout";

type ActionType = "visit" | "email" | "download" | "dns";

interface ProtocolConfig {
  id: ActionType;
  label: string;
  protocol: string;
  color: string;
  icon: React.ReactNode;
  desc: string;
}

const PROTOCOLS: Record<ActionType, ProtocolConfig> = {
  visit: {
    id: "visit",
    label: "Visit Website",
    protocol: "HTTP/HTTPS",
    color: "#06b6d4", // Cyan
    icon: <Globe size={24} />,
    desc: "Formatting and transmitting secure web page data."
  },
  email: {
    id: "email",
    label: "Send Email",
    protocol: "SMTP",
    color: "#14b8a6", // Teal
    icon: <Mail size={24} />,
    desc: "Routing and transmitting outgoing email payloads."
  },
  download: {
    id: "download",
    label: "Download Logs",
    protocol: "FTP",
    color: "#f59e0b", // Amber
    icon: <Download size={24} />,
    desc: "Establishing control and data channels for file transfer."
  },
  dns: {
    id: "dns",
    label: "Find IP Address",
    protocol: "DNS",
    color: "#a855f7", // Purple
    icon: <Search size={24} />,
    desc: "Translating human-readable hostnames into machine-readable IP addresses."
  }
};

export default function Layer7Protocol() {
  const [active, setActive] = useState<ActionType | null>(null);
  const [phase, setPhase] = useState<"idle" | "spawn" | "translate" | "pass">("idle");

  const handleTrigger = (type: ActionType) => {
    if (phase !== "idle") return;
    setActive(type);
    setPhase("spawn");

    setTimeout(() => setPhase("translate"), 800);
    setTimeout(() => setPhase("pass"), 3000);
    setTimeout(() => {
      setPhase("idle");
      setActive(null);
    }, 4500);
  };

  const currentProto = active ? PROTOCOLS[active] : null;

  // Derive status message
  let statusMsg = "Ready";
  if (phase === "spawn") statusMsg = "Awaiting Input...";
  if (phase === "translate") statusMsg = "Translating...";
  if (phase === "pass") statusMsg = "Passing to Layer 6/4...";

  return (
    <SimulatorLayout
      title="OSI Layer 7 Simulator"
      subtitle="Application Layer Operations"
      layerBadge="L7"
      layerColor="#06b6d4"
      footerControls={[]}
    >
      <div className="flex flex-col h-full bg-[#0a0e14] text-slate-400 font-sans overflow-hidden">
        
        {/* Header - Status Metrics */}
        <div className="shrink-0 p-6 flex justify-between items-center border-b border-white/5 bg-[#141b24]">
          <h1 className="text-xl font-bold uppercase tracking-widest text-[#06b6d4] drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]">
            OSI Layer 7 Simulator
          </h1>
          <div className="flex gap-8">
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1">Active Protocol</span>
              <span className={`text-sm font-mono font-bold ${currentProto ? "" : "text-slate-600"}`} style={{ color: currentProto?.color }}>
                {currentProto ? currentProto.protocol : "NONE"}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1">Status</span>
              <span className="text-sm font-mono font-bold text-white">
                {statusMsg}
              </span>
            </div>
          </div>
        </div>

        {/* Interactive Network Canvas */}
        <div className="flex-1 relative bg-[#0c1219] mx-6 my-4 rounded-xl border border-white/5 flex flex-col shadow-[inset_0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
          
          {/* Top Section (User Level) */}
          <div className="w-full flex flex-col items-center pt-8 z-10">
            <div className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-4">Software Application Layer</div>
            <div className="w-[400px] h-24 border-2 border-dashed border-white/10 bg-white/5 rounded-xl flex items-center justify-center relative">
              <span className="text-xs tracking-widest text-slate-600 uppercase font-bold absolute top-2 left-2">
                Layer 7: Application Interface
              </span>
              
              {/* Spawned Block */}
              <AnimatePresence>
                {phase === "spawn" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="w-48 h-12 bg-slate-800 rounded flex items-center justify-center gap-2 border border-slate-600 shadow-lg text-slate-300 font-bold text-xs"
                  >
                    <LayoutTemplate size={16} /> User Request
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Middle Section (Protocol Translation) */}
          <div className="flex-1 relative flex justify-center mt-8">
            <AnimatePresence>
              {(phase === "translate" || phase === "pass") && currentProto && (
                <motion.div
                  initial={{ opacity: 0, y: -100, scale: 0.8 }}
                  animate={{ 
                    opacity: phase === "pass" ? 0 : 1, 
                    y: phase === "pass" ? 250 : 20, 
                    scale: phase === "pass" ? 0.9 : 1 
                  }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                  className="absolute w-[450px] p-6 rounded-xl flex items-center gap-6 shadow-[0_0_30px_rgba(0,0,0,0.2)]"
                  style={{
                    backgroundColor: "#141b24",
                    border: `1px solid ${currentProto.color}50`,
                    boxShadow: `0 0 20px ${currentProto.color}20`,
                  }}
                >
                  <div className="w-16 h-16 rounded-full flex flex-col items-center justify-center shrink-0"
                    style={{ backgroundColor: `${currentProto.color}20`, color: currentProto.color }}
                  >
                    {currentProto.icon}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold uppercase tracking-widest mb-1" style={{ color: currentProto.color }}>
                      {currentProto.protocol} Payload
                    </h2>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {currentProto.desc}
                    </p>
                  </div>
                 </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Section (The Stack) */}
          <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-slate-900/80 to-transparent border-t border-white/5 flex items-end justify-center pb-3 z-20">
            <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500">
              To Lower Layers (Transport / Network) ↓
            </div>
          </div>

        </div>

        {/* Footer Control Bar */}
        <div className="shrink-0 bg-[#141b24] p-6 border-t border-white/5">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-4 w-full text-center">
            Trigger Application Events
          </div>
          <div className="max-w-4xl mx-auto flex flex-wrap gap-4 justify-center">
            {Object.values(PROTOCOLS).map(proto => (
              <button
                key={proto.id}
                onClick={() => handleTrigger(proto.id)}
                disabled={phase !== "idle"}
                className="group relative px-6 py-4 rounded-full border border-white/10 bg-[#0c1219] overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 transition-all duration-300 w-64 shadow-lg"
              >
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                  style={{ backgroundColor: proto.color }} 
                />
                <div className="relative flex items-center justify-center gap-3 font-bold text-sm tracking-wide text-slate-200">
                  <span style={{ color: proto.color }}>
                    {proto.icon}
                  </span>
                  {proto.label}
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </SimulatorLayout>
  );
}