import { Fragment, useEffect, useRef, useState } from "react";
import { Laptop, Router as RouterIcon, Globe, Clock, CheckCircle2, Ban, Play, RefreshCw } from "lucide-react";
import SimulatorLayout, { FooterControl } from "../../components/SimulatorLayout";
import {
  SOURCE,
  DEFAULT_PATH,
  probe,
  type TraceMode,
  type ResponseType,
} from "../../lib/traceroute";

const LAYER_COLOR = "#84cc16";
const PATH = DEFAULT_PATH;
const ROW = [SOURCE, ...PATH];
const ROW_COUNT = ROW.length;
const STEP_MS = 340;
const HOLD_MS = 1500;

interface ResultRow {
  ttl: number;
  ip: string | null;
  name: string;
  rtts: string[];
  type: ResponseType;
}

const MODE_LABELS = { "Windows (ICMP)": "icmp", "Linux/macOS (UDP)": "udp" } as const;
type ModeLabel = keyof typeof MODE_LABELS;

function randomRtts(): string[] {
  return Array.from({ length: 3 }, () => `${(Math.random() * 18 + 1).toFixed(0)} ms`);
}

export default function TracerouteSimulator() {
  const [modeLabel, setModeLabel] = useState<ModeLabel>("Windows (ICMP)");
  const mode: TraceMode = MODE_LABELS[modeLabel];

  const [ttl, setTtl] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [packetRow, setPacketRow] = useState(-1);
  const [ttlBadge, setTtlBadge] = useState(0);
  const [reply, setReply] = useState<{ hopIndex: number; type: ResponseType } | null>(null);
  const [results, setResults] = useState<ResultRow[]>([]);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  const complete = ttl >= PATH.length;

  const resetTrace = () => {
    clearTimers();
    setTtl(0);
    setAnimating(false);
    setPacketRow(-1);
    setReply(null);
    setResults([]);
  };

  const changeMode = (label: ModeLabel) => {
    if (label === modeLabel) return;
    setModeLabel(label);
    resetTrace();
  };

  const sendProbe = () => {
    if (animating || complete) return;
    const t = ttl + 1; // this probe's TTL → responding hop is path index t-1
    setAnimating(true);
    setReply(null);

    // Packet hops outward, one row per step, decrementing TTL at each router.
    for (let r = 1; r <= t; r++) {
      timers.current.push(
        setTimeout(() => {
          setPacketRow(r);
          const pathIdx = r - 1;
          const isDest = pathIdx === PATH.length - 1;
          setTtlBadge(isDest ? t - (r - 1) : t - r);
        }, (r - 1) * STEP_MS),
      );
    }

    // Responding hop answers, row appended to the table.
    timers.current.push(
      setTimeout(() => {
        const res = probe(PATH, t, mode);
        setReply({ hopIndex: res.hopIndex, type: res.responseType });
        const node = PATH[t - 1];
        setResults((prev) => [
          ...prev,
          {
            ttl: t,
            ip: res.ip,
            name: node.name,
            rtts: res.responseType === "no-response" ? ["*", "*", "*"] : randomRtts(),
            type: res.responseType,
          },
        ]);
      }, t * STEP_MS),
    );

    // Settle.
    timers.current.push(
      setTimeout(() => {
        setPacketRow(-1);
        setReply(null);
        setTtl(t);
        setAnimating(false);
      }, t * STEP_MS + HOLD_MS),
    );
  };

  const footerControls: FooterControl[] = [
    {
      key: "mode",
      type: "segmented",
      options: Object.keys(MODE_LABELS),
      value: modeLabel,
      onChange: (v) => changeMode(v as ModeLabel),
    },
    { key: "sp1", type: "spacer" },
    {
      key: "probe",
      type: "button",
      label: complete ? "Trace Complete" : `Send Probe · TTL=${ttl + 1}`,
      variant: "warning",
      icon: complete ? undefined : <Play size={12} />,
      onClick: sendProbe,
      disabled: animating || complete,
    },
    { key: "sp2", type: "spacer" },
    {
      key: "reset",
      type: "button",
      label: "Reset",
      variant: "secondary",
      icon: <RefreshCw size={12} />,
      onClick: resetTrace,
    },
  ];

  const sidebar = (
    <div className="flex flex-col h-full overflow-y-auto logs-scroll p-3 gap-3">
      <div className="glass-panel border border-white/10 bg-[#141b24] p-3 rounded-xl shrink-0">
        <div className="text-[10px] uppercase tracking-widest font-bold mb-2" style={{ color: LAYER_COLOR }}>
          How Traceroute Works
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          Each probe is sent with a Time-To-Live one larger than the last. Every router
          decrements the TTL; whichever router drops it at <span className="font-mono">TTL=0</span> reveals
          itself by returning an <span className="text-red-400 font-bold">ICMP Time Exceeded</span>. So
          probe #1 dies at hop 1, #2 at hop 2, and so on — mapping the whole path.
        </p>
      </div>

      <div className="glass-panel border border-white/10 bg-[#141b24] p-3 rounded-xl shrink-0">
        <div className="text-[10px] uppercase tracking-widest font-bold mb-2 text-slate-400">Responses</div>
        <div className="flex flex-col gap-1.5 text-[11px]">
          <Legend color="#ef4444" icon={<Clock size={11} />} text="Time Exceeded — an intermediate router" />
          <Legend color="#22c55e" icon={<CheckCircle2 size={11} />} text="Echo Reply — destination (ICMP/Windows)" />
          <Legend color="#22c55e" icon={<CheckCircle2 size={11} />} text="Port Unreachable — destination (UDP/Linux)" />
          <Legend color="#64748b" icon={<Ban size={11} />} text="* — hop filtered, no reply" />
        </div>
      </div>

      <div className="glass-panel border border-white/10 bg-[#141b24] p-3 rounded-xl shrink-0">
        <div className="text-[10px] uppercase tracking-widest font-bold mb-1.5 text-slate-400">Windows vs. Linux</div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          Windows <span className="font-mono">tracert</span> sends ICMP Echo probes (destination replies with
          Echo Reply). Linux/macOS <span className="font-mono">traceroute</span> sends UDP probes to high ports,
          so the destination replies with <span className="font-mono">Port Unreachable (Type 3, Code 3)</span>.
          Either way, the intermediate hops still answer with Time Exceeded.
        </p>
      </div>
    </div>
  );

  return (
    <SimulatorLayout
      title="Traceroute & ICMP TTL"
      subtitle="Mapping the Path Hop by Hop"
      layerBadge="L3"
      layerColor={LAYER_COLOR}
      footerControls={footerControls}
      sidebar={sidebar}
    >
      <div className="h-full flex flex-col p-4 select-none overflow-hidden text-slate-400 bg-[#0a0e14]">
        {/* Status metrics */}
        <div className="grid grid-cols-3 gap-3 shrink-0 mb-3">
          {[
            { label: "TARGET", value: PATH[PATH.length - 1].ip, color: LAYER_COLOR },
            { label: "MODE", value: mode === "icmp" ? "ICMP (Windows)" : "UDP (Linux)", color: "#06b6d4" },
            {
              label: "PROGRESS",
              value: complete ? "Complete" : ttl === 0 ? "Ready" : `Hop ${ttl} / ${PATH.length}`,
              color: complete ? "#22c55e" : "#f59e0b",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="glass-panel border border-white/5 bg-[#141b24] p-3 rounded-xl shadow-lg flex flex-col items-center"
            >
              <div className="text-[10px] uppercase tracking-widest mb-1">{item.label}</div>
              <div className="font-mono font-bold text-base" style={{ color: item.color }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {/* Topology */}
        <div className="shrink-0 border border-white/5 rounded-xl bg-[#0c1219] shadow-[inset_0_0_30px_rgba(0,0,0,0.4)] px-6 pt-12 pb-5">
          <div className="flex items-start">
            {ROW.map((node, rowIndex) => {
              const pathIdx = rowIndex - 1; // -1 for the source
              const isSource = rowIndex === 0;
              const isDest = rowIndex === ROW_COUNT - 1;
              const hasPacket = packetRow === rowIndex;
              const replying = reply && reply.hopIndex === pathIdx;
              const replyColor =
                reply?.type === "time-exceeded"
                  ? "#ef4444"
                  : reply?.type === "no-response"
                    ? "#64748b"
                    : "#22c55e";
              const border = replying ? replyColor : isSource ? "#84cc16" : isDest ? "#06b6d4" : "#334155";

              return (
                <Fragment key={rowIndex}>
                  <div className="relative flex flex-col items-center w-16 shrink-0">
                    {/* Travelling packet */}
                    {hasPacket && (
                      <div
                        className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md border font-mono text-[10px] font-bold whitespace-nowrap z-20"
                        style={{ background: "#f59e0b20", borderColor: "#f59e0b", color: "#f59e0b" }}
                      >
                        TTL {Math.max(0, ttlBadge)}
                      </div>
                    )}
                    {/* Reply label */}
                    {replying && (
                      <div
                        className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md border font-mono text-[9px] font-bold whitespace-nowrap z-20 flex items-center gap-1"
                        style={{ background: `${replyColor}20`, borderColor: replyColor, color: replyColor }}
                      >
                        {reply?.type === "time-exceeded" && <Clock size={9} />}
                        {(reply?.type === "echo-reply" || reply?.type === "port-unreachable") && <CheckCircle2 size={9} />}
                        {reply?.type === "no-response" && <Ban size={9} />}
                        {reply?.type === "time-exceeded"
                          ? "Time Exceeded"
                          : reply?.type === "echo-reply"
                            ? "Echo Reply"
                            : reply?.type === "port-unreachable"
                              ? "Port Unreach."
                              : "No reply"}
                      </div>
                    )}

                    <div
                      className="w-12 h-12 rounded-full border-2 flex items-center justify-center bg-[#141b24] transition-colors duration-300"
                      style={{ borderColor: border, boxShadow: replying ? `0 0 16px ${replyColor}66` : "none" }}
                    >
                      {isSource ? (
                        <Laptop size={20} style={{ color: "#84cc16" }} />
                      ) : isDest ? (
                        <Globe size={20} style={{ color: "#06b6d4" }} />
                      ) : (
                        <RouterIcon size={20} className="text-slate-400" />
                      )}
                    </div>
                    <div className="text-[9px] uppercase tracking-widest font-bold text-slate-300 mt-1.5 text-center leading-tight">
                      {node.name}
                    </div>
                    <div className="text-[9px] font-mono text-slate-600 text-center">{node.ip}</div>
                    {!isSource && (
                      <div className="text-[8px] font-mono text-slate-700 mt-0.5">hop {pathIdx + 1}</div>
                    )}
                  </div>

                  {rowIndex < ROW_COUNT - 1 && (
                    <div
                      className="h-[2px] mt-6 transition-colors duration-300"
                      style={{
                        flex: 1,
                        background: packetRow > rowIndex || ttl > rowIndex ? "#84cc16" : "rgba(255,255,255,0.1)",
                      }}
                    />
                  )}
                </Fragment>
              );
            })}
          </div>
        </div>

        {/* Results table */}
        <div className="flex-1 mt-3 border border-white/5 rounded-xl bg-[#0c1219] overflow-hidden flex flex-col min-h-0">
          <div className="grid grid-cols-[3rem_1fr_repeat(3,4rem)] gap-2 px-4 py-2 border-b border-white/5 text-[9px] uppercase tracking-widest text-slate-500 shrink-0">
            <span>Hop</span>
            <span>Host / IP</span>
            <span className="text-center">RTT 1</span>
            <span className="text-center">RTT 2</span>
            <span className="text-center">RTT 3</span>
          </div>
          <div className="flex-1 overflow-y-auto logs-scroll">
            {results.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[11px] uppercase tracking-widest text-slate-600">
                Press “Send Probe” to begin tracing
              </div>
            ) : (
              results.map((r) => {
                const isDest = r.ttl === PATH.length;
                const color = r.type === "no-response" ? "#64748b" : isDest ? "#22c55e" : "#cbd5e1";
                return (
                  <div
                    key={r.ttl}
                    className="grid grid-cols-[3rem_1fr_repeat(3,4rem)] gap-2 px-4 py-1.5 border-b border-white/5 text-[11px] font-mono items-center"
                  >
                    <span className="text-slate-500">{r.ttl}</span>
                    <span style={{ color }}>
                      {r.ip ? (
                        <>
                          {r.ip} <span className="text-slate-600">· {r.name}</span>
                          {isDest && <span className="text-[#22c55e]"> ✓ reached</span>}
                        </>
                      ) : (
                        <span className="text-slate-600">Request timed out</span>
                      )}
                    </span>
                    {r.rtts.map((t, i) => (
                      <span key={i} className="text-center" style={{ color: t === "*" ? "#64748b" : "#84cc16" }}>
                        {t}
                      </span>
                    ))}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </SimulatorLayout>
  );
}

function Legend({ color, icon, text }: { color: string; icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span style={{ color }}>{icon}</span>
      <span className="text-slate-300">{text}</span>
    </div>
  );
}
