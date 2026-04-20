import { useState, useEffect, useRef } from "react";
import { Play, Zap, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";
import SimulatorLayout, { FooterControl } from "../../components/SimulatorLayout";

type TransferState = "idle" | "transferring" | "dropped" | "resuming" | "complete";

interface TransferSide {
  progress: number;
  lastCheckpoint: number;
  state: TransferState;
  bytesTransferred: number;
}

const FILE_SIZE = 500; // MB
const CHECKPOINT_INTERVAL = 100; // MB

export default function Layer5Session() {
  const [withSession, setWithSession] = useState<TransferSide>({
    progress: 0, lastCheckpoint: 0, state: "idle", bytesTransferred: 0,
  });
  const [withoutSession, setWithoutSession] = useState<TransferSide>({
    progress: 0, lastCheckpoint: 0, state: "idle", bytesTransferred: 0,
  });
  const [running, setRunning] = useState(false);
  const [dropEvent, setDropEvent] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  useEffect(() => {
    if (!running) return;

    intervalRef.current = setInterval(() => {
      setWithSession(prev => {
        if (prev.state === "complete" || prev.state === "dropped") return prev;
        const newProg = prev.progress + 1;
        const newBytes = prev.bytesTransferred + 1;
        const checkpoint = Math.floor(newProg / CHECKPOINT_INTERVAL) * CHECKPOINT_INTERVAL;
        if (newProg >= FILE_SIZE) return { ...prev, progress: FILE_SIZE, state: "complete", bytesTransferred: newBytes, lastCheckpoint: FILE_SIZE };
        return { ...prev, progress: newProg, bytesTransferred: newBytes, lastCheckpoint: checkpoint };
      });

      setWithoutSession(prev => {
        if (prev.state === "complete" || prev.state === "dropped") return prev;
        const newProg = prev.progress + 1;
        if (newProg >= FILE_SIZE) return { ...prev, progress: FILE_SIZE, state: "complete", bytesTransferred: prev.bytesTransferred + 1 };
        return { ...prev, progress: newProg, bytesTransferred: prev.bytesTransferred + 1 };
      });
    }, 60);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const simulateDrop = () => {
    setDropEvent(true);
    setWithSession(prev => {
      if (prev.state !== "transferring" && prev.state !== "idle" && prev.progress < FILE_SIZE) {
        return { ...prev, state: "dropped" };
      }
      return prev.state === "complete" ? prev : { ...prev, state: "dropped" };
    });
    setWithoutSession(prev => {
      return prev.state === "complete" ? prev : { ...prev, state: "dropped" };
    });

    setTimeout(() => {
      setWithSession(prev => ({
        ...prev,
        state: "resuming",
        progress: prev.lastCheckpoint,
        bytesTransferred: prev.lastCheckpoint,
      }));
      setWithoutSession(prev => ({
        ...prev,
        state: "resuming",
        progress: 0,
        bytesTransferred: 0,
        lastCheckpoint: 0,
      }));
      setDropEvent(false);
      setRunning(true);
    }, 1800);
    setRunning(false);
  };

  const reset = () => {
    setRunning(false);
    setWithSession({ progress: 0, lastCheckpoint: 0, state: "idle", bytesTransferred: 0 });
    setWithoutSession({ progress: 0, lastCheckpoint: 0, state: "idle", bytesTransferred: 0 });
    setDropEvent(false);
  };

  const footerControls: FooterControl[] = [
    {
      key: "start", type: "button",
      label: running ? "Pause" : (withSession.state === "idle" ? "Start Download" : "Resume"),
      variant: running ? "secondary" : "teal",
      icon: <Play size={12} />,
      disabled: withSession.state === "complete" && withoutSession.state === "complete",
      onClick: () => setRunning(r => !r),
    },
    {
      key: "drop", type: "button",
      label: "Simulate Network Drop",
      variant: "danger",
      icon: <Zap size={12} />,
      disabled: !running || dropEvent,
      onClick: simulateDrop,
    },
    { key: "sp", type: "spacer" },
    {
      key: "with", type: "stat",
      stat: {
        label: "With L5",
        value: withSession.state === "dropped" ? "DROPPED" : `${withSession.progress}MB`,
        color: withSession.state === "complete" ? "#14b8a6" : withSession.state === "dropped" ? "#ef4444" : "#ec4899",
      },
    },
    {
      key: "without", type: "stat",
      stat: {
        label: "Without L5",
        value: withoutSession.state === "dropped" ? "RESTART" : `${withoutSession.progress}MB`,
        color: withoutSession.state === "complete" ? "#14b8a6" : withoutSession.state === "dropped" ? "#ef4444" : "#475569",
      },
    },
    { key: "reset", type: "button", label: "Reset", variant: "danger", icon: <RefreshCw size={12} />, onClick: reset },
  ];

  const renderTransfer = (side: TransferSide, label: string, color: string, showCheckpoints: boolean) => {
    const pct = (side.progress / FILE_SIZE) * 100;
    const checkpoints = showCheckpoints
      ? Array.from({ length: Math.floor(FILE_SIZE / CHECKPOINT_INTERVAL) }, (_, i) => (i + 1) * CHECKPOINT_INTERVAL)
      : [];
    const savedAt = showCheckpoints ? side.lastCheckpoint : 0;

    return (
      <div className="flex-1 glass-panel rounded-xl border border-white/5 p-5 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
            <span className="text-white font-bold text-sm">{label}</span>
          </div>
          {showCheckpoints && (
            <span className="px-2 py-0.5 rounded-full border text-xs font-bold uppercase tracking-widest"
              style={{ fontSize: 8, color, borderColor: color + "40", background: color + "10" }}>
              Session Layer Active
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="relative mb-4">
          <div className="h-8 rounded-lg border border-white/8 bg-[#0a0e14] overflow-hidden relative">
            <div
              className="h-full transition-all duration-300 rounded-lg"
              style={{
                width: `${pct}%`,
                background: side.state === "dropped"
                  ? "linear-gradient(90deg, #ef4444, #991b1b)"
                  : `linear-gradient(90deg, ${color}, ${color}99)`,
              }}
            />
            {/* Checkpoints */}
            {checkpoints.map(cp => (
              <div key={cp}
                className="absolute top-0 bottom-0 w-0.5"
                style={{
                  left: `${(cp / FILE_SIZE) * 100}%`,
                  background: cp <= savedAt ? "#14b8a6" : "#1e2d3d",
                }}
              />
            ))}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white font-mono font-bold text-xs">
                {side.state === "dropped" ? "DROPPED" : side.state === "complete" ? "COMPLETE ✓" : `${side.progress} MB / ${FILE_SIZE} MB`}
              </span>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className={`rounded-lg p-3 border flex items-center gap-2 mb-3 ${
          side.state === "complete" ? "border-teal-500/25 bg-teal-500/5" :
          side.state === "dropped" ? "border-red-500/25 bg-red-500/5" :
          "border-white/5 bg-[#0a0e14]"
        }`}>
          {side.state === "complete" ? <CheckCircle size={14} className="text-teal-400" /> :
           side.state === "dropped" ? <AlertTriangle size={14} className="text-red-400" /> :
           <div className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: color, borderTopColor: "transparent" }} />}
          <div>
            <div className="font-bold text-xs" style={{
              color: side.state === "complete" ? "#14b8a6" : side.state === "dropped" ? "#ef4444" : color
            }}>
              {side.state === "idle" && "Ready"}
              {side.state === "transferring" && "Downloading..."}
              {side.state === "resuming" && (showCheckpoints ? `Resuming from ${savedAt}MB checkpoint...` : "Restarting from 0MB...")}
              {side.state === "dropped" && (showCheckpoints ? `Saved to checkpoint at ${savedAt}MB` : "Transfer lost — restart required")}
              {side.state === "complete" && "Download complete!"}
            </div>
            {showCheckpoints && savedAt > 0 && side.state !== "complete" && (
              <div className="text-slate-500 text-xs mt-0.5">
                Last checkpoint: {savedAt}MB — {FILE_SIZE - savedAt}MB remaining
              </div>
            )}
          </div>
        </div>

        {/* Checkpoints legend */}
        {showCheckpoints && (
          <div>
            <div className="text-slate-600 uppercase tracking-widest mb-1" style={{ fontSize: 8 }}>Checkpoints</div>
            <div className="flex gap-1 flex-wrap">
              {checkpoints.map(cp => (
                <span key={cp}
                  className="px-2 py-0.5 rounded font-mono border"
                  style={{
                    fontSize: 9,
                    background: cp <= savedAt ? "#14b8a620" : "#0a0e14",
                    borderColor: cp <= savedAt ? "#14b8a640" : "#1e2d3d",
                    color: cp <= savedAt ? "#14b8a6" : "#475569",
                  }}
                >
                  {cp}MB ✓
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <SimulatorLayout
      title="Layer 5 Session Checkpointing"
      subtitle="Session Layer · Network Resilience"
      layerBadge="L5"
      layerColor="#ec4899"
      footerControls={footerControls}
    >
      <div className="h-full flex flex-col gap-4 p-4 overflow-hidden">
        <div className="shrink-0 glass-panel rounded-xl border border-pink-500/15 bg-pink-500/3 px-4 py-3">
          <p className="text-slate-400 text-xs leading-relaxed">
            <span className="text-pink-400 font-bold">Scenario:</span> Downloading a {FILE_SIZE}MB file. Simulate a network drop and see how Layer 5 session checkpoints allow a resume vs. a full restart.
          </p>
        </div>

        <div className="flex-1 flex gap-4 overflow-hidden">
          {renderTransfer(withSession, "With Layer 5 (Session Checkpointing)", "#ec4899", true)}
          {renderTransfer(withoutSession, "Without Layer 5 (No Checkpoints)", "#475569", false)}
        </div>
      </div>
    </SimulatorLayout>
  );
}
