import { X, TrendingUp, TrendingDown, Activity } from "lucide-react";
import type { NetworkNode } from "../data/mockData";

interface Props {
  node: NetworkNode | null;
  onClose: () => void;
}

function StatusBadge({ status }: { status: NetworkNode["status"] }) {
  const map = {
    active: { color: "#06b6d4", bg: "rgba(6,182,212,0.1)", label: "ACTIVE" },
    warning: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", label: "WARNING" },
    threat: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", label: "THREAT DETECTED" },
    idle: { color: "#475569", bg: "rgba(71,85,105,0.1)", label: "IDLE" },
  };
  const s = map[status];
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-widest"
      style={{ color: s.color, background: s.bg, fontSize: 9 }}
    >
      {s.label}
    </span>
  );
}

export default function NodeDetailsPanel({ node, onClose }: Props) {
  if (!node) return null;

  const isActive = node.status === "active";
  const isWarning = node.status === "warning";
  const isThreat = node.status === "threat";

  const color = isThreat ? "#ef4444" : isWarning ? "#f59e0b" : "#06b6d4";

  return (
    <div
      className="absolute top-4 left-4 z-30 glass-panel rounded-xl border overflow-hidden"
      style={{
        borderColor: color + "30",
        width: 240,
        boxShadow: `0 0 0 1px ${color}20, 0 8px 32px rgba(0,0,0,0.5)`,
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: color + "20", background: color + "08" }}
      >
        <div>
          <div className="text-white font-bold text-sm">{node.label}</div>
          <div className="font-mono text-xs mt-0.5" style={{ color: color + "cc" }}>{node.ip}</div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded"
        >
          <X size={14} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-slate-500 uppercase tracking-widest" style={{ fontSize: 9 }}>Status</span>
          <StatusBadge status={node.status} />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500 uppercase tracking-widest" style={{ fontSize: 9 }}>Type</span>
          <span className="text-slate-300 text-xs uppercase tracking-wider">{node.type}</span>
        </div>

        <div
          className="rounded-lg p-3 border space-y-2"
          style={{ background: "#0a0e14", borderColor: "#1e2d3d" }}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <Activity size={10} style={{ color }} />
            <span className="text-slate-500 uppercase tracking-widest" style={{ fontSize: 9 }}>
              Traffic
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <TrendingDown size={10} className="text-cyan-400" />
              <span className="text-slate-500 uppercase tracking-widest" style={{ fontSize: 8 }}>IN</span>
            </div>
            <span className="font-mono text-cyan-400 font-bold text-xs">
              {node.packets_in.toLocaleString()} pkt
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <TrendingUp size={10} className="text-teal-400" />
              <span className="text-slate-500 uppercase tracking-widest" style={{ fontSize: 8 }}>OUT</span>
            </div>
            <span className="font-mono text-teal-400 font-bold text-xs">
              {node.packets_out.toLocaleString()} pkt
            </span>
          </div>
        </div>

        {isThreat && (
          <div
            className="rounded-lg p-3 border"
            style={{ background: "rgba(239,68,68,0.05)", borderColor: "rgba(239,68,68,0.2)" }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              <span className="text-red-400 uppercase tracking-widest font-bold" style={{ fontSize: 9 }}>
                Threat Active
              </span>
            </div>
            <p className="text-red-300/80 leading-relaxed" style={{ fontSize: 10 }}>
              Anomalous outbound traffic detected. UDP flood pattern identified. Firewall mitigation engaged.
            </p>
          </div>
        )}

        {isWarning && (
          <div
            className="rounded-lg p-3 border"
            style={{ background: "rgba(245,158,11,0.05)", borderColor: "rgba(245,158,11,0.2)" }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-amber-400 uppercase tracking-widest font-bold" style={{ fontSize: 9 }}>
                Warning
              </span>
            </div>
            <p className="text-amber-300/80 leading-relaxed" style={{ fontSize: 10 }}>
              Connection pool approaching capacity. Monitor for potential slowdown or dropped connections.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
