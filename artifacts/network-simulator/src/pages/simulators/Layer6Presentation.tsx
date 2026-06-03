import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Code, Lock, Minimize2, RotateCcw } from "lucide-react";
import SimulatorLayout from "../../components/SimulatorLayout";

export default function Layer6Presentation() {
  const [coding, setCoding] = useState(false);
  const [crypto, setCrypto] = useState(false);
  const [compress, setCompress] = useState(false);

  const getSubtext = () => {
    if (coding && crypto && compress) return "Full Transformation: Data is formatted, secured, and optimized.";
    if (coding && crypto) return "Coding & Cryptography: Format structured data, then securely encrypt it.";
    if (coding && compress) return "Coding & Compression: Format structured data, then compress it for smaller transmission size.";
    if (crypto && compress) return "Cryptography & Compression: Secure data with encryption, then shrink the payload footprint.";
    if (crypto) return "Cryptography: Ensuring data privacy through encryption.";
    if (coding) return "Coding: Formatting data into a standard structure (like JSON/XML).";
    if (compress) return "Compression: Reducing payload size for efficient transmission.";
    return "Layer 6 prepares data for the Application Layer or Network.";
  };

  const getPayloadText = () => {
    if (coding && crypto && compress) return `eyAibSI...[ZIP-ENC]\n\n&Mx$Q87SJc $xGiD)p!x9#Lk2@v1^Zm\n(Optimized & Encrypted App Data)`;
    if (coding && crypto) return `eyAibWVzc2FnZSI6ICImTXgkWVE4N1NKYyAke...\n(Encrypted JSON Payload)`;
    if (coding && compress) return `{"m":"SecMsgTx$1k","ts":177682}\n[ZIP - Minified JSON]`;
    if (crypto && compress) return `&Mx$Q...[ZIP-ENC]\n(Compressed cipher block)`;
    if (coding) return `{\n  "message": "Secret Message: Transfer $1000",\n  "timestamp": 1776827028679\n}`;
    if (crypto) return `&Mx$Q87SJc $xGiD)p!x9#Lk2@v1^Zm\n7vB$z9!L...`;
    if (compress) return `SecMsgTx$1k[ZIP]`;
    return `Secret Message: Transfer $1000`;
  };
  
  const borderColor = crypto ? "#ef4444" : "#06b6d4";
  const shadowColor = crypto ? "rgba(239, 68, 68, 0.4)" : "rgba(6, 182, 212, 0.4)";

  return (
    <SimulatorLayout
      title="Layer 6 Presentation"
      subtitle="Data Transformation & Syntax"
      layerBadge="L6"
      layerColor="#3b82f6"
      footerControls={[]}
    >
      <div className="flex flex-col h-full bg-[#0a0e14] text-slate-400 font-sans overflow-hidden">
        
        {/* Custom Header Metric Area */}
        <div className="shrink-0 p-6 flex justify-between items-center border-b border-white/5 bg-[#141b24]">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-widest text-[#06b6d4] drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]">
              Layer 6: Presentation Layer
            </h1>
            <p className="text-xs text-slate-400 mt-2 max-w-md leading-relaxed h-8">
              {getSubtext()}
            </p>
          </div>
          
          <div className="flex gap-8">
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1">Format</span>
              <span className="text-sm font-mono font-bold text-cyan-400">{coding ? "JSON" : "Raw Text"}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1">Security</span>
              <span className={`text-sm font-mono font-bold ${crypto ? "text-red-400" : "text-slate-500"}`}>{crypto ? "AES-Sim" : "None"}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1">Payload Size</span>
              <span className={`text-sm font-mono font-bold ${compress ? "text-green-400" : "text-slate-400"}`}>
                {compress ? (coding ? "18 Bytes" : "12 Bytes") : (coding ? "84 Bytes" : "30 Bytes")}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1">Efficiency</span>
              <span className={`text-sm font-mono font-bold ${compress ? "text-green-400" : "text-slate-500"}`}>{compress ? "High" : "Standard"}</span>
            </div>
          </div>
        </div>

        {/* Interactive Network Canvas */}
        <div className="flex-1 relative bg-[#0c1219] mx-6 my-4 rounded-xl border border-white/5 flex items-center justify-center shadow-[inset_0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
          <motion.div
            layout
            animate={{
              borderColor: borderColor,
              boxShadow: `0 0 30px ${shadowColor}`,
              scale: compress ? 0.8 : 1,
              backgroundColor: crypto ? "#1a0f12" : "#0d1b2a",
            }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="relative border-2 rounded-xl p-8 flex items-center justify-center text-center max-w-xl w-full min-h-[240px]"
          >
            {/* Top Pill */}
            <div 
              className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-bold tracking-widest text-white shadow-lg transition-colors duration-500" 
              style={{ backgroundColor: crypto ? "#ef4444" : "#06b6d4" }}
            >
              {crypto ? "ENCRYPTED" : "PLAINTEXT"}
            </div>

            {/* Bottom Pill (Compression) */}
            <AnimatePresence>
              {compress && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.8 }}
                  className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-bold tracking-widest text-white bg-[#22c55e] shadow-[0_0_15px_rgba(34,197,94,0.6)]"
                >
                  -60% SIZE
                </motion.div>
              )}
            </AnimatePresence>

            {/* Icons in corners */}
            <AnimatePresence>
              {coding && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} className="absolute top-4 left-4">
                  <Code size={24} className="text-cyan-400" />
                </motion.div>
              )}
              {crypto && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} className="absolute top-4 right-4">
                  <Lock size={24} className="text-red-400" />
                </motion.div>
              )}
              {compress && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} className="absolute bottom-4 right-4">
                  <Minimize2 size={24} className="text-green-400" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Payload Text */}
            <pre className="font-mono text-sm text-slate-300 whitespace-pre-wrap break-all text-left">
              {getPayloadText()}
            </pre>

          </motion.div>
        </div>

        {/* Footer Control Bar */}
        <div className="shrink-0 bg-[#141b24] p-6 border-t border-white/5 flex flex-col items-center">
           <div className="flex w-full max-w-4xl justify-between items-center px-4">
             <div className="flex gap-12">
               
               {/* Coding Toggle */}
               <div className="flex items-center gap-3">
                 <button
                   onClick={() => setCoding(!coding)}
                   className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${coding ? "bg-cyan-500" : "bg-slate-700"}`}
                 >
                   <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ${coding ? "translate-x-7" : "translate-x-1"}`} />
                 </button>
                 <div className="flex items-center gap-1.5 text-sm font-bold text-slate-300 uppercase tracking-widest">
                   <span className="opacity-70"><Code size={16}/></span>
                   Coding (JSON)
                 </div>
               </div>

               {/* Cryptography Toggle */}
               <div className="flex items-center gap-3">
                 <button
                   onClick={() => setCrypto(!crypto)}
                   className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${crypto ? "bg-red-500" : "bg-slate-700"}`}
                 >
                   <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ${crypto ? "translate-x-7" : "translate-x-1"}`} />
                 </button>
                 <div className="flex items-center gap-1.5 text-sm font-bold text-slate-300 uppercase tracking-widest">
                   <span className="opacity-70"><Lock size={16}/></span>
                   Cryptography
                 </div>
               </div>

               {/* Compression Toggle */}
               <div className="flex items-center gap-3">
                 <button
                   onClick={() => setCompress(!compress)}
                   className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${compress ? "bg-green-500" : "bg-slate-700"}`}
                 >
                   <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ${compress ? "translate-x-7" : "translate-x-1"}`} />
                 </button>
                 <div className="flex items-center gap-1.5 text-sm font-bold text-slate-300 uppercase tracking-widest">
                   <span className="opacity-70"><Minimize2 size={16}/></span>
                   Compression
                 </div>
               </div>

             </div>

             {/* Reset Button */}
             <button 
              onClick={() => { setCoding(false); setCrypto(false); setCompress(false); }} 
              className="flex items-center gap-2 px-6 py-2 rounded-full border border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold uppercase tracking-widest text-xs transition-colors"
             >
               <RotateCcw size={14} /> Reset
             </button>

           </div>
        </div>

      </div>
    </SimulatorLayout>
  );
}
