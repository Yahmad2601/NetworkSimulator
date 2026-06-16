import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Laptop, Server as ServerIcon, Play, RefreshCw, Radio, Clock } from "lucide-react";
import SimulatorLayout, { FooterControl } from "../../components/SimulatorLayout";
import {
  DEFAULT_DHCP_CONFIG,
  doraMessages,
  clientPhaseForStep,
  phaseForLeaseProgress,
  leaseTimers,
  type DhcpMessageType,
} from "../../lib/dhcp";

const CFG = DEFAULT_DHCP_CONFIG;
const MESSAGES = doraMessages(CFG);
const { t1, t2 } = leaseTimers(CFG.leaseSeconds);

// Secondary server (only the chosen server completes the lease).
const SERVER_B_IP = "192.168.1.2";
const SERVER_B_OFFER = "192.168.1.101";

const MSG_COLOR: Record<DhcpMessageType, string> = {
  DISCOVER: "#3b82f6",
  OFFER: "#22c55e",
  REQUEST: "#f59e0b",
  ACK: "#14b8a6",
};

const PHASE_COLOR: Record<string, string> = {
  INIT: "#475569",
  SELECTING: "#3b82f6",
  REQUESTING: "#f59e0b",
  BOUND: "#14b8a6",
  RENEWING: "#06b6d4",
  REBINDING: "#a855f7",
  EXPIRED: "#ef4444",
};

const LEASE_MILESTONES = [0.5, 0.875, 1];

export default function DHCPSimulator() {
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [twoServers, setTwoServers] = useState(true);
  const [leaseProgress, setLeaseProgress] = useState(0);

  const bound = step >= 4;
  const leasePhase = phaseForLeaseProgress(leaseProgress);
  const phase = bound ? leasePhase : clientPhaseForStep(step);
  const assignedIp = bound && leasePhase !== "EXPIRED" ? CFG.offeredIp : "0.0.0.0";

  // The message in flight is the one that transitions us into the current step.
  const flightMsg = animating && step >= 1 && step <= 4 ? MESSAGES[step - 1] : null;
  const leftToRight = flightMsg?.direction === "client-to-server";

  // The message currently shown in the inspector (last completed / in flight).
  const inspectorMsg = step >= 1 ? MESSAGES[Math.min(step, 4) - 1] : null;

  // Clear the transit animation after the packet finishes.
  useEffect(() => {
    if (!animating) return undefined;
    const timer = setTimeout(() => setAnimating(false), 1500);
    return () => clearTimeout(timer);
  }, [animating, step]);

  const handleNext = () => {
    if (step >= 4 || animating) return;
    setStep((s) => s + 1);
    setAnimating(true);
  };

  const fastForwardLease = () => {
    if (animating) return;
    if (leaseProgress >= 1) {
      // Lease expired — the client must start a fresh DORA exchange.
      setStep(0);
      setLeaseProgress(0);
      return;
    }
    const next = LEASE_MILESTONES.find((m) => m > leaseProgress) ?? 1;
    setLeaseProgress(next);
  };

  const reset = () => {
    setStep(0);
    setAnimating(false);
    setLeaseProgress(0);
  };

  const nextLabel =
    step === 0
      ? "1 · Send DISCOVER"
      : step === 1
        ? "2 · Send OFFER"
        : step === 2
          ? "3 · Send REQUEST"
          : "4 · Send ACK";

  const advanceVariant =
    step === 0 ? "cyan" : step === 1 ? "teal" : step === 2 ? "warning" : "teal";

  const footerControls: FooterControl[] = [
    {
      key: "srv2",
      type: "toggle",
      label: "2nd DHCP Server",
      value: twoServers,
      onChange: (v) => setTwoServers(v as boolean),
      icon: <ServerIcon size={12} />,
    },
    { key: "sp1", type: "spacer" },
    bound
      ? {
          key: "ff",
          type: "button",
          label: leasePhase === "EXPIRED" ? "Lease Expired · Re-DORA" : "Fast-forward Lease",
          variant: leasePhase === "EXPIRED" ? "cyan" : "warning",
          icon: <Clock size={12} />,
          onClick: fastForwardLease,
          disabled: animating,
        }
      : {
          key: "next",
          type: "button",
          label: nextLabel,
          variant: advanceVariant,
          icon: <Play size={12} />,
          onClick: handleNext,
          disabled: animating,
        },
    { key: "sp2", type: "spacer" },
    {
      key: "reset",
      type: "button",
      label: "Reset",
      variant: "secondary",
      icon: <RefreshCw size={12} />,
      onClick: reset,
      disabled: animating,
    },
  ];

  // Server B reacts to the broadcast exchange: it offers during the Offer phase,
  // then withdraws once it overhears the Request naming the other server.
  const serverBState = step < 2 ? "idle" : step < 3 ? "offered" : "withdrawn";
  const broadcastInFlight = Boolean(flightMsg?.broadcast);

  // --- Right sidebar: packet inspector + lease timeline (kept out of the canvas
  //     so nothing overlaps the nodes). ---
  const sidebar = (
    <div className="flex flex-col h-full overflow-y-auto logs-scroll p-3 gap-3">
      <div className="glass-panel border border-white/10 bg-[#141b24] p-3 rounded-xl shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-widest text-[#3b82f6] font-bold">
            Packet Inspector
          </span>
          {inspectorMsg && (
            <span
              className="text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{
                color: inspectorMsg.broadcast ? "#3b82f6" : "#14b8a6",
                background: `${inspectorMsg.broadcast ? "#3b82f6" : "#14b8a6"}15`,
              }}
            >
              {inspectorMsg.broadcast ? <Radio size={9} /> : null}
              {inspectorMsg.broadcast ? "Broadcast" : "Unicast"}
            </span>
          )}
        </div>

        {!inspectorMsg ? (
          <p className="text-xs text-slate-300 leading-relaxed">
            The client boots with no IP address. Press{" "}
            <span className="text-[#3b82f6] font-bold">Send DISCOVER</span> to begin the
            four-step DORA exchange and watch it obtain a lease.
          </p>
        ) : (
          <>
            <div className="text-sm font-bold mb-1" style={{ color: MSG_COLOR[inspectorMsg.type] }}>
              {inspectorMsg.type}
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed mb-3">{inspectorMsg.summary}</p>
            <div className="flex flex-col gap-2">
              {inspectorMsg.fields.map((f) => (
                <div key={f.label} className="flex flex-col">
                  <span className="text-[8px] uppercase tracking-widest text-slate-500">{f.label}</span>
                  <span className="text-[11px] font-mono text-slate-200 break-all">{f.value}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {bound && (
        <div className="glass-panel border border-white/10 bg-[#141b24] p-3 rounded-xl shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-[10px] uppercase tracking-widest font-bold flex items-center gap-1.5"
              style={{ color: PHASE_COLOR[leasePhase] }}
            >
              <Clock size={11} />
              Lease · {leasePhase}
            </span>
            <span className="text-[9px] font-mono text-slate-500">
              {Math.round(CFG.leaseSeconds * (1 - leaseProgress))}s left
            </span>
          </div>
          <div className="relative w-full h-2 bg-white/10 rounded-full overflow-visible mt-1">
            <div
              className="absolute top-0 bottom-0 left-0 rounded-full transition-all duration-700"
              style={{ width: `${leaseProgress * 100}%`, background: PHASE_COLOR[leasePhase] }}
            />
            <div className="absolute -top-0.5 bottom-[-2px] w-px bg-[#06b6d4]" style={{ left: "50%" }} />
            <div className="absolute -top-0.5 bottom-[-2px] w-px bg-[#a855f7]" style={{ left: "87.5%" }} />
          </div>
          <div className="flex justify-between mt-1.5 text-[8px] font-mono">
            <span className="text-[#06b6d4]">T1 {t1}s</span>
            <span className="text-[#a855f7]">T2 {t2}s</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-snug mt-2">
            {leasePhase === "BOUND" &&
              "Lease active. Fast-forward to T1 (50%) to see the client renew."}
            {leasePhase === "RENEWING" &&
              "T1 reached — the client unicasts a Request directly to Server A to renew."}
            {leasePhase === "REBINDING" &&
              "T2 reached — renewal failed, so the client broadcasts to any server."}
            {leasePhase === "EXPIRED" &&
              "Lease expired — the client releases the address and restarts DORA."}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <SimulatorLayout
      title="DHCP & the DORA Process"
      subtitle="Automatic IP Assignment"
      layerBadge="L7"
      layerColor="#3b82f6"
      footerControls={footerControls}
      sidebar={sidebar}
    >
      <div className="h-full flex flex-col p-4 select-none overflow-hidden text-slate-400 bg-[#0a0e14]">
        {/* Status metrics */}
        <div className="grid grid-cols-3 gap-3 shrink-0 mb-3">
          {[
            { label: "CLIENT STATE", value: phase, color: PHASE_COLOR[phase] ?? "#06b6d4" },
            {
              label: "ASSIGNED IP",
              value: assignedIp,
              color: assignedIp === "0.0.0.0" ? "#475569" : "#14b8a6",
            },
            {
              label: "ACTIVE MESSAGE",
              value: flightMsg ? flightMsg.type : step === 0 ? "—" : bound ? "BOUND" : MESSAGES[step - 1].type,
              color: flightMsg ? MSG_COLOR[flightMsg.type] : "#475569",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="glass-panel border border-white/5 bg-[#141b24] p-3 rounded-xl shadow-lg flex flex-col items-center"
            >
              <div className="text-[10px] uppercase tracking-widest mb-1">{item.label}</div>
              <div className="font-mono font-bold text-lg" style={{ color: item.color }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {/* DORA stepper */}
        <div className="grid grid-cols-4 gap-2 shrink-0 mb-3">
          {MESSAGES.map((m, i) => {
            const done = step > i;
            const active = animating && step - 1 === i;
            return (
              <div
                key={m.type}
                className="rounded-lg border p-2 flex items-center gap-2 transition-all duration-300"
                style={{
                  background: done ? `${MSG_COLOR[m.type]}12` : "#0c1219",
                  borderColor: done ? `${MSG_COLOR[m.type]}55` : "rgba(255,255,255,0.05)",
                  boxShadow: active ? `0 0 14px ${MSG_COLOR[m.type]}55` : "none",
                }}
              >
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0"
                  style={{
                    background: done ? MSG_COLOR[m.type] : "rgba(255,255,255,0.06)",
                    color: done ? "#0a0e14" : "#64748b",
                  }}
                >
                  {m.type[0]}
                </span>
                <div className="min-w-0">
                  <div
                    className="text-[11px] font-bold uppercase tracking-wider truncate"
                    style={{ color: done ? MSG_COLOR[m.type] : "#64748b" }}
                  >
                    {m.type}
                  </div>
                  <div className="text-[8px] uppercase tracking-widest text-slate-600 flex items-center gap-1">
                    {m.broadcast ? <Radio size={8} /> : null}
                    {m.broadcast ? "Broadcast" : "Unicast"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Animation stage */}
        <div className="flex-1 relative border border-white/5 rounded-xl bg-[#0c1219] shadow-[inset_0_0_30px_rgba(0,0,0,0.4)] flex items-center justify-between px-8 overflow-hidden">
          {/* Broadcast domain band */}
          <div
            className="absolute left-[24%] right-[24%] top-1/2 -translate-y-1/2 rounded-lg border-2 border-dashed flex items-start justify-center transition-all duration-300 z-0"
            style={{
              height: 170,
              borderColor: broadcastInFlight ? "rgba(59,130,246,0.5)" : "rgba(255,255,255,0.07)",
              background: broadcastInFlight ? "rgba(59,130,246,0.06)" : "transparent",
            }}
          >
            <span
              className="text-[9px] uppercase tracking-widest font-bold mt-2 transition-colors duration-300"
              style={{ color: broadcastInFlight ? "#3b82f6" : "#334155" }}
            >
              Broadcast Domain · 255.255.255.255
            </span>
          </div>

          {/* Client node */}
          <div className="relative z-10 flex flex-col items-center gap-3 w-48 shrink-0">
            <div
              className="w-24 h-24 rounded-full border-4 flex items-center justify-center bg-[#141b24] transition-colors duration-500 shadow-xl"
              style={{
                borderColor: bound && leasePhase !== "EXPIRED" ? "#14b8a6" : "#3b82f6",
                boxShadow: `0 0 20px ${(bound && leasePhase !== "EXPIRED" ? "#14b8a6" : "#3b82f6")}40`,
              }}
            >
              <Laptop
                size={40}
                style={{ color: bound && leasePhase !== "EXPIRED" ? "#14b8a6" : "#3b82f6" }}
              />
            </div>
            <div className="glass-panel border border-white/5 bg-[#141b24] p-2.5 rounded-lg flex flex-col items-center w-full">
              <span className="text-[11px] uppercase tracking-widest font-bold text-white mb-1">
                Client
              </span>
              <span
                className="text-[11px] font-mono"
                style={{ color: assignedIp === "0.0.0.0" ? "#64748b" : "#14b8a6" }}
              >
                {assignedIp}
              </span>
              <span className="text-[8px] font-mono text-slate-600 mt-0.5">{CFG.clientMac}</span>
            </div>
          </div>

          {/* Packet animation */}
          <div className="absolute left-[24%] right-[24%] h-20 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
            <AnimatePresence>
              {flightMsg && (
                <motion.div
                  key={`pkt-${step}`}
                  initial={{ left: leftToRight ? "0%" : "100%", x: "-50%", y: "-50%", top: "50%", opacity: 0, scale: 0.6 }}
                  animate={{ left: leftToRight ? "100%" : "0%", opacity: [0, 1, 1, 0], scale: [0.6, 1, 1, 0.6] }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  className="absolute"
                >
                  <div
                    className="backdrop-blur-md border px-3 py-1.5 font-mono text-[11px] font-bold rounded shadow-lg whitespace-nowrap flex items-center gap-1.5"
                    style={{
                      backgroundColor: `${MSG_COLOR[flightMsg.type]}20`,
                      borderColor: MSG_COLOR[flightMsg.type],
                      color: MSG_COLOR[flightMsg.type],
                      boxShadow: `0 0 15px ${MSG_COLOR[flightMsg.type]}60`,
                    }}
                  >
                    {flightMsg.broadcast && <Radio size={11} />}
                    {flightMsg.type}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Server column */}
          <div className="relative z-10 flex flex-col items-center gap-3 w-48 shrink-0">
            <div
              className="w-24 h-24 rounded-full border-4 flex items-center justify-center bg-[#141b24] transition-colors duration-500 shadow-xl"
              style={{ borderColor: "#3b82f6", boxShadow: "0 0 20px rgba(59,130,246,0.35)" }}
            >
              <ServerIcon size={40} className="text-[#3b82f6]" />
            </div>
            <div className="glass-panel border border-white/5 bg-[#141b24] p-2.5 rounded-lg flex flex-col items-center w-full">
              <span className="text-[11px] uppercase tracking-widest font-bold text-white mb-1">
                DHCP Server A
              </span>
              <span className="text-[11px] font-mono text-[#3b82f6]">{CFG.serverIp}</span>
              <span className="text-[8px] uppercase tracking-widest text-slate-600 mt-0.5">
                Chosen server
              </span>
            </div>

            {/* Second server */}
            {twoServers && (
              <div
                className="glass-panel border bg-[#141b24] p-2.5 rounded-lg flex flex-col items-center w-full transition-all duration-300"
                style={{
                  borderColor:
                    serverBState === "withdrawn"
                      ? "rgba(239,68,68,0.3)"
                      : broadcastInFlight
                        ? "rgba(59,130,246,0.4)"
                        : "rgba(255,255,255,0.05)",
                  opacity: serverBState === "withdrawn" ? 0.55 : 1,
                }}
              >
                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-300 mb-0.5">
                  DHCP Server B
                </span>
                <span className="text-[9px] font-mono text-slate-500">{SERVER_B_IP}</span>
                <span
                  className="text-[8px] uppercase tracking-widest mt-1 font-bold text-center"
                  style={{
                    color:
                      serverBState === "withdrawn"
                        ? "#ef4444"
                        : serverBState === "offered"
                          ? "#22c55e"
                          : "#475569",
                  }}
                >
                  {serverBState === "idle"
                    ? "Listening"
                    : serverBState === "offered"
                      ? `Offered ${SERVER_B_OFFER}`
                      : "Offer withdrawn"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </SimulatorLayout>
  );
}
