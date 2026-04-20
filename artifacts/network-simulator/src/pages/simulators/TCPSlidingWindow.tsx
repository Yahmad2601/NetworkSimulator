import { useState, useEffect } from "react";
import { Play, RefreshCw, AlertTriangle } from "lucide-react";
import SimulatorLayout, { FooterControl } from "../../components/SimulatorLayout";

interface Segment { id: number; status: "unsent" | "inflight" | "acked" | "lost"; }

const TOTAL_SEGMENTS = 20;

export default function TCPSlidingWindow() {
  const [windowSize, setWindowSize] = useState(4);
  const [running, setRunning] = useState(false);
  const [segments, setSegments] = useState<Segment[]>(() =>
    Array.from({ length: TOTAL_SEGMENTS }, (_, i) => ({ id: i, status: "unsent" }))
  );
  const [sndBase, setSndBase] = useState(0);
  const [throughput, setThroughput] = useState(0);
  const [lostCount, setLostCount] = useState(0);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setSegments(prev => {
        const next = [...prev];
        // Mark window segments as inflight
        for (let i = sndBase; i < Math.min(sndBase + windowSize, TOTAL_SEGMENTS); i++) {
          if (next[i].status === "unsent") next[i] = { ...next[i], status: "inflight" };
        }
        // Ack the first inflight
        const firstInflight = next.findIndex(s => s.status === "inflight");
        if (firstInflight !== -1) {
          const lost = Math.random() < 0.12;
          if (lost) {
            next[firstInflight] = { ...next[firstInflight], status: "lost" };
            setLostCount(l => l + 1);
          } else {
            next[firstInflight] = { ...next[firstInflight], status: "acked" };
            setThroughput(t => t + 1);
          }
        }
        return next;
      });
      setSndBase(b => {
        // Advance past consecutive acks
        let newBase = b;
        while (newBase < TOTAL_SEGMENTS && segments[newBase]?.status === "acked") newBase++;
        return newBase;
      });
    }, 600);
    return () => clearInterval(interval);
  }, [running, windowSize, sndBase, segments]);

  useEffect(() => {
    setSndBase(prev => {
      let b = prev;
      while (b < TOTAL_SEGMENTS && segments[b]?.status === "acked") b++;
      return b;
    });
  }, [segments]);

  const reset = () => {
    setRunning(false);
    setSegments(Array.from({ length: TOTAL_SEGMENTS }, (_, i) => ({ id: i, status: "unsent" })));
    setSndBase(0);
    setThroughput(0);
    setLostCount(0);
  };

  const retransmit = () => {
    setSegments(prev => prev.map(s => s.status === "lost" ? { ...s, status: "inflight" } : s));
  };

  const allDone = segments.every(s => s.status === "acked");

  const footerControls: FooterControl[] = [
    {
      key: "window", type: "slider",
      label: "Window Size",
      min: 1, max: 10, step: 1,
      value: windowSize,
      onChange: v => setWindowSize(v as number),
    },
    {
      key: "play", type: "button",
      label: running ? "Pause" : "Start",
      variant: running ? "secondary" : "teal",
      icon: <Play size={12} />,
      disabled: allDone,
      onClick: () => setRunning(r => !r),
    },
    {
      key: "retrans", type: "button",
      label: "Retransmit Lost",
      variant: "warning",
      icon: <AlertTriangle size={12} />,
      disabled: !segments.some(s => s.status === "lost"),
      onClick: retransmit,
    },
    { key: "sp", type: "spacer" },
    { key: "ack-stat", type: "stat", stat: { label: "ACKed", value: String(throughput), color: "#14b8a6" } },
    { key: "lost-stat", type: "stat", stat: { label: "Lost", value: String(lostCount), color: lostCount > 0 ? "#ef4444" : "#475569" } },
    { key: "reset", type: "button", label: "Reset", variant: "danger", icon: <RefreshCw size={12} />, onClick: reset },
  ];

  const segColor = (s: Segment) => {
    if (s.status === "acked") return { bg: "#14b8a620", border: "#14b8a6", text: "#14b8a6" };
    if (s.status === "inflight") return { bg: "#06b6d420", border: "#06b6d4", text: "#06b6d4" };
    if (s.status === "lost") return { bg: "#ef444420", border: "#ef4444", text: "#ef4444" };
    return { bg: "#0a0e14", border: "#1e2d3d", text: "#475569" };
  };

  const inWindow = (i: number) => i >= sndBase && i < sndBase + windowSize && segments[i].status !== "acked";

  return (
    <SimulatorLayout
      title="TCP Sliding Window"
      subtitle="Layer 4 · Flow Control Visualizer"
      layerBadge="L4"
      layerColor="#06b6d4"
      footerControls={footerControls}
    >
      <div className="h-full flex flex-col gap-4 p-4 overflow-hidden">
        {/* Info row */}
        <div className="grid grid-cols-4 gap-3 shrink-0">
          {[
            { label: "Window Size", value: `${windowSize} segments`, color: "#06b6d4" },
            { label: "Base Pointer", value: `SEG ${sndBase}`, color: "#8b5cf6" },
            { label: "Throughput", value: `${throughput} / ${TOTAL_SEGMENTS}`, color: "#14b8a6" },
            { label: "Buffer Load", value: `${Math.round((windowSize / 10) * 100)}%`, color: windowSize > 7 ? "#ef4444" : windowSize > 5 ? "#f59e0b" : "#14b8a6" },
          ].map(item => (
            <div key={item.label} className="glass-panel rounded-xl border border-white/5 p-3">
              <div className="text-slate-600 uppercase tracking-widest mb-1" style={{ fontSize: 8 }}>{item.label}</div>
              <div className="font-mono font-bold text-sm" style={{ color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Segment visualization */}
        <div className="flex-1 glass-panel rounded-xl border border-white/5 p-5 flex flex-col">
          <div className="text-slate-400 uppercase tracking-widest font-bold mb-4" style={{ fontSize: 9 }}>
            Data Stream — {TOTAL_SEGMENTS} Segments
          </div>

          {/* Sender */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-slate-500 uppercase tracking-widest" style={{ fontSize: 9 }}>Sender</span>
              <div className="flex-1 h-px bg-white/5" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {segments.map((s, i) => {
                const c = segColor(s);
                const inW = inWindow(i);
                return (
                  <div key={s.id}
                    className="relative flex flex-col items-center"
                    style={{ width: 36 }}
                  >
                    {inW && (
                      <div className="absolute -top-1 left-0 right-0 h-0.5 bg-cyan-400 rounded" />
                    )}
                    <div
                      className="w-full rounded font-mono text-center py-1 border transition-all duration-300 text-xs font-bold"
                      style={{ background: c.bg, borderColor: c.border, color: c.text }}
                    >
                      {i}
                    </div>
                    <div className="text-slate-700 mt-0.5" style={{ fontSize: 7, textTransform: "uppercase" }}>
                      {s.status.slice(0, 3)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Window indicator */}
            <div className="mt-2 flex items-center gap-2">
              <div className="h-0.5 bg-cyan-400 rounded" style={{ width: `${(windowSize / TOTAL_SEGMENTS) * 100}%`, maxWidth: "calc(100% - 80px)" }} />
              <span className="text-cyan-400 text-xs font-mono">← Window ({windowSize})</span>
            </div>
          </div>

          {/* Legend + receive buffer */}
          <div className="flex gap-6">
            <div className="flex items-center gap-4">
              {[
                { color: "#475569", label: "Unsent" },
                { color: "#06b6d4", label: "In-Flight" },
                { color: "#14b8a6", label: "ACKed" },
                { color: "#ef4444", label: "Lost" },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded border" style={{ background: item.color + "25", borderColor: item.color }} />
                  <span className="text-slate-500 text-xs">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Receiver buffer */}
          <div className="mt-4 flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-slate-500 uppercase tracking-widest" style={{ fontSize: 9 }}>Receiver Buffer</span>
              <div className="flex-1 h-px bg-white/5" />
              <span className="text-slate-600 font-mono" style={{ fontSize: 9 }}>{windowSize * 1460} B capacity</span>
            </div>
            <div className="h-8 rounded-lg border border-white/8 overflow-hidden relative bg-[#0a0e14]">
              <div
                className="h-full transition-all duration-500 rounded-lg"
                style={{
                  width: `${(windowSize / 10) * 100}%`,
                  background: windowSize > 7
                    ? "linear-gradient(90deg, #14b8a6, #ef4444)"
                    : "linear-gradient(90deg, #14b8a6, #06b6d4)",
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white font-mono text-xs font-bold">
                  {Math.round((windowSize / 10) * 100)}% utilized
                </span>
              </div>
            </div>
            {windowSize > 7 && (
              <div className="mt-1 flex items-center gap-1.5 text-amber-400">
                <AlertTriangle size={10} />
                <span style={{ fontSize: 9 }}>Large window: high throughput but risks buffer overflow</span>
              </div>
            )}
          </div>
        </div>

        {allDone && (
          <div className="glass-panel rounded-xl border border-teal-500/30 bg-teal-500/5 p-3 flex items-center gap-3 shrink-0">
            <div className="w-2 h-2 rounded-full bg-teal-400" />
            <span className="text-teal-400 font-bold text-sm">Transfer complete! All {TOTAL_SEGMENTS} segments acknowledged.</span>
          </div>
        )}
      </div>
    </SimulatorLayout>
  );
}
