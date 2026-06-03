import { useState, useEffect, useRef } from "react";
import { Play, Pause, RefreshCw, AlertTriangle, Activity, Settings } from "lucide-react";
import SimulatorLayout, { FooterControl } from "../../components/SimulatorLayout";

const TOTAL_SEGMENTS = 32;

type Flight = {
  id: string;
  type: "data" | "ack";
  seq: number;
  ack: number;
  progress: number;
  isLost: boolean;
  dropAt: number;
  lane: number;
};

export default function TCPSlidingWindow() {
  const [running, setRunning] = useState(false);
  const [rttConfig, setRttConfig] = useState(2000);
  const [manualCwnd, setManualCwnd] = useState(4);
  const [autoCC, setAutoCC] = useState(false);
  const [, forceRender] = useState(0);

  const state = useRef({
    sndBase: 0,
    nxtSeq: 0,
    cwnd: 4,
    ssthresh: 16,
    dupAcks: 0,
    rcvBase: 0,
    rcvBuffer: new Set<number>(),
    flights: [] as Flight[],
    explosions: [] as { id: string; x: number; y: number; opacity: number }[],
    rtoTimer: 0,
  });

  const reset = () => {
    setRunning(false);
    state.current = {
      sndBase: 0,
      nxtSeq: 0,
      cwnd: autoCC ? 1 : manualCwnd,
      ssthresh: 16,
      dupAcks: 0,
      rcvBase: 0,
      rcvBuffer: new Set<number>(),
      flights: [],
      explosions: [],
      rtoTimer: 0,
    };
    forceRender(v => v + 1);
  };

  useEffect(() => {
    const s = state.current;
    if (autoCC && !running && s.sndBase === 0 && s.nxtSeq === 0) {
       s.cwnd = 1;
       forceRender(v => v + 1);
    }
    if (!autoCC && !running) {
        s.cwnd = manualCwnd;
        forceRender(v => v + 1);
    }
  }, [autoCC, manualCwnd, running]);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      const s = state.current;
      if (s.sndBase >= TOTAL_SEGMENTS) {
        setRunning(false);
        return;
      }

      const speed = 50 / (rttConfig / 2); // one-way trip is RTT / 2
      const survivingFlights: Flight[] = [];
      const newAcksToSend: number[] = [];

      for (const f of s.flights) {
        f.progress += speed;
        // Handle Drop
        if (f.isLost && f.progress >= f.dropAt) {
          s.explosions.push({
            id: f.id,
            x: f.type === "data" ? f.dropAt : 1 - f.dropAt,
            y: f.lane,
            opacity: 1,
          });
          continue;
        }

        // Arrival
        if (f.progress >= 1) {
          if (f.type === "data") {
            // Receiver processing
            if (f.seq === s.rcvBase) {
              let nextRcv = s.rcvBase + 1;
              while (s.rcvBuffer.has(nextRcv)) {
                s.rcvBuffer.delete(nextRcv);
                nextRcv++;
              }
              s.rcvBase = nextRcv;
            } else if (f.seq > s.rcvBase) {
              s.rcvBuffer.add(f.seq);
            }
            newAcksToSend.push(s.rcvBase);
          } else {
            // Sender processing (ACK)
            if (f.ack > s.sndBase) {
              s.sndBase = f.ack;
              s.dupAcks = 0;
              s.rtoTimer = 0;
              if (autoCC) {
                if (s.cwnd < s.ssthresh) {
                  s.cwnd += 1; // Slow Start
                } else {
                  s.cwnd += 1 / Math.floor(s.cwnd); // Congestion Avoidance
                }
              }
            } else if (f.ack === s.sndBase) {
              s.dupAcks++;
              if (s.dupAcks === 3) {
                // Fast Retransmit
                survivingFlights.push({
                  id: `rt-${Date.now()}`,
                  type: "data",
                  seq: s.sndBase,
                  ack: 0,
                  progress: 0,
                  isLost: Math.random() < 0.1,
                  dropAt: 0.2 + Math.random() * 0.6,
                  lane: Math.random(),
                });
                if (autoCC) {
                  s.ssthresh = Math.max(2, Math.floor(s.cwnd / 2));
                  s.cwnd = 1;
                }
                s.dupAcks = 0;
                s.rtoTimer = 0;
              }
            }
          }
        } else {
          survivingFlights.push(f);
        }
      }

      // Spawn ACKs
      for (const ack of newAcksToSend) {
        survivingFlights.push({
          id: `ack-${Date.now()}-${Math.random()}`,
          type: "ack",
          seq: 0,
          ack: ack,
          progress: 0,
          isLost: Math.random() < 0.05,
          dropAt: 0.2 + Math.random() * 0.6,
          lane: Math.random(),
        });
      }

      s.flights = survivingFlights;
      s.explosions = s.explosions
        .map(e => ({ ...e, opacity: e.opacity - 0.05 }))
        .filter(e => e.opacity > 0);

      // RTO 
      const unacked = s.nxtSeq > s.sndBase;
      if (unacked) {
        s.rtoTimer += 50;
        if (s.rtoTimer >= rttConfig * 2) {
          s.rtoTimer = 0;
          // Time out Retransmit
          s.flights.push({
            id: `rto-${Date.now()}`,
            type: "data",
            seq: s.sndBase,
            ack: 0,
            progress: 0,
            isLost: Math.random() < 0.1,
            dropAt: 0.2 + Math.random() * 0.6,
            lane: Math.random(),
          });
          if (autoCC) {
            s.ssthresh = Math.max(2, Math.floor(s.cwnd / 2));
            s.cwnd = 1;
          }
          s.nxtSeq = s.sndBase + 1; // Pull nxtSeq back so we don't send ahead of the dropped one while congestion collapsed
        }
      } else {
        s.rtoTimer = 0;
      }

      // Send New Data
      if (!autoCC) s.cwnd = manualCwnd;
      const winSize = Math.floor(s.cwnd);

      while (s.nxtSeq < s.sndBase + winSize && s.nxtSeq < TOTAL_SEGMENTS) {
        s.flights.push({
          id: `data-${Date.now()}-${Math.random()}`,
          type: "data",
          seq: s.nxtSeq,
          ack: 0,
          progress: 0,
          isLost: Math.random() < 0.12, // 12% link loss rate
          dropAt: 0.15 + Math.random() * 0.7,
          lane: Math.random(),
        });
        s.nxtSeq++;
      }

      forceRender(v => v + 1);
    }, 50);

    return () => clearInterval(interval);
  }, [running, rttConfig, autoCC, manualCwnd]);

  const s = state.current;
  const allDone = s.sndBase >= TOTAL_SEGMENTS;

  const footerControls: FooterControl[] = [
    {
      key: "win", type: "slider",
      label: "Fixed Window Size",
      min: 1, max: 20, step: 1,
      value: manualCwnd,
      disabled: autoCC,
      onChange: (v) => setManualCwnd(v as number),
    },
    {
      key: "rtt", type: "slider",
      label: "Network Delay (ms)",
      min: 200, max: 4000, step: 200,
      value: rttConfig,
      onChange: (v) => setRttConfig(v as number),
    },
    { key: "sp1", type: "spacer" },
    {
      key: "cc", type: "button",
      label: autoCC ? "Auto CC" : "Static Window",
      variant: autoCC ? "teal" : "secondary",
      icon: <Activity size={12} />,
      onClick: () => setAutoCC(!autoCC),
    },
    {
      key: "play", type: "button",
      label: running ? "Pause" : "Start",
      variant: running ? "secondary" : "cyan",
      icon: running ? <Pause size={12} /> : <Play size={12} />,
      disabled: allDone,
      onClick: () => setRunning(!running),
    },
    { key: "sp2", type: "spacer" },
    { key: "reset", type: "button", label: "Reset", variant: "danger", icon: <RefreshCw size={12} />, onClick: reset },
  ];

  return (
    <SimulatorLayout
      title="TCP Sliding Window"
      subtitle="Advanced Flow Control & Congestion Dynamics"
      layerBadge="L4"
      layerColor="#06b6d4"
      footerControls={footerControls}
    >
      <div className="h-full flex flex-col p-4 overflow-hidden select-none">
        
        {/* Status Dashboard */}
        <div className="grid grid-cols-4 gap-3 shrink-0 mb-4">
          {[
            { label: "Congestion Window (CWND)", value: String(Math.floor(s.cwnd)), color: "#06b6d4" },
            { label: "Sender Base (SND.UNA)", value: `SEQ ${s.sndBase}`, color: "#8b5cf6" },
            { label: "Receiver Next (RCV.NXT)", value: `SEQ ${s.rcvBase}`, color: "#14b8a6" },
            { label: "SS Thresh", value: autoCC ? String(s.ssthresh) : "N/A", color: "#f59e0b" },
          ].map(item => (
            <div key={item.label} className="glass-panel rounded-xl border border-white/5 p-3 shadow-lg bg-[#141b24]">
              <div className="text-slate-500 uppercase tracking-widest mb-1" style={{ fontSize: 9 }}>{item.label}</div>
              <div className="font-mono font-bold text-base" style={{ color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-col flex-1 gap-2 border border-white/5 rounded-xl bg-[#0c1219] p-4 relative shadow-[inset_0_0_30px_rgba(0,0,0,0.4)]">
          
          {/* Sender Buffer */}
          <div className="shrink-0 flex flex-col gap-2">
            <div className="flex items-center gap-3 w-full">
              <span className="text-xs uppercase tracking-widest text-[#06b6d4] font-bold w-16">Sender</span>
              <div className="flex flex-wrap gap-1.5 flex-1 relative">
                {Array.from({ length: TOTAL_SEGMENTS }).map((_, i) => {
                  const isAcked = i < s.sndBase;
                  const isFlight = i >= s.sndBase && i < s.nxtSeq;
                  const inWin = i >= s.sndBase && i < s.sndBase + Math.floor(s.cwnd);

                  let bg = "#141b24", border = "#1e2d3d", color = "#475569";
                  if (isAcked) { bg = "#14b8a620"; border = "#14b8a650"; color = "#14b8a6"; }
                  else if (isFlight) { bg = "#06b6d430"; border = "#06b6d4"; color = "#06b6d4"; }

                  return (
                    <div key={i} className="relative flex flex-col items-center" style={{ width: 28 }}>
                      {inWin && !isAcked && (
                        <div className="absolute -top-1 w-full h-[3px] rounded bg-cyan-400 shadow-[0_0_5px_#06b6d4]" />
                      )}
                      <div className="w-full text-center border rounded py-1 font-mono text-[10px] font-bold" style={{ background: bg, borderColor: border, color }}>
                        {i}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Airspace Transition Zone */}
          <div className="flex-1 relative border-y border-dashed border-white/10 my-2 mx-8 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] overflow-hidden">
             <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20 pointer-events-none">
                 <span className="text-xl uppercase tracking-widest font-bold">The Airspace</span>
                 <span className="text-sm">RTT: {rttConfig}ms</span>
             </div>

             {/* Packets */}
             {s.flights.map(f => {
               const left = f.type === "data" ? `${f.progress * 100}%` : `${(1 - f.progress) * 100}%`;
               const yOffset = f.lane * 80 - 40;
               const isData = f.type === "data";
               
               let classes = isData 
                 ? "bg-[#06b6d4]/20 border-[#06b6d4] text-[#06b6d4] shadow-[0_0_10px_rgba(6,182,212,0.5)] flex-col" 
                 : "bg-[#14b8a6]/20 border-[#14b8a6] text-[#14b8a6] shadow-[0_0_10px_rgba(20,184,166,0.5)] rounded-full";

               return (
                 <div
                   key={f.id}
                   className={`absolute flex items-center justify-center border text-[9px] font-bold font-mono z-10 whitespace-nowrap ${classes}`}
                   style={{
                     left,
                     top: `calc(50% + ${yOffset}px)`,
                     transform: `translate(${isData ? '-50%' : '50%'}, -50%)`,
                     width: isData ? 36 : 48,
                     height: isData ? 24 : 20,
                     transition: "none"
                   }}
                 >
                   {isData ? `[${f.seq}]` : `ACK ${f.ack}`}
                 </div>
               );
             })}

             {/* Drops */}
             {s.explosions.map((e, idx) => (
                <div
                  key={`${e.id}-${idx}`}
                  className="absolute w-12 h-12 flex items-center justify-center text-red-500 font-bold z-20"
                  style={{
                    left: `${e.x * 100}%`,
                    top: `calc(50% + ${e.y * 80 - 40}px)`,
                    transform: 'translate(-50%, -50%) scale(1.5)',
                    opacity: e.opacity
                  }}
                >
                  <AlertTriangle size={24} className="drop-shadow-[0_0_15px_rgba(239,68,68,1)]" />
                </div>
             ))}
          </div>

          {/* Receiver Buffer */}
          <div className="shrink-0 flex flex-col gap-2">
            <div className="flex items-center gap-3 w-full">
              <span className="text-xs uppercase tracking-widest text-[#14b8a6] font-bold w-16">Receiver</span>
              <div className="flex flex-wrap gap-1.5 flex-1 relative">
                {Array.from({ length: TOTAL_SEGMENTS }).map((_, i) => {
                  const isDelivered = i < s.rcvBase;
                  const isOOO = s.rcvBuffer.has(i);

                  let bg = "#141b24", border = "#1e2d3d", color = "#475569";
                  if (isDelivered) { bg = "#14b8a620"; border = "#14b8a650"; color = "#14b8a6"; }
                  else if (isOOO) { bg = "#f59e0b20"; border = "#f59e0b50"; color = "#f59e0b"; }

                  return (
                    <div key={i} className="flex flex-col items-center" style={{ width: 28 }}>
                      <div className="w-full text-center border rounded py-1 font-mono text-[10px] font-bold" style={{ background: bg, borderColor: border, color }}>
                        {i}
                      </div>
                      <div className="text-[7px] uppercase mt-0.5" style={{ color }}>
                        {isDelivered ? 'RCVD' : isOOO ? 'OOO' : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Context Legend */}
            <div className="flex justify-center gap-8 mt-2 text-[10px] uppercase tracking-widest font-bold">
              <span className="text-[#06b6d4]">In-Flight</span>
              <span className="text-[#f59e0b]">Out-of-Order (Buffered)</span>
              <span className="text-[#14b8a6]">Acknowledged / Delivered</span>
              <span className="text-[#ef4444]">Dropped Packet</span>
            </div>

          </div>
        </div>

      </div>
    </SimulatorLayout>
  );
}
