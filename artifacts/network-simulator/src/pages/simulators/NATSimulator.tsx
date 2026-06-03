import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Laptop, Smartphone, Router as RouterIcon, Globe, RefreshCw, Send } from "lucide-react";
import SimulatorLayout, { FooterControl } from "../../components/SimulatorLayout";

const POS = {
  pc: { x: '15%', y: '25%' },
  phone: { x: '15%', y: '65%' },
  router: { x: '50%', y: '45%' },
  server: { x: '85%', y: '45%' }
};

interface RequestItem {
  id: number;
  source: 'pc' | 'phone';
  srcIp: string;
  srcPort: number;
  natPort: number;
}

interface NatEntry {
  id: number;
  insideLocal: string;
  insideGlobal: string;
  outsideGlobal: string;
  flash?: boolean;
}

const Packet = ({ req, onStep, onComplete }: { req: RequestItem, onStep: any, onComplete: any }) => {
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (step > 7) {
      onComplete(req.id);
      return;
    }
    onStep(req.id, step, req);

    let delay = 1500;
    if (step === 2 || step === 6) delay = 1200; // Pause at Router
    if (step === 4) delay = 800; // Pause at Server

    const t = setTimeout(() => setStep(s => s + 1), delay);
    return () => clearTimeout(t);
  }, [step, req, onStep, onComplete]);

  const pos = useMemo(() => {
    if (step === 1) return POS.router;
    if (step === 2) return POS.router;
    if (step === 3) return POS.server;
    if (step === 4) return POS.server;
    if (step === 5) return POS.router;
    if (step === 6) return POS.router;
    if (step === 7) return req.source === 'pc' ? POS.pc : POS.phone;
    return req.source === 'pc' ? POS.pc : POS.phone;
  }, [step, req.source]);

  const initialPos = req.source === 'pc' ? POS.pc : POS.phone;
  const isCyan = step <= 2 || step >= 6;
  const color = isCyan ? "#06b6d4" : "#f59e0b";

  let tooltip = "";
  if (step <= 2) tooltip = `SRC: ${req.srcIp}:${req.srcPort} | DST: 8.8.8.8:80`;
  else if (step === 3 || step === 4) tooltip = `SRC: 203.0.113.5:${req.natPort} | DST: 8.8.8.8:80`;
  else if (step === 5) tooltip = `SRC: 8.8.8.8:80 | DST: 203.0.113.5:${req.natPort}`;
  else if (step >= 6) tooltip = `SRC: 8.8.8.8:80 | DST: ${req.srcIp}:${req.srcPort}`;

  return (
    <motion.div
      initial={{ left: initialPos.x, top: initialPos.y, opacity: 0, scale: 0.5, x: '-50%', y: '-50%' }}
      animate={{ left: pos.x, top: pos.y, opacity: step > 7 ? 0 : 1, scale: step > 7 ? 0 : 1, x: '-50%', y: '-50%' }}
      transition={{ duration: step === 2 || step === 4 || step === 6 ? 0.3 : 1.5, ease: "easeInOut" }}
      className="absolute z-30 pointer-events-none"
    >
      <div className="relative flex flex-col items-center justify-center">
        <div className="absolute -top-10 whitespace-nowrap glass-panel bg-[#141b24]/90 border rounded shadow-lg transition-colors duration-500 px-2 py-1" style={{ borderColor: `${color}50` }}>
          <span className="font-mono text-[9px] text-white tracking-widest">{tooltip}</span>
        </div>
        <div className="w-8 h-6 rounded border-2 flex items-center justify-center bg-black/50 transition-colors duration-500" style={{ borderColor: color, color, boxShadow: `0 0 10px ${color}80` }}>
           <Send size={12} className={`transition-transform duration-500 ${step >= 5 ? 'rotate-180' : ''}`} />
        </div>
      </div>
    </motion.div>
  );
};

const Node = ({ icon: Icon, label, ip, pos, color }: any) => (
  <div className="absolute flex flex-col items-center gap-3 transform -translate-x-1/2 -translate-y-1/2 z-10" style={{ left: pos.x, top: pos.y }}>
     <div className="w-16 h-16 rounded-full border-2 flex items-center justify-center bg-[#141b24]" style={{ borderColor: color, boxShadow: `0 0 20px ${color}40` }}>
       <Icon size={28} style={{ color }} />
     </div>
     <div className="flex flex-col items-center glass-panel px-3 py-1.5 rounded border border-white/5 bg-[#141b24] shadow-lg">
       <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">{label}</span>
       <span className="font-mono text-[11px]" style={{ color }}>{ip}</span>
     </div>
  </div>
);

export default function NATSimulator() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [natTable, setNatTable] = useState<NatEntry[]>([]);
  const reqCount = useRef(0);

  const handleSend = (source: 'pc' | 'phone') => {
    const srcIp = source === 'pc' ? '192.168.1.10' : '192.168.1.20';
    const srcPort = Math.floor(Math.random() * (65000 - 1024)) + 1024;
    reqCount.current += 1;
    const natPort = 6000 + reqCount.current;
    
    setRequests(prev => [...prev, { id: reqCount.current, source, srcIp, srcPort, natPort }]);
  };

  const handleComplete = useCallback((id: number) => {
    setRequests(prev => prev.filter(r => r.id !== id));
  }, []);

  const handleStep = useCallback((id: number, step: number, req: RequestItem) => {
    if (step === 2 || step === 6) {
       setNatTable(prev => {
         const existing = prev.find(r => r.id === req.id);
         if (existing) {
           return prev.map(r => r.id === req.id ? { ...r, flash: true } : r);
         }
         return [...prev, {
           id: req.id,
           insideLocal: `${req.srcIp}:${req.srcPort}`,
           insideGlobal: `203.0.113.5:${req.natPort}`,
           outsideGlobal: `8.8.8.8:80`,
           flash: true
         }];
       });
       setTimeout(() => {
          setNatTable(prev => prev.map(r => r.id === req.id ? { ...r, flash: false } : r));
       }, 1000);
    }
  }, []);

  const reset = () => {
    setRequests([]);
    setNatTable([]);
    reqCount.current = 0;
  };

  const footerControls: FooterControl[] = [
    {
      key: "pc", type: "button", label: "Send Request from PC-1", variant: "cyan",
      onClick: () => handleSend('pc'),
    },
    { key: "sp1", type: "spacer" },
    {
      key: "phone", type: "button", label: "Send Request from Smartphone", variant: "cyan",
      onClick: () => handleSend('phone'),
    },
    { key: "sp2", type: "spacer" },
    {
      key: "clear", type: "button", label: "Clear NAT Table", variant: "secondary",
      icon: <RefreshCw size={12} />,
      onClick: reset,
    }
  ];

  return (
    <SimulatorLayout
      title="NAT & PAT Simulator"
      subtitle="Network Address Translation (Overload)"
      layerBadge="L3/4"
      layerColor="#a855f7"
      footerControls={footerControls}
    >
      <div className="h-full flex flex-col p-4 select-none overflow-hidden text-slate-400 bg-[#0a0e14] relative">
        
        {/* Header Status Metrics */}
        <div className="grid grid-cols-3 gap-3 shrink-0 mb-4 relative z-20">
          {[
            { label: "ROUTER PUBLIC IP", value: "203.0.113.5", color: "#a855f7" },
            { label: "ACTIVE TRANSLATIONS", value: natTable.length.toString(), color: "#06b6d4" },
            { label: "MODE", value: "PAT / Overload", color: "#f59e0b" },
          ].map(item => (
            <div key={item.label} className="glass-panel border border-white/5 bg-[#141b24] p-3 rounded-xl shadow-lg flex flex-col items-center">
              <div className="text-[10px] uppercase tracking-widest mb-1">{item.label}</div>
              <div className="font-mono font-bold text-lg text-center" style={{ color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-1 gap-4 overflow-hidden">
          {/* Interactive Network Canvas */}
          <div className="flex-[2] relative border border-white/5 rounded-xl bg-[#0c1219] shadow-[inset_0_0_30px_rgba(0,0,0,0.4)] overflow-hidden">
            
            {/* Background Zoning & Labels */}
            <div className="absolute inset-0 pointer-events-none z-0 flex">
              <div className="flex-[0.4] border-r-2 border-dashed border-white/10 relative bg-[#06b6d4]/5">
                <span className="absolute top-4 left-4 text-[10px] uppercase font-bold tracking-widest text-[#06b6d4]/50">Inside (Private)</span>
              </div>
              <div className="flex-[0.6] relative bg-[#f59e0b]/5 opacity-50">
                <span className="absolute top-4 right-4 text-[10px] uppercase font-bold tracking-widest text-[#f59e0b]/50">Outside (Public)</span>
              </div>
            </div>

            {/* SVG Connecting Lines */}
            <div className="absolute inset-0 pointer-events-none z-0">
              <svg width="100%" height="100%" className="opacity-20 text-white">
                <line x1={POS.pc.x} y1={POS.pc.y} x2={POS.router.x} y2={POS.router.y} stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                <line x1={POS.phone.x} y1={POS.phone.y} x2={POS.router.x} y2={POS.router.y} stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                <line x1={POS.router.x} y1={POS.router.y} x2={POS.server.x} y2={POS.server.y} stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
              </svg>
            </div>

            {/* Fixed Nodes */}
            <Node icon={Laptop} label="PC-1" ip="192.168.1.10" pos={POS.pc} color="#06b6d4" />
            <Node icon={Smartphone} label="Smartphone" ip="192.168.1.20" pos={POS.phone} color="#06b6d4" />
            <Node icon={RouterIcon} label="NAT Router" ip="203.0.113.5" pos={POS.router} color="#a855f7" />
            <Node icon={Globe} label="Web Server" ip="8.8.8.8" pos={POS.server} color="#f59e0b" />

            {/* Animating Packets */}
            {requests.map(req => (
              <Packet key={req.id} req={req} onStep={handleStep} onComplete={handleComplete} />
            ))}

          </div>

          {/* NAT Translation Table Sidebar */}
          <div className="w-[380px] flex flex-col glass-panel border border-white/5 rounded-xl bg-[#141b24] shadow-lg overflow-hidden relative z-20">
            <div className="bg-black/40 border-b border-white/5 py-4 px-4 flex items-center justify-between shrink-0">
               <span className="text-[11px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
                 <RouterIcon size={14} className="text-[#a855f7]" /> PAT Translation Table
               </span>
            </div>
            
            <div className="flex flex-col flex-1 overflow-hidden">
               <div className="flex uppercase tracking-widest text-[#a855f7] font-sans font-bold text-[9px] px-4 py-2 border-b border-white/5 bg-[#0a0e14]/50 shrink-0">
                  <div className="flex-1">Inside Local (Priv)</div>
                  <div className="flex-1 text-center">Global (Pub)</div>
                  <div className="flex-1 text-right">Dest (Web)</div>
               </div>
               
               <div className="flex flex-col flex-1 overflow-y-auto font-mono text-[10px]">
                  <AnimatePresence>
                    {natTable.map(row => (
                      <motion.div 
                        key={row.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`flex px-4 py-3 border-b border-white/5 transition-colors duration-300 ${row.flash ? 'bg-[#a855f7]/30 text-white' : 'text-slate-400'}`}
                      >
                        <div className="flex-1 text-[#06b6d4] drop-shadow-[0_0_2px_rgba(6,182,212,0.8)] pr-1">{row.insideLocal}</div>
                        <div className="flex-1 text-center text-[#a855f7] drop-shadow-[0_0_2px_rgba(168,85,247,0.8)] px-1">{row.insideGlobal}</div>
                        <div className="flex-1 text-right text-[#f59e0b] drop-shadow-[0_0_2px_rgba(245,158,11,0.8)] pl-1">{row.outsideGlobal}</div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {natTable.length === 0 && (
                    <div className="px-4 py-12 text-center text-slate-600 font-sans text-[11px] uppercase tracking-widest italic flex h-full items-center justify-center">
                      Table is empty. Send a request to populate.
                    </div>
                  )}
               </div>
            </div>
          </div>
        </div>

      </div>
    </SimulatorLayout>
  );
}
