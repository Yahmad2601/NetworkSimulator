import { useState, useEffect } from "react";
import { Hammer, CircleCheck, Terminal } from "lucide-react";
import SimulatorLayout, { FooterControl } from "../../components/SimulatorLayout";

type SimStatus = "idle" | "building" | "success";

export default function EthernetFrame() {
  const [payloadInput, setPayloadInput] = useState("");
  const [simStatus, setSimStatus] = useState<SimStatus>("idle");
  const [step, setStep] = useState(0);
  const [fcsFlash, setFcsFlash] = useState("");

  const handleBuild = () => {
    if (simStatus === "building" || !payloadInput.trim()) return;
    
    setSimStatus("building");
    setStep(1); // Step 1: Payload

    setTimeout(() => setStep(2), 1000); // Step 2: Addressing (MACs)
    setTimeout(() => setStep(3), 2500); // Step 3: Protocol (EtherType)
    setTimeout(() => setStep(4), 3500); // Step 4: FCS calculation starts
    setTimeout(() => setStep(5), 5000); // Step 5: Preamble sync
    setTimeout(() => {
      setStep(6); // Step 6: Transmission ready
      setSimStatus("success");
    }, 6500);
  };

  const handleReset = () => {
    setSimStatus("idle");
    setStep(0);
    setPayloadInput("");
    setFcsFlash("");
  };

  // FCS flash effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 4) {
      interval = setInterval(() => {
        const randomHex = Math.floor(Math.random() * 0xffffffff).toString(16).toUpperCase().padStart(8, '0');
        setFcsFlash(`0x${randomHex}`);
      }, 50);
    } else if (step > 4) {
      setFcsFlash("0x4A3B2C1D");
    }
    return () => clearInterval(interval);
  }, [step]);

  const footerControls: FooterControl[] = [
    { type: "spacer" },
    {
      type: "button",
      key: "reset",
      label: "Reset",
      onClick: handleReset,
      variant: "secondary"
    },
    {
      type: "button",
      key: "build",
      label: "Build and Send Frame",
      onClick: handleBuild,
      disabled: simStatus === "building" || simStatus === "success" || !payloadInput.trim(),
      variant: "cyan",
      icon: <Hammer size={16} />
    }
  ];

  return (
    <SimulatorLayout
      title="Ethernet Frame Builder"
      subtitle="Assemble an IEEE 802.3 Data Link frame step-by-step"
      layerBadge="L2"
      layerColor="#06b6d4"
      footerControls={footerControls}
      sidebar={
        <div className="p-6 flex flex-col h-full bg-[#0d1520]">
          <div className="bg-[#141b24] border border-white/10 p-4 rounded-lg shadow-sm w-full">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/5">
              <Terminal className="text-slate-400" size={16} />
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Frame Structure</h3>
            </div>
            <ul className="space-y-3 text-xs text-slate-400 leading-relaxed">
              <li className="flex flex-col gap-1">
                <span className="text-slate-400 font-bold"><span className="text-slate-400 mr-1">•</span>PREAMBLE & SFD (8 Bytes)</span>
                <span className="pl-3 opacity-80">Synchronizes receiver clocks (101010...) ending in 11.</span>
              </li>
              <li className="flex flex-col gap-1">
                <span className="text-cyan-400 font-bold"><span className="text-cyan-400 mr-1">•</span>DEST & SRC MAC (12 Bytes)</span>
                <span className="pl-3 opacity-80">Physical hardware addresses for delivery.</span>
              </li>
              <li className="flex flex-col gap-1">
                <span className="text-amber-400 font-bold"><span className="text-amber-400 mr-1">•</span>ETHERTYPE (2 Bytes)</span>
                <span className="pl-3 opacity-80">Identifies the payload protocol (e.g., 0x0800 = IPv4).</span>
              </li>
              <li className="flex flex-col gap-1">
                <span className="text-cyan-400 font-bold"><span className="text-cyan-400 mr-1">•</span>PAYLOAD (46 - 1500 Bytes)</span>
                <span className="pl-3 opacity-80">The actual data being transported.</span>
              </li>
              <li className="flex flex-col gap-1">
                <span className="text-red-400 font-bold"><span className="text-red-400 mr-1">•</span>FCS / CRC32 (4 Bytes)</span>
                <span className="pl-3 opacity-80">Mathematical hash to detect transmission errors.</span>
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
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Status</span>
            <span className={`text-sm font-mono font-bold ${
              simStatus === "building" ? "text-amber-400 animate-pulse" :
              simStatus === "success" ? "text-cyan-400" : "text-slate-400"
            }`}>
              {simStatus === "building" ? "BUILDING FRAME..." : 
               simStatus === "success" ? "READY FOR TRANSMISSION" : "IDLE"}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Standard</span>
            <span className="text-sm font-mono font-bold text-white">
              IEEE 802.3
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Layer</span>
            <span className="text-sm font-mono font-bold text-cyan-400">
              2 (DATA LINK)
            </span>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-[#0c1219] rounded-xl border border-white/5 relative overflow-hidden flex flex-col items-center justify-center shadow-[inset_0_0_50px_rgba(0,0,0,0.5)] p-8">
          
          {/* Frame Container */}
          <div className={`w-full flex transition-all duration-1000 ${step >= 6 ? 'scale-95 drop-shadow-[0_0_30px_rgba(6,182,212,0.3)]' : 'scale-100'}`}>
            
            {/* Preamble */}
            <div className="flex-none w-[12%] flex flex-col gap-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center border border-slate-500/30 rounded-full px-2 py-1 mx-1 bg-slate-500/10">Preamble</div>
              <div className={`h-24 border-y border-l border-white/20 bg-[#1a2430] flex items-center justify-center px-2 transition-all duration-500 overflow-hidden ${step >= 5 ? 'opacity-100' : 'opacity-0'}`}>
                <span className="font-mono text-xs text-slate-300 break-all leading-tight text-center">
                  1010101<br/>10101011
                </span>
              </div>
            </div>

            {/* Dest MAC */}
            <div className="flex-none w-[16%] flex flex-col gap-2">
              <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest text-center border border-cyan-500/30 rounded-full px-2 py-1 mx-1 bg-cyan-500/10">Dest MAC</div>
              <div className={`h-24 border-y border-l border-white/20 bg-[#1a2430] flex items-center justify-center px-2 transition-all duration-500 overflow-hidden ${step >= 2 ? 'opacity-100' : 'opacity-0'}`}>
                <span className="font-mono text-xs md:text-sm text-cyan-300 whitespace-nowrap text-center">00:1A:2B<br/>3C:4D:5E</span>
              </div>
            </div>

            {/* Source MAC */}
            <div className="flex-none w-[16%] flex flex-col gap-2">
              <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest text-center border border-cyan-500/30 rounded-full px-2 py-1 mx-1 bg-cyan-500/10">Src MAC</div>
              <div className={`h-24 border-y border-l border-white/20 bg-[#1a2430] flex items-center justify-center px-2 transition-all duration-500 overflow-hidden ${step >= 2 ? 'opacity-100' : 'opacity-0'}`}>
                <span className="font-mono text-xs md:text-sm text-cyan-300 whitespace-nowrap text-center">A1:B2:C3<br/>D4:E5:F6</span>
              </div>
            </div>

            {/* EtherType */}
            <div className="flex-none w-[12%] flex flex-col gap-2">
              <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest text-center border border-amber-500/30 rounded-full px-2 py-1 mx-1 bg-amber-500/10">EtherType</div>
              <div className={`h-24 border-y border-l border-white/20 bg-[#1a2430] flex items-center justify-center px-2 transition-all duration-500 overflow-hidden ${step >= 3 ? 'opacity-100' : 'opacity-0'}`}>
                <span className="font-mono text-xs md:text-sm text-amber-300">0x0800</span>
              </div>
            </div>

            {/* Payload */}
            <div className="flex-none w-[32%] flex flex-col gap-2">
              <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest text-center border border-cyan-500/30 rounded-full px-2 py-1 mx-1 bg-cyan-500/10">Payload ({payloadInput.length}B)</div>
              <div className={`h-24 border-y border-l border-white/20 bg-[#1a2430] flex items-center justify-center p-3 transition-all duration-700 overflow-hidden relative ${step >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                <div className={`w-full overflow-hidden text-ellipsis font-mono text-xs md:text-sm text-cyan-200 transition-all duration-1000 ${step >= 1 ? 'translate-y-0' : '-translate-y-10'}`}>
                  {payloadInput || "..."}
                </div>
              </div>
            </div>

            {/* FCS */}
            <div className="flex-none w-[12%] flex flex-col gap-2">
              <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest text-center border border-red-500/30 rounded-full px-2 py-1 mx-1 bg-red-500/10">FCS</div>
              <div className={`h-24 border border-white/20 bg-[#1a2430] flex items-center justify-center px-2 transition-all duration-500 overflow-hidden ${step >= 4 ? 'opacity-100' : 'opacity-0'}`}>
                <span className={`font-mono text-[10px] md:text-xs text-center break-all ${step === 4 ? 'text-red-400 font-bold' : 'text-red-300'}`}>
                  {fcsFlash}
                </span>
              </div>
            </div>
            
          </div>

          {/* Input Area */}
          <div className={`mt-16 w-[500px] max-w-full bg-[#141b24]/80 backdrop-blur-md border border-white/10 p-6 rounded-xl shadow-lg transition-all duration-500 ${step > 0 ? 'opacity-30 pointer-events-none scale-95' : 'opacity-100 scale-100'}`}>
            <p className="text-sm font-bold text-slate-300 text-center mb-4">Enter payload data to encapsulate</p>
            <input 
              type="text" 
              value={payloadInput}
              onChange={(e) => setPayloadInput(e.target.value)}
              placeholder="Type your message here..."
              disabled={step > 0}
              className="w-full bg-[#0a0e14] border border-white/10 rounded-lg px-4 py-3 text-cyan-400 font-mono text-sm placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 shadow-inner"
            />
          </div>

          {/* Success Message */}
          <div className={`absolute bottom-10 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 px-6 py-3 rounded-full text-sm font-bold font-mono transition-all duration-700 ${step >= 6 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
            <CircleCheck size={18} />
            Frame Encapsulated and Ready for Layer 1 Transmission.
          </div>

        </div>

      </div>
    </SimulatorLayout>
  );
}