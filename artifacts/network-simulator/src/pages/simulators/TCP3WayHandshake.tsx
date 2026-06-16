import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Laptop, Server as ServerIcon, Play, RefreshCw } from "lucide-react";
import SimulatorLayout, { FooterControl } from "../../components/SimulatorLayout";

export default function TCP3WayHandshake() {
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);

  // States
  const clientState = step === 0 ? "CLOSED" : step === 1 ? "SYN-SENT" : step >= 3 ? "ESTABLISHED" : "SYN-SENT";
  const serverState = step === 0 ? "LISTEN" : step === 1 ? "LISTEN" : step === 2 ? "SYN-RECEIVED" : "ESTABLISHED";
  const activeFlag = step === 0 ? "None" : step === 1 ? "[SYN]" : step === 2 ? "[SYN, ACK]" : "[ACK]";
  
  const clientSeq = step === 0 ? "-" : step >= 3 ? 1 : 0;
  const clientAck = step >= 3 ? 1 : "-";
  
  const serverSeq = step >= 2 ? 0 : "-";
  const serverAck = step >= 2 ? 1 : "-";

  const getInfoText = () => {
    switch (step) {
      case 0: return "Connection is closed. The server is listening for incoming connection requests.";
      case 1: return "Client sends a SYN packet with a random Sequence Number (0) to ask the server to synchronize.";
      case 2: return "Server acknowledges the Client's request (ACK=1) and sends its own SYN request with its own random Sequence Number (0).";
      case 3: return "Client acknowledges the Server's SYN. The three-way handshake is complete and the connection is now fully established. Data transfer can begin.";
      default: return "";
    }
  };

  const currentInfo = getInfoText();

  const handleNextStep = () => {
    if (step >= 3 || animating) return;
    setAnimating(true);
    // Move to next step immediately for animation
    setStep(s => s + 1);
  };

  // Animation complete effect
  useEffect(() => {
    if (!animating) return undefined;
    const timer = setTimeout(() => {
      setAnimating(false);
    }, 1500); // 1.5s transit animation
    return () => clearTimeout(timer);
  }, [animating, step]);

  const reset = () => {
    if (animating) return;
    setStep(0);
  };

  const getButtonProps = () => {
    switch (step) {
      case 0: return { label: "Step 1: Send SYN", variant: "cyan" as const, disabled: false };
      case 1: return { label: "Step 2: Send SYN-ACK", variant: "purple" as const, disabled: animating };
      case 2: return { label: "Step 3: Send ACK", variant: "teal" as const, disabled: animating };
      case 3: return { label: "Connection Established", variant: "secondary" as const, disabled: true };
      default: return { label: "Completed", variant: "secondary" as const, disabled: true };
    }
  };

  const btnProps = getButtonProps();

  const footerControls: FooterControl[] = [
    { key: "sp1", type: "spacer" },
    {
      key: "next", type: "button",
      label: btnProps.label,
      variant: btnProps.variant,
      icon: step < 3 ? <Play size={12} /> : undefined,
      onClick: handleNextStep,
      disabled: btnProps.disabled
    },
    { key: "sp2", type: "spacer" },
    {
      key: "reset", type: "button",
      label: "Reset Connection",
      variant: "secondary",
      icon: <RefreshCw size={12} />,
      onClick: reset,
      disabled: animating
    }
  ];

  // Packet configuration based on current step
  const packetColor = step === 1 ? "#06b6d4" : step === 2 ? "#a855f7" : "#14b8a6";
  const packetIsClientToServer = step === 1 || step === 3;
  const packetLabel = step === 1 ? "[SYN]" : step === 2 ? "[SYN, ACK]" : "[ACK]";

  return (
    <SimulatorLayout
      title="TCP 3-Way Handshake"
      subtitle="Connection Establishment"
      layerBadge="L4"
      layerColor="#06b6d4"
      footerControls={footerControls}
    >
      <div className="h-full flex flex-col p-4 select-none overflow-hidden text-slate-400 bg-[#0a0e14]">
        
        {/* Header Status Metrics */}
        <div className="grid grid-cols-3 gap-3 shrink-0 mb-4">
          {[
            { label: "CLIENT STATE", value: clientState, color: clientState === "ESTABLISHED" ? "#14b8a6" : clientState === "CLOSED" ? "#475569" : "#06b6d4" },
            { label: "SERVER STATE", value: serverState, color: serverState === "ESTABLISHED" ? "#14b8a6" : serverState === "LISTEN" ? "#475569" : "#a855f7" },
            { label: "ACTIVE FLAG", value: activeFlag, color: activeFlag === "None" ? "#475569" : activeFlag === "[SYN]" ? "#06b6d4" : activeFlag === "[SYN, ACK]" ? "#a855f7" : "#14b8a6" },
          ].map(item => (
            <div key={item.label} className="glass-panel border border-white/5 bg-[#141b24] p-3 rounded-xl shadow-lg flex flex-col items-center">
              <div className="text-[10px] uppercase tracking-widest mb-1">{item.label}</div>
              <div className="font-mono font-bold text-lg" style={{ color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Interactive Network Canvas */}
        <div className="flex-1 relative border border-white/5 rounded-xl bg-[#0c1219] p-6 shadow-[inset_0_0_30px_rgba(0,0,0,0.4)] flex items-center justify-between overflow-hidden">
          
          {/* Airspace Dashboard Line */}
          <div className="absolute left-[15%] right-[15%] h-px border-t-2 border-dashed border-white/10 top-1/2 -translate-y-1/2 z-0" />

          {/* Client Node (Left) */}
          <div className="relative z-10 flex flex-col items-center gap-4 w-48">
            <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center bg-[#141b24] transition-colors duration-500 shadow-xl ${clientState === 'ESTABLISHED' ? 'border-[#14b8a6] shadow-[0_0_20px_rgba(20,184,166,0.3)]' : 'border-[#06b6d4] shadow-[0_0_20px_rgba(6,182,212,0.3)]'}`}>
              <Laptop size={40} className={clientState === 'ESTABLISHED' ? 'text-[#14b8a6]' : 'text-[#06b6d4]'} />
            </div>
            <div className="glass-panel border border-white/5 bg-[#141b24] p-3 rounded-lg flex flex-col items-center w-full">
              <span className="text-[11px] uppercase tracking-widest font-bold text-white mb-2">Client Node</span>
              <div className="w-full text-[10px] font-mono flex justify-between">
                <span>Seq:</span>
                <span className="text-white">{clientSeq}</span>
              </div>
              <div className="w-full text-[10px] font-mono flex justify-between">
                <span>Ack:</span>
                <span className="text-white">{clientAck}</span>
              </div>
            </div>
          </div>

          {/* Packet Animation */}
          <div className="absolute left-[20%] right-[20%] h-20 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
            <AnimatePresence>
              {animating && step > 0 && (
                <motion.div
                  key={`packet-${step}`}
                  initial={{ left: packetIsClientToServer ? "0%" : "100%", x: "-50%", y: "-50%", top: "50%", opacity: 0, scale: 0.5 }}
                  animate={{ left: packetIsClientToServer ? "100%" : "0%", opacity: [0, 1, 1, 0], scale: [0.5, 1, 1, 0.5] }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  className="absolute"
                >
                  <div 
                    className="backdrop-blur-md border border-white/20 px-4 py-2 font-mono text-[11px] font-bold rounded shadow-lg whitespace-nowrap"
                    style={{
                      backgroundColor: `${packetColor}20`,
                      borderColor: packetColor,
                      color: packetColor,
                      boxShadow: `0 0 15px ${packetColor}60`
                    }}
                  >
                    {packetLabel}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Server Node (Right) */}
          <div className="relative z-10 flex flex-col items-center gap-4 w-48">
            <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center bg-[#141b24] transition-colors duration-500 shadow-xl ${serverState === 'ESTABLISHED' ? 'border-[#14b8a6] shadow-[0_0_20px_rgba(20,184,166,0.3)]' : 'border-[#a855f7] shadow-[0_0_20px_rgba(168,85,247,0.3)]'}`}>
              <ServerIcon size={40} className={serverState === 'ESTABLISHED' ? 'text-[#14b8a6]' : 'text-[#a855f7]'} />
            </div>
            <div className="glass-panel border border-white/5 bg-[#141b24] p-3 rounded-lg flex flex-col items-center w-full">
              <span className="text-[11px] uppercase tracking-widest font-bold text-white mb-2">Server Node</span>
              <div className="w-full text-[10px] font-mono flex justify-between">
                <span>Seq:</span>
                <span className="text-white">{serverSeq}</span>
              </div>
              <div className="w-full text-[10px] font-mono flex justify-between">
                <span>Ack:</span>
                <span className="text-white">{serverAck}</span>
              </div>
            </div>
          </div>

          {/* Packet Inspector Info Box */}
          <div className="absolute bottom-4 left-4 max-w-sm">
            <div className="glass-panel border border-white/10 bg-[#141b24]/90 backdrop-blur-md p-4 rounded-xl shadow-2xl">
              <div className="text-[10px] uppercase tracking-widest text-[#06b6d4] font-bold mb-2">Packet Inspector</div>
              <p className="text-sm text-slate-300 leading-relaxed">
                {currentInfo}
              </p>
            </div>
          </div>
        </div>

      </div>
    </SimulatorLayout>
  );
}
