import { useState } from "react";
import { Network, HardDrive, Shield } from "lucide-react";
import SimulatorLayout, { FooterControl } from "../../components/SimulatorLayout";
import { computeSubnet, getIpClass, isValidIp, numberToIp } from "../../lib/ip";

export default function IPv4Subnetting() {
  const [baseIpInput, setBaseIpInput] = useState("192.168.1.0");
  const [cidr, setCidr] = useState(24);

  const isValid = isValidIp(baseIpInput);

  const parsedIp = isValid ? baseIpInput : "0.0.0.0";
  const {
    maskNum,
    wildcardNum,
    networkNum,
    broadcastNum,
    firstUsableNum,
    lastUsableNum,
    totalHosts,
    totalSubnets,
    binaryString,
  } = computeSubnet(parsedIp, cidr);

  const footerControls: FooterControl[] = [
    {
      key: "cidr",
      type: "slider",
      label: "CIDR Prefix (/)",
      min: 0,
      max: 32,
      step: 1,
      value: cidr,
      onChange: (val) => setCidr(val as number),
    },
    { key: "sp", type: "spacer" },
  ];

  return (
    <SimulatorLayout
      title="IPv4 Subnetting & CIDR Visualizer"
      subtitle="Network Address Translation & Bitwise Logic"
      layerBadge="L3"
      layerColor="#06b6d4"
      footerControls={footerControls}
    >
      <div className="h-full flex flex-col p-4 select-none overflow-y-auto text-slate-400 bg-[#0a0e14]">
        
        {/* Header Status Metrics */}
        <div className="grid grid-cols-4 gap-3 shrink-0 mb-4">
          {[
            { label: "SYSTEM", value: "IPv4 Addressing", color: "#22c55e" },
            { label: "CIDR NOTATION", value: `/${cidr}`, color: "#06b6d4" },
            { label: "TOTAL SUBNETS", value: totalSubnets.toLocaleString(), color: "#f59e0b" },
            { label: "HOSTS/SUBNET", value: totalHosts.toLocaleString(), color: "#f59e0b" },
          ].map(item => (
            <div key={item.label} className="glass-panel border border-white/5 bg-[#141b24] p-3 rounded-xl shadow-lg flex flex-col items-center">
              <div className="text-[10px] uppercase tracking-widest mb-1">{item.label}</div>
              <div className="font-mono font-bold text-lg truncate w-full text-center" style={{ color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Interactive Network Canvas (The Binary Slicer) */}
        <div className="relative border border-white/5 rounded-xl bg-[#0c1219] p-6 mb-4 shadow-[inset_0_0_30px_rgba(0,0,0,0.4)] flex flex-col items-center justify-center overflow-hidden min-h-[200px]">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-6 absolute top-4 left-4">The Binary Slicer</div>
          
          <div className="flex flex-col items-center w-full max-w-4xl relative mt-4">
            {/* Binary Display */}
            <div className="flex gap-2 text-2xl sm:text-3xl lg:text-4xl font-mono tracking-widest relative z-10 w-full justify-between">
              {[0, 1, 2, 3].map(octetIndex => (
                <div key={octetIndex} className="flex gap-1 relative">
                  {[0, 1, 2, 3, 4, 5, 6, 7].map(bitIndex => {
                    const globalIndex = octetIndex * 8 + bitIndex;
                    const isNetwork = globalIndex < cidr;
                    const isHost = globalIndex >= cidr;
                    return (
                      <span 
                        key={bitIndex}
                        className={`transition-colors duration-300 ${isNetwork ? 'text-[#06b6d4] drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]' : 'text-[#f59e0b] drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]'}`}
                      >
                        {binaryString[globalIndex]}
                      </span>
                    );
                  })}
                  {octetIndex < 3 && <span className="text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.8)] self-end pb-1 mx-1 sm:mx-2 lg:mx-4">.</span>}
                </div>
              ))}
            </div>

            {/* Slider Boundary Track */}
            <div className="relative w-full h-1 bg-white/10 mt-4 rounded-full overflow-visible">
               <div 
                 className="absolute top-0 bottom-0 bg-[#06b6d4]/50 shadow-[0_0_10px_rgba(6,182,212,0.5)] rounded-l-full transition-all duration-300"
                 style={{ width: `${(cidr / 32) * 100}%` }}
               />
               <div 
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-1.5 h-16 bg-white shadow-[0_0_15px_rgba(255,255,255,1)] rounded-full transition-all duration-300 z-20 flex items-center justify-center"
                  style={{ left: `${(cidr / 32) * 100}%` }}
               >
                 <div className="absolute -top-6 text-[10px] font-bold text-white bg-[#06b6d4] px-1.5 rounded">/{cidr}</div>
               </div>
            </div>
            
            {/* Legend */}
            <div className="flex justify-between w-full mt-8 text-[10px] font-bold uppercase tracking-widest">
               <span className="text-[#06b6d4]">Network Bits</span>
               <span className="text-[#f59e0b]">Host Bits</span>
            </div>
          </div>
        </div>

        {/* Configuration & Results Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1">
          
          {/* Panel A: Network Configuration (Inputs) */}
          <div className="glass-panel border border-white/5 bg-[#141b24] p-5 rounded-xl shadow-lg flex flex-col gap-4">
             <div className="flex items-center gap-2 text-[#06b6d4] border-b border-white/5 pb-2">
               <HardDrive size={16} />
               <span className="text-[11px] uppercase tracking-widest font-bold">Network Config</span>
             </div>
             
             <div className="flex flex-col gap-1.5">
               <label className="text-[10px] uppercase tracking-widest text-slate-400">Base IP Address</label>
               <input 
                 type="text"
                 value={baseIpInput}
                 onChange={(e) => setBaseIpInput(e.target.value)}
                 className={`bg-[#0c1219] border ${isValid ? 'border-white/10 focus:border-[#06b6d4]' : 'border-red-500 focus:border-red-500'} rounded p-2 text-white font-mono text-sm outline-none transition-colors w-full`}
               />
               {!isValid && <span className="text-[10px] text-red-500">Invalid IPv4 format</span>}
             </div>
             
             {isValid && (
               <div className="flex items-center gap-2 mt-2 bg-[#22c55e]/10 border border-[#22c55e]/20 p-2 rounded text-[#22c55e]">
                 <Shield size={14} />
                 <span className="text-[11px] font-bold uppercase">Initial Network Class: {getIpClass(parsedIp)}</span>
               </div>
             )}
          </div>

          {/* Panel B: Subnet Details (Results) */}
          <div className="glass-panel border border-white/5 bg-[#141b24] p-5 rounded-xl shadow-lg lg:col-span-2 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-[#06b6d4] border-b border-white/5 pb-2">
               <Network size={16} />
               <span className="text-[11px] uppercase tracking-widest font-bold">Subnet Details <span className="text-slate-500 ml-2 normal-case font-normal">(Results for {parsedIp}/{cidr})</span></span>
             </div>

             <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                {[
                  { label: "Dot-Decimal Subnet Mask", value: numberToIp(maskNum), color: "#06b6d4" },
                  { label: "Network Address", value: numberToIp(networkNum), color: "#cbd5e1" },
                  { label: "First Usable Host", value: numberToIp(firstUsableNum), color: "#22c55e" },
                  { label: "Last Usable Host", value: numberToIp(lastUsableNum), color: "#22c55e" },
                  { label: "Broadcast Address", value: numberToIp(broadcastNum), color: "#f59e0b" },
                  { label: "Wildcard Mask", value: numberToIp(wildcardNum), color: "#8b5cf6" },
                ].map(item => (
                  <div key={item.label} className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-widest text-slate-500">{item.label}</span>
                    <span className="font-mono text-sm" style={{ color: item.color }}>{isValid ? item.value : "---.---.---.---"}</span>
                  </div>
                ))}
             </div>
          </div>

        </div>

      </div>
    </SimulatorLayout>
  );
}
