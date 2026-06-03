import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, CheckCircle2, XCircle, Info } from "lucide-react";
import SimulatorLayout, { FooterControl } from "../../components/SimulatorLayout";

const WIRE_COLORS: Record<string, string> = {
  'wo': 'repeating-linear-gradient(45deg, #f8fafc, #f8fafc 8px, #f97316 8px, #f97316 16px)',
  'o': '#f97316',
  'wg': 'repeating-linear-gradient(45deg, #f8fafc, #f8fafc 8px, #22c55e 8px, #22c55e 16px)',
  'g': '#22c55e',
  'wb': 'repeating-linear-gradient(45deg, #f8fafc, #f8fafc 8px, #3b82f6 8px, #3b82f6 16px)',
  'b': '#3b82f6',
  'wbr': 'repeating-linear-gradient(45deg, #f8fafc, #f8fafc 8px, #78350f 8px, #78350f 16px)',
  'br': '#78350f'
};

const WIRE_NAMES: Record<string, string> = {
  'wo': 'White/Orange', 'o': 'Orange', 'wg': 'White/Green', 'g': 'Green',
  'wb': 'White/Blue', 'b': 'Blue', 'wbr': 'White/Brown', 'br': 'Brown'
};

const T568B = ['wo', 'o', 'wg', 'b', 'wb', 'g', 'wbr', 'br'];
const T568A = ['wg', 'g', 'wo', 'b', 'wb', 'o', 'wbr', 'br'];

type CableType = 'Straight-Through' | 'Crossover' | 'Rollover';
type StandardType = 'T568B' | 'T568A';

export default function UTPCrimpingSimulator() {
  const [cableType, setCableType] = useState<CableType>('Straight-Through');
  const [baseStandard, setBaseStandard] = useState<StandardType>('T568B');
  
  const [staging, setStaging] = useState<string[]>([]);
  const [slotsA, setSlotsA] = useState<(string | null)[]>(Array(8).fill(null));
  const [slotsB, setSlotsB] = useState<(string | null)[]>(Array(8).fill(null));
  
  const [testResult, setTestResult] = useState<'none' | 'success' | 'error'>('none');
  const [errorSlotsA, setErrorSlotsA] = useState<boolean[]>(Array(8).fill(false));
  const [errorSlotsB, setErrorSlotsB] = useState<boolean[]>(Array(8).fill(false));
  const [activeWire, setActiveWire] = useState<string | null>(null);
  const [selectedWire, setSelectedWire] = useState<string | null>(null);

  const slotRefsA = useRef<(HTMLDivElement | null)[]>(Array(8).fill(null));
  const slotRefsB = useRef<(HTMLDivElement | null)[]>(Array(8).fill(null));
  const stagingRef = useRef<HTMLDivElement | null>(null);

  const initGame = () => {
    // 2 sets of 8 wires
    const allWires = [...T568B.map(w => `${w}-1`), ...T568B.map(w => `${w}-2`)];
    // Randomize
    for (let i = allWires.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allWires[i], allWires[j]] = [allWires[j], allWires[i]];
    }
    setStaging(allWires);
    setSlotsA(Array(8).fill(null));
    setSlotsB(Array(8).fill(null));
    setTestResult('none');
    setErrorSlotsA(Array(8).fill(false));
    setErrorSlotsB(Array(8).fill(false));
  };

  useEffect(() => {
    initGame();
  }, [cableType, baseStandard]);

  
  const executeMove = (wireId: string, targetEnd: 'A' | 'B' | null, targetSlotIndex: number, toStaging: boolean) => {
      setSlotsA(prevSlotsA => {
        const currentSlotAIndex = prevSlotsA.indexOf(wireId);
        let updatedSlotsA = [...prevSlotsA];
        
        setSlotsB(prevSlotsB => {
          const currentSlotBIndex = prevSlotsB.indexOf(wireId);
          let updatedSlotsB = [...prevSlotsB];
          
          setStaging(prevStaging => {
            const inStaging = prevStaging.includes(wireId);
            let updatedStaging = [...prevStaging];

            if (currentSlotAIndex !== -1) updatedSlotsA[currentSlotAIndex] = null;
            if (currentSlotBIndex !== -1) updatedSlotsB[currentSlotBIndex] = null;
            if (inStaging) updatedStaging = updatedStaging.filter(w => w !== wireId);

            if (targetEnd === 'A' && targetSlotIndex !== -1) {
              const existingWire = updatedSlotsA[targetSlotIndex];
              if (existingWire) {
                 if (currentSlotAIndex !== -1) updatedSlotsA[currentSlotAIndex] = existingWire;
                 else if (currentSlotBIndex !== -1) updatedSlotsB[currentSlotBIndex] = existingWire;
                 else updatedStaging.push(existingWire);
              }
              updatedSlotsA[targetSlotIndex] = wireId;
            } else if (targetEnd === 'B' && targetSlotIndex !== -1) {
              const existingWire = updatedSlotsB[targetSlotIndex];
              if (existingWire) {
                 if (currentSlotAIndex !== -1) updatedSlotsA[currentSlotAIndex] = existingWire;
                 else if (currentSlotBIndex !== -1) updatedSlotsB[currentSlotBIndex] = existingWire;
                 else updatedStaging.push(existingWire);
              }
              updatedSlotsB[targetSlotIndex] = wireId;
            } else if (toStaging || !targetEnd) {
              updatedStaging.push(wireId);
            }
            return updatedStaging;
          });
          return updatedSlotsB;
        });
        return updatedSlotsA;
      });
  };

  const handleSlotClick = (end: 'A' | 'B', index: number) => {
    if (selectedWire) {
      if (testResult !== 'none') setTestResult('none');
      executeMove(selectedWire, end, index, false);
      setSelectedWire(null);
    }
  };

  const handleStagingClick = () => {
    if (selectedWire) {
      if (testResult !== 'none') setTestResult('none');
      // Only move to staging if it's coming from a slot
      if (!staging.includes(selectedWire)) {
        executeMove(selectedWire, null, -1, true);
      }
      setSelectedWire(null);
    }
  }


  const handleDragEnd = (wireId: string, info: any) => {
    setActiveWire(null);
    if (testResult !== 'none') setTestResult('none');

    const { point } = info;
    let targetEnd: 'A' | 'B' | null = null;
    let targetSlotIndex = -1;
    let toStaging = false;

    // Check End A
    slotRefsA.current.forEach((ref, index) => {
      if (!ref) return;
      const rect = ref.getBoundingClientRect();
      if (point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom) {
        targetEnd = 'A';
        targetSlotIndex = index;
      }
    });

    // Check End B
    if (!targetEnd) {
      slotRefsB.current.forEach((ref, index) => {
        if (!ref) return;
        const rect = ref.getBoundingClientRect();
        if (point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom) {
          targetEnd = 'B';
          targetSlotIndex = index;
        }
      });
    }

    // Check Staging
    if (!targetEnd && stagingRef.current) {
      const rect = stagingRef.current.getBoundingClientRect();
      if (point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom) {
        toStaging = true;
      }
    }

    // Perform swap / move logic
    executeMove(wireId, targetEnd, targetSlotIndex, toStaging);
  };

  const handleTest = () => {
    let targetA = baseStandard === 'T568B' ? [...T568B] : [...T568A];
    let targetB = [...targetA];

    if (cableType === 'Crossover') {
      targetB = baseStandard === 'T568B' ? [...T568A] : [...T568B];
    } else if (cableType === 'Rollover') {
      targetB = [...targetA].reverse();
    }

    let isError = false;
    const errorsA = Array(8).fill(false);
    const errorsB = Array(8).fill(false);

    const getBaseCode = (id: string | null) => id ? id.split('-')[0] : null;

    slotsA.forEach((wireId, idx) => {
      if (getBaseCode(wireId) !== targetA[idx]) {
        isError = true;
        errorsA[idx] = true;
      }
    });

    slotsB.forEach((wireId, idx) => {
      if (getBaseCode(wireId) !== targetB[idx]) {
        isError = true;
        errorsB[idx] = true;
      }
    });

    setErrorSlotsA(errorsA);
    setErrorSlotsB(errorsB);
    setTestResult(isError ? 'error' : 'success');
  };

  const filledCountA = slotsA.filter(Boolean).length;
  const filledCountB = slotsB.filter(Boolean).length;
  const totalFilled = filledCountA + filledCountB;
  const isReadyToTest = totalFilled === 16;

  const footerControls: FooterControl[] = [
    {
      key: "ctype",
      type: "button",
      label: `Type: ${cableType}`,
      variant: "secondary",
      onClick: () => {
        const types: CableType[] = ['Straight-Through', 'Crossover', 'Rollover'];
        setCableType(types[(types.indexOf(cableType) + 1) % types.length]);
      }
    },
    { 
      key: "std-toggle", 
      type: "button", 
      label: `Base: ${baseStandard}`, 
      variant: "secondary", 
      onClick: () => setBaseStandard(s => s === 'T568B' ? 'T568A' : 'T568B')
    },
    { key: "sp", type: "spacer" },
    { 
      key: "reset", 
      type: "button", 
      label: "Strip Cable (Reset)", 
      variant: "secondary", 
      icon: <RefreshCw size={12} />, 
      onClick: initGame 
    },
    { 
      key: "test", 
      type: "button", 
      label: "Crimp & Test", 
      variant: isReadyToTest ? "cyan" : "secondary",
      onClick: isReadyToTest ? handleTest : undefined
    }
  ];

  const getInfoText = () => {
    if (cableType === 'Straight-Through') return "Connects different devices (e.g., PC to Switch). Both ends use the exact same standard.";
    if (cableType === 'Crossover') return "Connects similar devices (e.g., PC to PC, Switch to Switch). One end is T568A, the other is T568B.";
    if (cableType === 'Rollover') return "Used for Console cables (PC to Router). End B is the exact reverse of End A (Pin 1 to 8, 2 to 7, etc.).";
    return "";
  };

  const getBaseCode = (id: string) => id.split('-')[0];

  const Wire = ({ id, active }: { id: string, active?: boolean }) => {
    const baseCode = getBaseCode(id);
    const isSelected = selectedWire === id;
    
    return (
      <motion.div
        layoutId={`wire-${id}`}
        drag
        dragMomentum={false}
        onDragStart={() => {
           setActiveWire(id);
           setSelectedWire(id); // selecting via drag too
        }}
        onDragEnd={(e, info) => handleDragEnd(id, info)}
        onClick={(e) => {
           e.stopPropagation();
           setSelectedWire(isSelected ? null : id);
        }}
        whileDrag={{ scale: 1.1, zIndex: 999, cursor: 'grabbing' }}
        className={`w-5 sm:w-6 h-24 sm:h-28 border-x-2 border-b-2 cursor-grab shadow-lg relative transition-shadow ${active || isSelected ? 'z-[999]' : 'z-10'} ${isSelected ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#0a0e14] scale-105' : ''}`}
        style={{ 
          background: WIRE_COLORS[baseCode], 
          borderColor: baseCode.startsWith('w') && baseCode.length > 2 ? '#94a3b8' : 'rgba(255,255,255,0.2)',
        }}
      >
         {/* Exposed Copper Tip */}
         <div className="absolute -top-3 left-[15%] right-[15%] h-3 bg-gradient-to-t from-[#b87333] to-[#d4af37] border-x border-t border-[#8b5a2b] rounded-t-sm shadow-inner" />
         
         <div className="absolute inset-x-0 -bottom-6 text-center opacity-0 hover:opacity-100 transition-opacity">
            <span className="text-[9px] font-mono whitespace-nowrap bg-black/80 px-1 py-0.5 rounded text-white">{WIRE_NAMES[baseCode]}</span>
         </div>
      </motion.div>
    );
  };

  return (
    <SimulatorLayout
      title="Dual-End UTP Cable Simulator"
      subtitle="Advanced Cable Fabrication & Testing"
      layerBadge="Layer 1"
      layerColor="#22c55e"
      footerControls={footerControls}
    >
      <div className="h-full flex flex-col p-2 sm:p-4 text-slate-400 bg-[#0a0e14] select-none">
        
        {/* Header Status Metrics */}
        <div className="grid grid-cols-3 gap-3 shrink-0 mb-4 relative z-20">
          <div className="glass-panel border border-white/5 bg-[#141b24] p-2 sm:p-3 rounded-xl shadow-lg flex flex-col items-center justify-center">
             <div className="text-[9px] sm:text-[10px] uppercase tracking-widest mb-1 text-slate-500">CABLE TYPE</div>
             <div className="font-mono font-bold text-sm sm:text-base text-white tracking-widest text-center">{cableType}</div>
          </div>
          <div className="glass-panel border border-white/5 bg-[#141b24] p-2 sm:p-3 rounded-xl shadow-lg flex flex-col items-center justify-center">
             <div className="text-[9px] sm:text-[10px] uppercase tracking-widest mb-1 text-slate-500">BASE STANDARD</div>
             <div className="font-mono font-bold text-sm sm:text-base text-white tracking-widest">{baseStandard}</div>
          </div>
          <div className="glass-panel border border-white/5 bg-[#141b24] p-2 sm:p-3 rounded-xl shadow-lg flex flex-col items-center justify-center">
             <div className="text-[9px] sm:text-[10px] uppercase tracking-widest mb-1 text-slate-500">PINS FILLED</div>
             <div className={`font-mono font-bold text-sm sm:text-base tracking-widest ${isReadyToTest ? 'text-[#22c55e]' : 'text-[#06b6d4]'}`}>{totalFilled} / 16</div>
          </div>
        </div>

        {/* Dynamic Info Box */}
        <div className="mb-4 bg-[#0e1520] border border-cyan-900/30 rounded-lg p-3 flex items-start gap-3 backdrop-blur-md relative z-20">
           <Info className="text-cyan-500 shrink-0 mt-0.5" size={18} />
           <p className="text-xs sm:text-sm text-cyan-100/70 leading-relaxed font-mono">
             <strong className="text-cyan-400 font-bold">{cableType}:</strong> {getInfoText()}
           </p>
        </div>

        {/* Interactive Canvas */}
        <div className="flex flex-col flex-1 border border-white/5 bg-[#0c1219] rounded-xl relative">
           
           {/* Notification overlay */}
           <AnimatePresence>
             {testResult !== 'none' && (
                <motion.div 
                   initial={{ opacity: 0, scale: 0.95, y: -20 }} 
                   animate={{ opacity: 1, scale: 1, y: 0 }} 
                   exit={{ opacity: 0, scale: 0.95, y: -20 }}
                   className={`absolute top-4 left-1/2 -translate-x-1/2 px-4 sm:px-6 py-2 rounded-full z-30 flex items-center gap-2 font-bold text-xs uppercase tracking-widest border shadow-xl ${testResult === 'success' ? 'bg-[#22c55e]/20 border-[#22c55e] text-[#22c55e]' : 'bg-[#ef4444]/20 border-[#ef4444] text-[#ef4444]'}`}
                >
                   {testResult === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                   {testResult === 'success' ? 'Continuity Test Passed!' : 'Test Failed. Check highlighted pins based on the selected cable type.'}
                </motion.div>
             )}
           </AnimatePresence>

           {/* Top Zone: RJ45 Clips A and B */}
           <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 pb-6 pt-12 relative px-4">
              
              {/* End A */}
              <div className="flex flex-col items-center">
                 <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">RJ45 - End A</div>
                 <div className={`w-[280px] sm:w-[320px] h-[140px] glass-panel border bg-[#141b24]/80 backdrop-blur-md rounded-t-xl rounded-b flex items-end justify-center px-2 sm:px-4 pb-2 transition-colors duration-500 ${testResult === 'success' ? 'border-[#22c55e] shadow-[0_0_30px_rgba(34,197,94,0.2)]' : testResult === 'error' ? 'border-[#ef4444] shadow-[0_0_30px_rgba(239,68,68,0.2)]' : 'border-white/10'}`}>
                    <div className="flex gap-1 sm:gap-2 w-full justify-between h-full pt-10">
                       {slotsA.map((wireId, idx) => (
                          <div 
                            key={`slotA-${idx}`} 
                            ref={el => slotRefsA.current[idx] = el}
                            onClick={() => handleSlotClick('A', idx)}
                            className={`flex-1 flex flex-col items-center justify-end border-x border-t-0 relative pb-2 transition-colors cursor-pointer hover:bg-white/5 ${errorSlotsA[idx] && testResult === 'error' ? 'bg-[#ef4444]/30 border-[#ef4444]' : 'bg-black/40 border-white/5'}`}
                          >
                             <div className="absolute -top-6 text-[9px] font-mono text-slate-500 font-bold">{idx + 1}</div>
                             <div className="absolute top-0 inset-x-1 h-4 sm:h-6 bg-gradient-to-b from-yellow-400 to-amber-600 rounded-t-sm opacity-80" />
                             <div className="h-[90px] sm:h-[100px] w-full flex items-end justify-center">
                                {wireId && <Wire id={wireId} active={activeWire === wireId} />}
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>

              {/* End B */}
              <div className="flex flex-col items-center">
                 <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">RJ45 - End B</div>
                 <div className={`w-[280px] sm:w-[320px] h-[140px] glass-panel border bg-[#141b24]/80 backdrop-blur-md rounded-t-xl rounded-b flex items-end justify-center px-2 sm:px-4 pb-2 transition-colors duration-500 ${testResult === 'success' ? 'border-[#22c55e] shadow-[0_0_30px_rgba(34,197,94,0.2)]' : testResult === 'error' ? 'border-[#ef4444] shadow-[0_0_30px_rgba(239,68,68,0.2)]' : 'border-white/10'}`}>
                    <div className="flex gap-1 sm:gap-2 w-full justify-between h-full pt-10">
                       {slotsB.map((wireId, idx) => (
                          <div 
                            key={`slotB-${idx}`} 
                            ref={el => slotRefsB.current[idx] = el}
                            onClick={() => handleSlotClick('B', idx)}
                            className={`flex-1 flex flex-col items-center justify-end border-x border-t-0 relative pb-2 transition-colors cursor-pointer hover:bg-white/5 ${errorSlotsB[idx] && testResult === 'error' ? 'bg-[#ef4444]/30 border-[#ef4444]' : 'bg-black/40 border-white/5'}`}
                          >
                             <div className="absolute -top-6 text-[9px] font-mono text-slate-500 font-bold">{idx + 1}</div>
                             <div className="absolute top-0 inset-x-1 h-4 sm:h-6 bg-gradient-to-b from-yellow-400 to-amber-600 rounded-t-sm opacity-80" />
                             <div className="h-[90px] sm:h-[100px] w-full flex items-end justify-center">
                                {wireId && <Wire id={wireId} active={activeWire === wireId} />}
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>

           </div>

           {/* Bottom Zone: Staging Area */}
           <div className="h-[220px] sm:h-[180px] border-t border-solid border-white/10 bg-black/40 flex flex-col pt-3 px-4 relative">
              <div className="absolute top-3 left-4 text-[10px] uppercase tracking-widest font-bold text-slate-600">Source: Loose Wires Palette</div>
              
              <div 
                ref={stagingRef}
                className="flex-1 flex flex-wrap items-center justify-center gap-x-2 gap-y-4 sm:gap-x-4 sm:gap-y-6 pt-4 pb-2 cursor-pointer"
                onClick={handleStagingClick}
              >
                 {staging.map(wireId => (
                     <div key={`stage-${wireId}`} className="w-5 sm:w-6 flex justify-center">
                       <Wire id={wireId} active={activeWire === wireId} />
                     </div>
                 ))}
              </div>
           </div>
        </div>

      </div>
    </SimulatorLayout>
  );
}
