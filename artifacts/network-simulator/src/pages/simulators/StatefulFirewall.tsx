import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Laptop, Globe, Shield, RefreshCw, XCircle, AlertTriangle } from "lucide-react";
import SimulatorLayout, { FooterControl } from "../../components/SimulatorLayout";

const POS = {
  internal: { x: '15%', y: '50%' },
  fw: { x: '50%', y: '50%' },
  safe: { x: '85%', y: '30%' },
  malicious: { x: '85%', y: '70%' }
};

interface PacketData {
  id: number;
  type: 'out-web' | 'in-web' | 'malicious' | 'ping';
  srcIp: string;
  srcPort: number;
  dstIp: string;
  dstPort: number;
  proto: string;
}

interface StateEntry {
  id: string;
  proto: string;
  src: string;
  dst: string;
  state: string;
  flash?: boolean;
}

const ACL_RULES = [
  { num: 10, action: 'PERMIT', proto: 'TCP', dir: 'IN', src: 'ANY', dst: '10.0.0.10:443' },
  { num: 20, action: 'DENY', proto: 'IP', dir: 'IN', src: '198.51.100.99', dst: 'ANY' },
  { num: 30, action: 'PERMIT', proto: 'TCP', dir: 'OUT', src: '10.0.0.0/24', dst: 'ANY' },
  { num: 99, action: 'DENY', proto: 'IP', dir: 'ANY', src: 'ANY', dst: 'ANY (Implicit)' },
];

const Packet = ({ req, onStep, onComplete }: { req: PacketData, onStep: any, onComplete: any }) => {
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (step > 6) {
      onComplete(req.id);
      return undefined;
    }

    // Pass execution control to parent to handle state/acl highlights, which returns how long to pause
    const delay = onStep(req.id, step, req);

    if (delay > 0) {
      const t = setTimeout(() => setStep(s => s + 1), delay);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [step, req, onStep, onComplete]);

  const isOutbound = req.type === 'out-web';
  const sourceNode = isOutbound ? POS.internal : req.type === 'malicious' ? POS.malicious : POS.safe;
  const destNode = isOutbound ? POS.safe : POS.internal;

  const pos = useMemo(() => {
    if (step === 1) return POS.fw; // Move to FW
    if (step === 2) return POS.fw; // Pause for State Check
    if (step === 3) return POS.fw; // Pause for ACL Check
    if (step === 4) return req.type === 'out-web' || req.type === 'in-web' ? destNode : POS.fw; // Drop or Pass
    if (step >= 5) return req.type === 'out-web' || req.type === 'in-web' ? destNode : POS.fw;
    return sourceNode;
  }, [step, req.type, sourceNode, destNode]);

  const color = req.type === 'out-web' ? "#06b6d4" : req.type === 'in-web' ? "#22c55e" : "#ef4444";
  const isDropped = (req.type === 'malicious' || req.type === 'ping') && step >= 4;

  return (
    <motion.div
      initial={{ left: sourceNode.x, top: sourceNode.y, opacity: 0, scale: 0.5, x: '-50%', y: '-50%' }}
      animate={{ 
        left: pos.x, top: pos.y, 
        opacity: isDropped ? 0 : step > 5 ? 0 : 1, 
        scale: isDropped ? 2 : step > 5 ? 0 : 1, 
        x: '-50%', y: '-50%' 
      }}
      transition={{ duration: step === 2 || step === 3 ? 0.2 : 1, ease: "easeInOut" }}
      className="absolute z-30 pointer-events-none"
    >
      <div className="relative flex flex-col items-center justify-center">
        {step < 5 && !isDropped && (
          <div className="absolute -top-10 whitespace-nowrap glass-panel bg-[#141b24]/90 border rounded shadow-lg px-2 py-1" style={{ borderColor: `${color}80` }}>
            <span className="font-mono text-[9px] text-white tracking-widest">
              {req.proto} | {req.srcIp}:{req.srcPort} &rarr; {req.dstIp}:{req.dstPort}
            </span>
          </div>
        )}
        
        {isDropped ? (
           <XCircle size={32} className="text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,1)]" />
        ) : (
           <div className="w-8 h-6 rounded border-2 flex items-center justify-center bg-black/50" style={{ borderColor: color, boxShadow: `0 0 15px ${color}` }}>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
           </div>
        )}
      </div>
    </motion.div>
  );
};

export default function StatefulFirewall() {
  const [packets, setPackets] = useState<PacketData[]>([]);
  const [stateTable, setStateTable] = useState<StateEntry[]>([]);
  const [activeRule, setActiveRule] = useState<number | null>(null);
  const [scannedRules, setScannedRules] = useState<number[]>([]);
  const [stats, setStats] = useState({ evaluated: 0, dropped: 0 });
  const reqCount = useRef(0);
  const hasOutbound = useRef(false);

  const handleSend = (type: PacketData['type']) => {
    if (type === 'in-web' && !hasOutbound.current) {
        alert("Wait! You must send an 'Outbound Web Request' first to build the Stateful connection entry before the return traffic is allowed.");
        return;
    }

    reqCount.current += 1;
    let req: PacketData;

    if (type === 'out-web') {
      req = { id: reqCount.current, type, proto: 'TCP', srcIp: '10.0.0.50', srcPort: 54321, dstIp: '8.8.8.8', dstPort: 443 };
      hasOutbound.current = true;
    } else if (type === 'in-web') {
      req = { id: reqCount.current, type, proto: 'TCP', srcIp: '8.8.8.8', srcPort: 443, dstIp: '10.0.0.50', dstPort: 54321 };
    } else if (type === 'malicious') {
      req = { id: reqCount.current, type, proto: 'TCP', srcIp: '198.51.100.99', srcPort: 31337, dstIp: '10.0.0.50', dstPort: 80 };
    } else {
      req = { id: reqCount.current, type, proto: 'ICMP', srcIp: '8.8.8.8', srcPort: 0, dstIp: '10.0.0.50', dstPort: 0 };
    }
    
    setPackets(prev => [...prev, req]);
  };

  const handleComplete = useCallback((id: number) => {
    setPackets(prev => prev.filter(r => r.id !== id));
    setActiveRule(null);
    setScannedRules([]);
    setStateTable(prev => prev.map(r => ({ ...r, flash: false })));
  }, []);

  const handleStep = useCallback((id: number, step: number, req: PacketData) => {
    if (step === 1) return 1000; // Transit to FW

    if (step === 2) {
      // Step 2: State Check
      const stateMatchId = `${req.proto}-${req.dstIp}-${req.srcIp}`; // Is it returning to our src?
      
      setStateTable(prev => {
        const match = prev.find(r => r.id === stateMatchId);
        if (match && req.type === 'in-web') {
           return prev.map(r => r.id === stateMatchId ? { ...r, flash: true } : r);
        }
        return prev;
      });

      if (req.type === 'in-web') {
        // It matches state table, bypass ACL
        setStats(s => ({ ...s, evaluated: s.evaluated + 1 }));
        return 1500; // Long pause to show state match
      }
      return 500; // Short pause, no state match, move to ACL
    }

    if (step === 3) {
      // Step 3: ACL Check (Only if not in-web)
      if (req.type === 'in-web') return 100; // Skip ACL completely

      let matchRule = 99;
      const scanSeq: number[] = [];

      if (req.type === 'out-web') { matchRule = 30; scanSeq.push(10, 20, 30); }
      if (req.type === 'malicious') { matchRule = 20; scanSeq.push(10, 20); }
      if (req.type === 'ping') { matchRule = 99; scanSeq.push(10, 20, 30, 99); }

      // Animate scanning visually
      scanSeq.forEach((ruleNum, idx) => {
         setTimeout(() => {
            setScannedRules(prev => [...prev, ruleNum]);
            if (idx === scanSeq.length - 1) {
               setActiveRule(matchRule);
               if (req.type === 'out-web') {
                 setStateTable(prev => [...prev, {
                   id: `${req.proto}-${req.srcIp}-${req.dstIp}`,
                   proto: req.proto, src: `${req.srcIp}:${req.srcPort}`, dst: `${req.dstIp}:${req.dstPort}`, state: 'ESTABLISHED'
                 }]);
               }
               if (req.type === 'malicious' || req.type === 'ping') {
                 setStats(s => ({ evaluated: s.evaluated + 1, dropped: s.dropped + 1 }));
               } else {
                 setStats(s => ({ ...s, evaluated: s.evaluated + 1 }));
               }
            }
         }, idx * 400); // 400ms per rule scan
      });

      return scanSeq.length * 400 + 1000; // Pause until scan is done + 1s to view result
    }

    if (step === 4) return 1000; // Transit to destination or Drop animation
    if (step === 5) return 500;  // Cleanup
    return 0;
  }, []);

  const reset = () => {
    setPackets([]);
    setStateTable([]);
    setActiveRule(null);
    setScannedRules([]);
    setStats({ evaluated: 0, dropped: 0 });
    hasOutbound.current = false;
    reqCount.current = 0;
  };

  const footerControls: FooterControl[] = [
    { key: "btn1", type: "button", label: "Outbound Web", variant: "cyan", onClick: () => handleSend('out-web') },
    { key: "btn2", type: "button", label: "Inbound Web Return", variant: "teal", onClick: () => handleSend('in-web') },
    { key: "btn3", type: "button", label: "Malicious Inbound", variant: "danger", onClick: () => handleSend('malicious') },
    { key: "btn4", type: "button", label: "Random Ping", variant: "danger", onClick: () => handleSend('ping') },
    { key: "sp", type: "spacer" },
    { key: "reset", type: "button", label: "Reset FW", variant: "secondary", icon: <RefreshCw size={12} />, onClick: reset },
  ];

  return (
    <SimulatorLayout
      title="Stateful Firewall & ACL Simulator"
      subtitle="Top-Down Rule Processing & State Tracking"
      layerBadge="L4"
      layerColor="#22c55e"
      footerControls={footerControls}
    >
      <div className="h-full flex flex-col p-4 select-none overflow-hidden text-slate-400 bg-[#0a0e14]">
        
        {/* Header Status Metrics */}
        <div className="grid grid-cols-4 gap-3 shrink-0 mb-4 relative z-20">
          {[
            { label: "FIREWALL ENGINE", value: "Stateful Packet Inspection", color: "#22c55e" },
            { label: "PACKETS EVALUATED", value: stats.evaluated.toString(), color: "#06b6d4" },
            { label: "DROPPED (DENY)", value: stats.dropped.toString(), color: "#ef4444" },
            { label: "ACTIVE STATES", value: stateTable.length.toString(), color: "#a855f7" },
          ].map(item => (
            <div key={item.label} className="glass-panel border border-white/5 bg-[#141b24] p-3 rounded-xl shadow-lg flex flex-col items-center">
              <div className="text-[10px] uppercase tracking-widest mb-1">{item.label}</div>
              <div className="font-mono font-bold text-lg text-center" style={{ color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Interactive Canvas & Sidebar Grid */}
        <div className="flex flex-1 gap-4 overflow-hidden">
          
          {/* Main Canvas Side */}
          <div className="flex-[2] relative rounded-xl overflow-hidden border border-white/5 bg-[#0c1219]">
             {/* Background Zoning */}
             <div className="absolute inset-0 pointer-events-none z-0 flex">
               <div className="flex-[0.4] relative bg-[#06b6d4]/5 border-r-2 border-dashed border-white/10">
                 <span className="absolute top-4 left-4 text-[10px] uppercase font-bold tracking-widest text-[#06b6d4]/50">Trusted Zone (Internal)</span>
               </div>
               <div className="flex-[0.2] relative bg-black/40">
                 <span className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] uppercase font-bold tracking-widest text-[#22c55e]/50">Firewall</span>
               </div>
               <div className="flex-[0.4] relative bg-[#f59e0b]/5 border-l-2 border-dashed border-white/10">
                 <span className="absolute top-4 right-4 text-[10px] uppercase font-bold tracking-widest text-[#f59e0b]/50">Untrusted Zone (Internet)</span>
               </div>
            </div>

            {/* SVG Connectors */}
            <div className="absolute inset-0 pointer-events-none z-0">
               <svg width="100%" height="100%" className="opacity-10 text-white">
                  <line x1={POS.internal.x} y1={POS.internal.y} x2={POS.fw.x} y2={POS.fw.y} stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                  <line x1={POS.fw.x} y1={POS.fw.y} x2={POS.safe.x} y2={POS.safe.y} stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                  <line x1={POS.fw.x} y1={POS.fw.y} x2={POS.malicious.x} y2={POS.malicious.y} stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
               </svg>
            </div>

            {/* Fixed Nodes */}
            <div className="absolute flex flex-col items-center gap-2 transform -translate-x-1/2 -translate-y-1/2 z-10" style={{ left: POS.internal.x, top: POS.internal.y }}>
               <div className="w-16 h-16 rounded-full border-2 flex items-center justify-center bg-[#141b24] border-[#06b6d4] shadow-[0_0_20px_rgba(6,182,212,0.4)]"><Laptop size={28} className="text-[#06b6d4]" /></div>
               <div className="glass-panel px-3 py-1 rounded border border-white/5 bg-[#141b24]"><span className="font-mono text-[10px] text-[#06b6d4]">10.0.0.50</span></div>
            </div>

            <div className="absolute flex flex-col items-center gap-2 transform -translate-x-1/2 -translate-y-1/2 z-10" style={{ left: POS.fw.x, top: POS.fw.y }}>
               <div className="w-20 h-20 rounded-full border-2 flex items-center justify-center bg-[#141b24] border-[#22c55e] shadow-[0_0_30px_rgba(34,197,94,0.4)]"><Shield size={36} className="text-[#22c55e]" /></div>
            </div>

            <div className="absolute flex flex-col items-center gap-2 transform -translate-x-1/2 -translate-y-1/2 z-10" style={{ left: POS.safe.x, top: POS.safe.y }}>
               <div className="w-16 h-16 rounded-full border-2 flex items-center justify-center bg-[#141b24] border-[#f59e0b] shadow-[0_0_20px_rgba(245,158,11,0.4)]"><Globe size={28} className="text-[#f59e0b]" /></div>
               <div className="glass-panel px-3 py-1 rounded border border-white/5 bg-[#141b24]"><span className="font-mono text-[10px] text-[#f59e0b]">8.8.8.8</span></div>
            </div>

            <div className="absolute flex flex-col items-center gap-2 transform -translate-x-1/2 -translate-y-1/2 z-10" style={{ left: POS.malicious.x, top: POS.malicious.y }}>
               <div className="w-16 h-16 rounded-full border-2 flex items-center justify-center bg-[#141b24] border-[#ef4444] shadow-[0_0_20px_rgba(239,68,68,0.4)]"><AlertTriangle size={28} className="text-[#ef4444]" /></div>
               <div className="glass-panel px-3 py-1 rounded border border-white/5 bg-[#141b24]"><span className="font-mono text-[10px] text-[#ef4444]">198.51.100.99</span></div>
            </div>

            {/* Animating Packets */}
            {packets.map(req => <Packet key={req.id} req={req} onStep={handleStep} onComplete={handleComplete} />)}
          </div>

          {/* Sidebar Area (ACL & State Table) */}
          <div className="w-[450px] shrink-0 flex flex-col gap-4 z-20">
             
             {/* Access Control List */}
             <div className="flex-[1.2] glass-panel border border-white/10 bg-[#141b24] rounded-xl shadow-lg flex flex-col overflow-hidden">
                <div className="bg-black/40 border-b border-white/5 p-3 flex justify-center">
                   <span className="text-[10px] font-bold text-white uppercase tracking-widest">Access Control List (Rule Top-Down)</span>
                </div>
                <div className="flex font-mono text-[9px] uppercase tracking-widest text-slate-500 border-b border-white/5 px-4 py-2 bg-[#0a0e14]/50">
                  <div className="w-8">SEQ</div><div className="w-14">ACT</div><div className="w-10">PRT</div><div className="w-10">DIR</div><div className="flex-1">SRC</div><div className="flex-1 text-right">DST</div>
                </div>
                <div className="flex flex-col p-2 space-y-1 overflow-y-auto">
                   {ACL_RULES.map(rule => {
                     const isScanned = scannedRules.includes(rule.num);
                     const isMatched = activeRule === rule.num;
                     
                     let bg = "bg-transparent";
                     let border = "border-transparent";
                     let text = "text-slate-400";
                     
                     if (isMatched) {
                        bg = rule.action === 'PERMIT' ? "bg-[#06b6d4]/20" : "bg-[#ef4444]/20";
                        border = rule.action === 'PERMIT' ? "border-[#06b6d4]" : "border-[#ef4444]";
                        text = rule.action === 'PERMIT' ? "text-[#06b6d4]" : "text-[#ef4444]";
                     } else if (isScanned) {
                        bg = "bg-white/5";
                        text = "text-slate-300";
                     }

                     return (
                       <div key={rule.num} className={`flex font-mono text-[10px] items-center px-2 py-1.5 rounded border transition-colors duration-300 ${bg} ${border} ${text}`}>
                         <div className="w-8 font-bold">{rule.num}</div>
                         <div className="w-14 font-bold">{rule.action}</div>
                         <div className="w-10">{rule.proto}</div>
                         <div className="w-10">{rule.dir}</div>
                         <div className="flex-1 truncate text-[9px]">{rule.src}</div>
                         <div className="flex-1 text-right truncate text-[9px]">{rule.dst}</div>
                       </div>
                     );
                   })}
                </div>
             </div>

             {/* State Table */}
             <div className="flex-1 glass-panel border border-white/10 bg-[#141b24] rounded-xl shadow-lg flex flex-col overflow-hidden">
                <div className="bg-[#22c55e]/10 border-b border-[#22c55e]/20 p-3 flex justify-center">
                   <span className="text-[10px] font-bold text-[#22c55e] uppercase tracking-widest flex flex-col items-center gap-1">
                     Dynamic State Table (Memory)
                     {stateTable.some(r => r.flash) && <span className="text-[8px] text-[#22c55e] animate-pulse">State Matched! ACL Bypassed.</span>}
                   </span>
                </div>
                <div className="flex font-mono text-[9px] uppercase tracking-widest text-[#22c55e]/50 border-b border-white/5 px-4 py-2 bg-[#0a0e14]/50">
                  <div className="w-10">PRT</div><div className="flex-1">SRC</div><div className="flex-1 text-center">DST</div><div className="w-20 text-right">STATE</div>
                </div>
                <div className="flex flex-col p-2 space-y-1 overflow-y-auto min-h-[100px]">
                   <AnimatePresence>
                     {stateTable.map(entry => (
                       <motion.div 
                         key={entry.id}
                         initial={{ opacity: 0, height: 0 }}
                         animate={{ opacity: 1, height: 'auto' }}
                         className={`flex font-mono text-[10px] items-center px-2 py-2 rounded border transition-colors duration-300 ${entry.flash ? 'bg-[#22c55e]/30 border-[#22c55e] text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-transparent border-transparent text-[#22c55e]'}`}
                       >
                         <div className="w-10">{entry.proto}</div>
                         <div className="flex-1 truncate text-[9px]">{entry.src}</div>
                         <div className="flex-1 text-center truncate text-[9px]">{entry.dst}</div>
                         <div className="w-20 text-right font-bold text-[9px]">{entry.state}</div>
                       </motion.div>
                     ))}
                   </AnimatePresence>
                   {stateTable.length === 0 && (
                     <div className="py-4 text-center text-slate-600 uppercase tracking-widest text-[9px]">Table Empty</div>
                   )}
                </div>
             </div>

          </div>
        </div>

      </div>
    </SimulatorLayout>
  );
}
