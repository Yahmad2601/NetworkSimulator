import { useEffect, useRef } from "react";
import { AlertTriangle, CheckCircle, Info, XCircle, BookOpen } from "lucide-react";
import type { LogEntry } from "../data/mockData";

interface Props {
  logs: LogEntry[];
}

function LogIcon({ type }: { type: LogEntry["type"] }) {
  switch (type) {
    case "success": return <CheckCircle size={11} className="text-teal-400 shrink-0 mt-0.5" />;
    case "warning": return <AlertTriangle size={11} className="text-amber-400 shrink-0 mt-0.5" />;
    case "error": return <XCircle size={11} className="text-red-400 shrink-0 mt-0.5" />;
    default: return <Info size={11} className="text-cyan-400/60 shrink-0 mt-0.5" />;
  }
}

function logTextColor(type: LogEntry["type"]) {
  switch (type) {
    case "success": return "text-teal-300/90";
    case "warning": return "text-amber-300/90";
    case "error": return "text-red-300/90";
    default: return "text-slate-400";
  }
}

export default function LiveLogs({ logs }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="relative flex">
            <span className="w-2 h-2 rounded-full bg-teal-400" />
            <span className="status-ping absolute inline-flex w-2 h-2 rounded-full bg-teal-400 opacity-75" />
          </div>
          <span className="text-slate-300 font-semibold tracking-wide text-xs uppercase">
            Live Traffic Log
          </span>
        </div>
        <span className="text-slate-600 font-mono" style={{ fontSize: 10 }}>
          {logs.length} events
        </span>
      </div>

      {/* Log entries */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto logs-scroll px-3 py-2 space-y-1"
      >
        {logs.map((log, index) => (
          <div
            key={log.id}
            className={`flex items-start gap-2 py-1.5 px-2 rounded-md hover:bg-white/3 transition-colors ${
              index === logs.length - 1 ? "log-entry-new" : ""
            }`}
          >
            <LogIcon type={log.type} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span
                  className="font-mono text-slate-600 shrink-0"
                  style={{ fontSize: 9 }}
                >
                  {log.timestamp}
                </span>
                {log.source && (
                  <span
                    className="font-mono text-cyan-500/50 truncate"
                    style={{ fontSize: 9 }}
                  >
                    {log.source}
                  </span>
                )}
              </div>
              <p
                className={`text-xs leading-tight ${logTextColor(log.type)}`}
                style={{ fontSize: 10.5 }}
              >
                {log.event}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* System Insight card */}
      <div className="mx-3 mb-3 mt-1 rounded-xl overflow-hidden" style={{
        background: "linear-gradient(135deg, #0891b2 0%, #0d9488 100%)",
      }}>
        <div className="p-3.5 relative">
          {/* Subtle grid overlay on card */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
              backgroundSize: "12px 12px",
            }}
          />
          <div className="relative">
            <div className="flex items-center gap-1.5 mb-2">
              <BookOpen size={12} className="text-white/80" />
              <span className="text-white/80 uppercase tracking-widest font-bold" style={{ fontSize: 9 }}>
                System Insight
              </span>
            </div>
            <p className="text-white/90 text-xs leading-relaxed">
              <span className="font-bold text-white">TCP 3-Way Handshake</span> — A SYN packet opens the connection, SYN-ACK confirms it, and a final ACK establishes the session. This ensures reliable, ordered delivery between any two network endpoints.
            </p>
            <div className="mt-2 pt-2 border-t border-white/20 flex items-center gap-1">
              <div className="w-1 h-1 rounded-full bg-white/60" />
              <span className="text-white/50 uppercase tracking-widest" style={{ fontSize: 8 }}>
                OSI Layer 4 · Transport
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
