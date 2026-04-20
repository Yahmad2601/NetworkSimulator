import { Play, RefreshCw, Zap, Shield, Radio } from "lucide-react";

interface Props {
  mode: "simulation" | "live";
  onModeChange: (mode: "simulation" | "live") => void;
  scanning: boolean;
  onRunDiscovery: () => void;
  onReset: () => void;
  nodesCount: number;
  threatsCount: number;
}

export default function ControlFooter({
  mode,
  onModeChange,
  scanning,
  onRunDiscovery,
  onReset,
  nodesCount,
  threatsCount,
}: Props) {
  return (
    <footer className="border-t border-white/5 bg-[#0d1520]/90 backdrop-blur-md px-5 py-3 flex items-center gap-4">
      {/* Mode toggle */}
      <div
        className="flex items-center rounded-full p-1 border border-white/8 shrink-0"
        style={{ background: "#0a0e14" }}
      >
        {(["simulation", "live"] as const).map(m => (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            className={`
              px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest transition-all duration-300
              ${mode === m
                ? "bg-cyan-500/20 text-cyan-400 shadow-inner border border-cyan-500/30"
                : "text-slate-500 hover:text-slate-400"
              }
            `}
            style={{ fontSize: 10 }}
          >
            {m === "simulation" ? "Simulation" : "Live Mode"}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-white/8 shrink-0" />

      {/* Stats mini */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-1.5">
          <Shield size={12} className="text-teal-400" />
          <span className="text-slate-500 uppercase tracking-widest" style={{ fontSize: 9 }}>Nodes</span>
          <span className="text-teal-400 font-mono font-bold text-xs">{nodesCount}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Zap size={12} className="text-red-400" />
          <span className="text-slate-500 uppercase tracking-widest" style={{ fontSize: 9 }}>Threats</span>
          <span className={`font-mono font-bold text-xs ${threatsCount > 0 ? "text-red-400" : "text-slate-500"}`}>
            {threatsCount}
          </span>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        {/* Secondary: Reset */}
        <button
          onClick={onReset}
          className="group flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/4 border border-white/8 text-slate-400 hover:text-red-400 hover:border-red-500/30 transition-all duration-300 font-semibold uppercase tracking-widest"
          style={{ fontSize: 10 }}
        >
          <RefreshCw size={13} className="group-hover:rotate-180 transition-transform duration-500" />
          Reset Matrix
        </button>

        {/* Secondary: Scan */}
        <button
          onClick={onRunDiscovery}
          disabled={scanning}
          className={`
            group flex items-center gap-2 px-5 py-2.5 rounded-full border font-semibold uppercase tracking-widest transition-all duration-300
            ${scanning
              ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400/60 cursor-not-allowed"
              : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 btn-cyan-glow"
            }
          `}
          style={{ fontSize: 10 }}
        >
          <Radio
            size={13}
            className={scanning ? "animate-pulse" : ""}
          />
          {scanning ? "Scanning..." : "Run Discovery"}
        </button>

        {/* Primary: Run */}
        <button
          className="btn-teal-glow flex items-center gap-2 px-6 py-2.5 rounded-full font-bold uppercase tracking-widest text-[#0a0e14] transition-all duration-300 hover:scale-105 active:scale-95"
          style={{
            fontSize: 10,
            background: "linear-gradient(135deg, #14b8a6, #0891b2)",
          }}
        >
          <Play size={13} fill="currentColor" />
          Run Simulation
        </button>
      </div>
    </footer>
  );
}
