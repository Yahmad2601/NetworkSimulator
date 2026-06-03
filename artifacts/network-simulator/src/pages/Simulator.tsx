import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import {
  Activity,
  ArrowLeft,
  Clock,
  Cpu,
  Wifi,
  ZapOff,
} from "lucide-react";
import NetworkCanvas from "../components/NetworkCanvas";
import LiveLogs from "../components/LiveLogs";
import ControlFooter from "../components/ControlFooter";
import NodeDetailsPanel from "../components/NodeDetailsPanel";
import {
  NODES,
  EDGES,
  INITIAL_LOGS,
  LIVE_LOG_POOL,
  type NetworkNode,
  type LogEntry,
} from "../data/mockData";

let logCounter = 100;
function makeId() {
  return `log-${++logCounter}`;
}

function getTimestamp() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
}

export default function Simulator() {
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<"simulation" | "live">("simulation");
  const [scanning, setScanning] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [nodes, setNodes] = useState<NetworkNode[]>(NODES);
  const [uptime] = useState("14d 07:22:41");
  const [latency, setLatency] = useState(1.2);

  const selectedNode = nodes.find(n => n.id === selectedNodeId) ?? null;
  const threatsCount = nodes.filter(n => n.status === "threat").length;

  const addLog = useCallback(() => {
    const template = LIVE_LOG_POOL[Math.floor(Math.random() * LIVE_LOG_POOL.length)];
    const newLog: LogEntry = {
      id: makeId(),
      timestamp: getTimestamp(),
      ...template,
    };
    setLogs(prev => {
      const next = [...prev, newLog];
      return next.length > 80 ? next.slice(-80) : next;
    });
  }, []);

  // Periodic live log generation
  useEffect(() => {
    const interval = setInterval(addLog, scanning ? 600 : 1800);
    return () => clearInterval(interval);
  }, [addLog, scanning]);

  // Jitter latency
  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(+(Math.random() * 3 + 0.8).toFixed(1));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleRunDiscovery = () => {
    setScanning(true);
    // Burst log entries
    for (let i = 0; i < 5; i++) {
      setTimeout(() => addLog(), i * 120);
    }
    setTimeout(() => {
      setScanning(false);
      setLogs(prev => [
        ...prev,
        {
          id: makeId(),
          timestamp: getTimestamp(),
          event: `Network Discovery Complete — ${nodes.length} nodes mapped, ${threatsCount} threat(s) flagged`,
          type: threatsCount > 0 ? "warning" : "success",
        },
      ]);
    }, 5000);
  };

  const handleReset = () => {
    setNodes(NODES);
    setLogs(INITIAL_LOGS);
    setSelectedNodeId(null);
    setScanning(false);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "#0a0e14" }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-5 py-3 border-b border-white/5 shrink-0"
        style={{ background: "rgba(13,21,32,0.95)", backdropFilter: "blur(12px)" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors group mr-1"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-xs uppercase tracking-widest" style={{ fontSize: 9 }}>Menu</span>
          </button>
          <div className="w-px h-5 bg-white/8" />
          <img src="/logo.png" alt="Globaltech" className="h-8 w-auto" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-white font-bold tracking-tight text-sm leading-none" style={{
                textShadow: `0 0 20px #06b6d450`,
              }}>
                Cybersecurity Network Simulator
              </h1>
            </div>
            <p className="text-slate-500 uppercase tracking-widest mt-0.5" style={{ fontSize: 9 }}>
              Command Center
            </p>
          </div>
        </div>

        {/* Status capsule */}
        <div
          className="flex items-center gap-0 rounded-full border border-white/8 overflow-hidden"
          style={{ background: "#0c1219" }}
        >
          {/* Live indicator */}
          <div className="flex items-center gap-2 px-3 py-2 border-r border-white/8">
            <div className="relative flex">
              <span className="w-2 h-2 rounded-full bg-teal-400" />
              <span className="status-ping absolute inline-flex w-2 h-2 rounded-full bg-teal-400 opacity-75" />
            </div>
            <span className="text-teal-400 uppercase tracking-widest font-bold" style={{ fontSize: 9 }}>
              Network Live
            </span>
          </div>

          {/* Uptime */}
          <div className="flex items-center gap-1.5 px-3 py-2 border-r border-white/8">
            <Clock size={11} className="text-slate-500" />
            <span className="text-slate-500 uppercase tracking-widest" style={{ fontSize: 9 }}>Uptime</span>
            <span className="font-mono text-slate-300 font-bold" style={{ fontSize: 10 }}>{uptime}</span>
          </div>

          {/* Latency */}
          <div className="flex items-center gap-1.5 px-3 py-2 border-r border-white/8">
            <Activity size={11} className="text-slate-500" />
            <span className="text-slate-500 uppercase tracking-widest" style={{ fontSize: 9 }}>Latency</span>
            <span
              className="font-mono font-bold"
              style={{
                fontSize: 10,
                color: latency > 3 ? "#ef4444" : latency > 2 ? "#f59e0b" : "#14b8a6",
              }}
            >
              {latency}ms
            </span>
          </div>

          {/* Mode indicator */}
          <div className="flex items-center gap-1.5 px-3 py-2">
            {mode === "live" ? (
              <Wifi size={11} className="text-cyan-400" />
            ) : (
              <Cpu size={11} className="text-purple-400" />
            )}
            <span
              className="uppercase tracking-widest font-bold"
              style={{
                fontSize: 9,
                color: mode === "live" ? "#06b6d4" : "#a855f7",
              }}
            >
              {mode === "live" ? "Live" : "Sim"}
            </span>
          </div>
        </div>
      </header>

      {/* Main body */}
      <main className="flex flex-1 overflow-hidden">
        {/* Canvas area */}
        <div className="flex-1 p-4 relative min-w-0">
          {/* Scanning badge */}
          {scanning && (
            <div
              className="absolute top-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/30 glass-panel"
            >
              <ZapOff size={12} className="text-cyan-400 animate-pulse" />
              <span className="text-cyan-400 uppercase tracking-widest font-bold" style={{ fontSize: 10 }}>
                Network Discovery Running...
              </span>
            </div>
          )}

          <NodeDetailsPanel node={selectedNode} onClose={() => setSelectedNodeId(null)} />

          <NetworkCanvas
            nodes={nodes}
            edges={EDGES}
            selectedNode={selectedNodeId}
            onSelectNode={setSelectedNodeId}
            scanning={scanning}
          />
        </div>

        {/* Sidebar */}
        <aside
          className="w-80 shrink-0 border-l border-white/5 flex flex-col overflow-hidden"
          style={{ background: "#0d1520" }}
        >
          <LiveLogs logs={logs} />
        </aside>
      </main>

      {/* Footer */}
      <ControlFooter
        mode={mode}
        onModeChange={setMode}
        scanning={scanning}
        onRunDiscovery={handleRunDiscovery}
        onReset={handleReset}
        nodesCount={nodes.length}
        threatsCount={threatsCount}
      />
    </div>
  );
}
