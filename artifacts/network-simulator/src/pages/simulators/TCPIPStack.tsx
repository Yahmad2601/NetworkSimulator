import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Play, RefreshCw, Layers } from "lucide-react";
import SimulatorLayout, { FooterControl } from "../../components/SimulatorLayout";

const SCENARIOS = [
  { 
    id: 'web', name: 'Secure Web App', desc: 'HTTPS / TCP / IPv4', 
    app: { text: '[ DATA ]', subtext: 'HTTPS Payload (TLS v1.3)', raw: '16 03 03 00 28 ...' },
    l4: { proto: 'TCP', label: '[ TCP HEADER ]', src: '49152', dst: '443' },
    l3: { proto: 'IPv4', label: '[ IPv4 HEADER ]', src: '10.0.0.50', dst: '104.18.2.1' },
    l2: { header: '[ ETHERNET HEADER ]', trailer: '[ FCS ]', macSrc: '00:1A:2B:3C:4D:5E', macDst: 'C4:22:98:A2:11:BB' } 
  },
  { 
    id: 'mqtt', name: 'IoT Telemetry', desc: 'MQTT / TCP / IPv4',
    app: { text: '[ DATA ]', subtext: 'MQTT Publish: {temp: 24.5}', raw: '30 0F 00 05 73 74 6F...' },
    l4: { proto: 'TCP', label: '[ TCP HEADER ]', src: '50321', dst: '1883' },
    l3: { proto: 'IPv4', label: '[ IPv4 HEADER ]', src: '192.168.1.15', dst: '3.88.24.19' },
    l2: { header: '[ ETHERNET HEADER ]', trailer: '[ FCS ]', macSrc: '00:11:22:33:44:55', macDst: 'AA:BB:CC:DD:EE:FF' } 
  },
  { 
    id: 'video', name: 'Live Video Call', desc: 'WebRTC / UDP / IPv4',
    app: { text: '[ DATA ]', subtext: 'Video Frame (VP9/H.264)', raw: '80 60 00 01 02 03 04...' },
    l4: { proto: 'UDP', label: '[ UDP HEADER ]', src: '5004', dst: '5004' },
    l3: { proto: 'IPv4', label: '[ IPv4 HEADER ]', src: '198.51.100.42', dst: '10.0.0.50' },
    l2: { header: '[ ETHERNET HEADER ]', trailer: '[ FCS ]', macSrc: '01:23:45:67:89:AB', macDst: 'C4:22:98:A2:11:BB' } 
  },
  { 
    id: 'voip', name: 'VoIP Audio', desc: 'RTP / UDP / IPv6',
    app: { text: '[ DATA ]', subtext: 'RTP Audio Codec (G.711)', raw: '80 00 0A C1 00 00 D4...' },
    l4: { proto: 'UDP', label: '[ UDP HEADER ]', src: '16384', dst: '16384' },
    l3: { proto: 'IPv6', label: '[ IPv6 HEADER ]', src: '2001:db8::1', dst: '2001:db8::2' },
    l2: { header: '[ ETHERNET HEADER ]', trailer: '[ FCS ]', macSrc: '00:14:22:01:23:45', macDst: '00:08:A1:B2:C3:D4' } 
  },
];

const DOD_LAYERS = [
  { id: 1, name: "Application", color: "#a855f7" },
  { id: 2, name: "Transport", color: "#06b6d4" },
  { id: 3, name: "Internet", color: "#f59e0b" },
  { id: 4, name: "Network Access", color: "#22c55e" },
];

export default function TCPIPStack() {
  const [scenario, setScenario] = useState(SCENARIOS[0]);
  const [step, setStep] = useState(0); // 0 = Ready, 1-4 = Layers, 5 = Transmit

  const isBinary = step === 5;

  const footerControls: FooterControl[] = [
    { 
      key: "btn1", 
      type: "button", 
      label: step === 0 ? "Start Encapsulation" : step === 4 ? "Transmit Data" : step === 5 ? "Reset Simulation" : "Next Layer", 
      variant: step === 5 ? "secondary" : "cyan", 
      icon: step === 0 ? <Play size={12} /> : step === 5 ? <RefreshCw size={12} /> : <Send size={12} />,
      onClick: () => {
        if (step === 5) setStep(0);
        else setStep(s => s + 1);
      } 
    },
  ];

  const PDUVisual = () => (
    <motion.div 
       layoutId="pdu_container" 
       className={`flex items-stretch shadow-[0_0_30px_rgba(0,0,0,0.5)] h-16 origin-center absolute z-30 ${isBinary ? 'rounded-full' : 'rounded'}`}
       initial={{ y: -50, opacity: 0 }}
       animate={
         isBinary 
           ? { x: "150vw", opacity: 0, scale: 0.5, transition: { duration: 1.2, ease: "easeIn" } } 
           : { y: 0, x: 0, opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 25 } }
       }
    >
      {isBinary ? (
         <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center text-[#22c55e] font-mono text-xl tracking-[0.2em] px-8 font-bold bg-[#22c55e]/10 border border-[#22c55e] rounded-full whitespace-nowrap shadow-[0_0_20px_rgba(34,197,94,0.4)]">
            1010101010111100010101001010101011110
         </motion.div>
      ) : (
         <>
           {/* Layer 1: Network Trailer (rendered early so it's ready but empty until condition met if we wanted, but AnimatePresence wraps it) */}
           <AnimatePresence>
             {step >= 4 && (
                <motion.div layout initial={{ width: 0, opacity: 0 }} animate={{ width: 'auto', opacity: 1 }} exit={{ width: 0 }} className="bg-[#22c55e]/20 border border-[#22c55e] text-[#22c55e] font-mono text-xs px-3 py-4 flex items-center whitespace-nowrap overflow-hidden rounded-l">
                   <div className="flex flex-col items-center">
                      <span className="font-bold tracking-widest">{scenario.l2.header}</span>
                   </div>
                </motion.div>
             )}
           </AnimatePresence>

           <AnimatePresence>
             {step >= 3 && (
                <motion.div layout initial={{ width: 0, opacity: 0 }} animate={{ width: 'auto', opacity: 1 }} exit={{ width: 0 }} className="bg-[#f59e0b]/20 border-y border-l border-[#f59e0b] text-[#f59e0b] font-mono text-xs px-3 py-4 flex items-center whitespace-nowrap overflow-hidden">
                   <span className="font-bold tracking-widest">{scenario.l3.label}</span>
                </motion.div>
             )}
           </AnimatePresence>

           <AnimatePresence>
             {step >= 2 && (
                <motion.div layout initial={{ width: 0, opacity: 0 }} animate={{ width: 'auto', opacity: 1 }} exit={{ width: 0 }} className="bg-[#06b6d4]/20 border-y border-l border-[#06b6d4] text-[#06b6d4] font-mono text-xs px-3 py-4 flex items-center whitespace-nowrap overflow-hidden">
                   <span className="font-bold tracking-widest">{scenario.l4.label}</span>
                </motion.div>
             )}
           </AnimatePresence>

           <motion.div layout className={`bg-[#a855f7]/20 border border-[#a855f7] text-[#a855f7] font-mono text-xs px-4 py-4 flex flex-col items-center justify-center whitespace-nowrap z-10 glass-panel shadow-[0_0_15px_rgba(168,85,247,0.3)] ${step < 2 ? 'rounded' : ''} ${step === 2 || step === 3 ? 'rounded-r' : ''}`}>
               <span className="font-bold tracking-wider">{scenario.app.text}</span>
               <span className="text-[9px] opacity-80 mt-1 uppercase">{scenario.app.subtext}</span>
           </motion.div>

           <AnimatePresence>
             {step >= 4 && (
                <motion.div layout initial={{ width: 0, opacity: 0 }} animate={{ width: 'auto', opacity: 1 }} exit={{ width: 0 }} className="bg-[#22c55e]/20 border border-[#22c55e] border-l-0 text-[#22c55e] font-mono text-xs px-3 py-4 flex items-center whitespace-nowrap overflow-hidden rounded-r">
                   <span className="font-bold tracking-widest">{scenario.l2.trailer}</span>
                </motion.div>
             )}
           </AnimatePresence>
         </>
      )}
    </motion.div>
  );

  return (
    <SimulatorLayout
      title="TCP/IP 4-Layer Stack Simulator"
      subtitle="Encapsulation & DoD Model Visualization"
      layerBadge="DoD"
      layerColor="#06b6d4"
      footerControls={footerControls}
    >
      <div className="h-full flex p-4 gap-4 overflow-hidden text-slate-400 bg-[#0a0e14]">
        
        {/* Left Sidebar: Scenarios */}
        <div className="w-[280px] shrink-0 glass-panel border border-white/5 bg-[#141b24] p-4 flex flex-col gap-3 rounded-xl z-20">
           <div className="flex items-center gap-2 uppercase tracking-widest text-[10px] text-slate-500 font-bold mb-2">
             <Layers size={14} className="text-[#06b6d4]" />
             <span>Select Scenario</span>
           </div>
           
           {SCENARIOS.map(s => (
               <button 
                 key={s.id} 
                 onClick={() => { setScenario(s); setStep(0); }} 
                 className={`p-3 text-left border rounded-lg transition-all duration-300 relative overflow-hidden group ${s.id === scenario.id ? 'border-[#06b6d4] bg-[#06b6d4]/10 shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'border-white/5 hover:border-white/20 hover:bg-white/5'}`}
               >
                  {s.id === scenario.id && (
                    <motion.div layoutId="scenario-highlight" className="absolute left-0 top-0 bottom-0 w-1 bg-[#06b6d4]" />
                  )}
                  <div className={`font-bold text-sm ${s.id === scenario.id ? 'text-white' : 'text-slate-300'}`}>{s.name}</div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-mono mt-1 group-hover:text-slate-400 transition-colors">{s.desc}</div>
               </button>
           ))}
        </div>

        {/* Center Canvas: The Stack */}
        <div className="flex-[2] flex flex-col gap-3 relative z-10">
            {DOD_LAYERS.map(layer => (
                <div 
                  key={layer.id} 
                  className={`flex-1 glass-panel border-y border-r border border-white/5 rounded-lg flex items-center justify-center relative overflow-hidden transition-all duration-500 ${step >= layer.id ? 'bg-[#141b24]/80' : 'bg-[#141b24]/30'}`}
                  style={{ borderLeftWidth: '4px', borderLeftColor: layer.color }}
                >
                    <div 
                      className="absolute top-3 left-4 font-bold text-[10px] tracking-widest uppercase transition-colors" 
                      style={{ color: step >= layer.id ? layer.color : "rgba(255,255,255,0.2)" }}
                    >
                      Layer {5 - layer.id}: {layer.name} {/* DoD numbers: App(4), Trans(3), Int(2), Net(1) */}
                    </div>
                    
                    {/* Ambient background glow if active */}
                    {step === layer.id && (
                       <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ background: `radial-gradient(circle at center, ${layer.color} 0%, transparent 60%)` }} />
                    )}

                    {/* The PDU resides in whichever layer matches the current step (step 5 renders in layer 4) */}
                    {(step === layer.id || (layer.id === 4 && step === 5)) && (
                        <div className="absolute inset-0 flex items-center justify-center pt-2">
                           <PDUVisual />
                        </div>
                    )}
                </div>
            ))}
        </div>

        {/* Right Sidebar: PDU Inspector */}
        <div className="w-[320px] shrink-0 glass-panel border border-white/5 bg-[#141b24] p-4 flex flex-col h-full overflow-hidden rounded-xl z-20">
           <div className="uppercase tracking-widest text-[10px] text-slate-500 font-bold mb-4">PDU Inspector</div>
           
           <div className="text-lg font-bold font-mono tracking-tight text-white mb-6 bg-black/30 p-3 rounded border border-white/5 shadow-inner">
              {step === 0 && <span className="text-slate-500">Waiting for data...</span>}
              {step === 1 && <span className="text-[#a855f7]">PDU: Message / Data</span>}
              {step === 2 && <span className="text-[#06b6d4]">PDU: {scenario.l4.proto === 'TCP' ? 'Segment' : 'Datagram'}</span>}
              {step === 3 && <span className="text-[#f59e0b]">PDU: Packet / Datagram</span>}
              {step === 4 && <span className="text-[#22c55e]">PDU: Frame</span>}
              {step === 5 && <span className="text-white animate-pulse">TRANSMITTING...</span>}
           </div>

           <div className="flex flex-col gap-3 overflow-y-auto pr-2 pb-10 custom-scrollbar">
              <AnimatePresence>
                  
                  {/* Outer Layer: Layer 1 Network Access */}
                  {step >= 4 && (
                    <motion.div layout initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="p-3 border border-[#22c55e]/30 bg-[#22c55e]/5 rounded-lg flex flex-col gap-1 text-[#22c55e] shadow-[0_0_15px_rgba(34,197,94,0.1)] relative">
                       <div className="absolute top-0 bottom-0 left-0 w-1 bg-[#22c55e] rounded-l-lg" />
                       <div className="font-bold text-[10px] tracking-wider uppercase mb-1 pl-2">Network Access Header</div>
                       <div className="font-mono text-xs pl-2">MAC Src: {scenario.l2.macSrc}</div>
                       <div className="font-mono text-xs pl-2">MAC Dst: {scenario.l2.macDst}</div>
                    </motion.div>
                  )}

                  {/* Inter Outer Layer: Layer 2 Internet */}
                  {step >= 3 && (
                    <motion.div layout initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={`p-3 border border-[#f59e0b]/30 bg-[#f59e0b]/5 rounded-lg flex flex-col gap-1 text-[#f59e0b] shadow-[0_0_15px_rgba(245,158,11,0.1)] relative ${step >= 4 ? 'ml-4' : ''}`}>
                       <div className="absolute top-0 bottom-0 left-0 w-1 bg-[#f59e0b] rounded-l-lg" />
                       <div className="font-bold text-[10px] tracking-wider uppercase mb-1 pl-2">Internet Header</div>
                       <div className="font-mono text-xs pl-2">IP Src: {scenario.l3.src}</div>
                       <div className="font-mono text-xs pl-2">IP Dst: {scenario.l3.dst}</div>
                    </motion.div>
                  )}

                  {/* Inner nested: Layer 3 Transport */}
                  {step >= 2 && (
                    <motion.div layout initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={`p-3 border border-[#06b6d4]/30 bg-[#06b6d4]/5 rounded-lg flex flex-col gap-1 text-[#06b6d4] shadow-[0_0_15px_rgba(6,182,212,0.1)] relative ${step >= 3 ? (step >= 4 ? 'ml-8' : 'ml-4') : ''}`}>
                       <div className="absolute top-0 bottom-0 left-0 w-1 bg-[#06b6d4] rounded-l-lg" />
                       <div className="font-bold text-[10px] tracking-wider uppercase mb-1 pl-2">Transport Header</div>
                       <div className="font-mono text-xs pl-2">{scenario.l4.proto} Src Port: {scenario.l4.src}</div>
                       <div className="font-mono text-xs pl-2">{scenario.l4.proto} Dst Port: {scenario.l4.dst}</div>
                    </motion.div>
                  )}

                  {/* Core payload: Layer 4 Application */}
                  {step >= 1 && (
                    <motion.div layout initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={`p-3 border border-[#a855f7]/30 bg-[#a855f7]/5 rounded-lg flex flex-col gap-1 text-[#a855f7] shadow-[0_0_15px_rgba(168,85,247,0.1)] relative ${step >= 2 ? (step >= 3 ? (step >= 4 ? 'ml-12' : 'ml-8') : 'ml-4') : ''}`}>
                       <div className="absolute top-0 bottom-0 left-0 w-1 bg-[#a855f7] rounded-l-lg" />
                       <div className="font-bold text-[10px] tracking-wider uppercase mb-1 pl-2">Application Payload</div>
                       <div className="font-mono text-xs pl-2 break-words">{scenario.app.subtext}</div>
                       <div className="font-mono text-[9px] opacity-70 break-all mt-1 pl-2">RAW: {scenario.app.raw}</div>
                    </motion.div>
                  )}

               </AnimatePresence>

               {step === 0 && (
                  <div className="flex flex-col items-center justify-center h-40 text-slate-600">
                     <Layers size={32} className="mb-2 opacity-50" />
                     <div className="text-[10px] uppercase tracking-widest">Awaiting Payload</div>
                  </div>
               )}
           </div>
        </div>

      </div>
    </SimulatorLayout>
  );
}
