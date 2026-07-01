import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BookOpen, Download, RefreshCw, User } from "lucide-react";
import SimulatorLayout, { FooterControl } from "../../components/SimulatorLayout";
import {
  CODEBOOK,
  REGISTER_NAMES,
  SAMPLE_PROGRAM,
  createCpu,
  decode,
  parseBinary,
  pressClock,
  toBinary16,
  type CpuState,
} from "../../lib/cpu";

const LAYER_COLOR = "#f59e0b";
const BULB_ON = "#fbbf24";
const BULB_OFF = "#2a3441";
const BIT_VALUES = [128, 64, 32, 16, 8, 4, 2, 1];

/** One EDB light bulb + its switch. Clicking flips the pair. */
function EdbBulb({ on, value, onToggle }: { on: boolean; value: number; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className="flex flex-col items-center gap-1.5 group" title={`Bit value ${value}`}>
      <span className="font-mono font-bold text-xs" style={{ color: on ? BULB_ON : "#475569" }}>
        {on ? 1 : 0}
      </span>
      <div
        className="w-7 h-9 rounded-full border transition-all duration-200 group-hover:scale-105"
        style={{
          background: on
            ? `radial-gradient(circle at 50% 35%, #fef3c7, ${BULB_ON} 60%, #b45309)`
            : `radial-gradient(circle at 50% 35%, #3a4654, ${BULB_OFF})`,
          borderColor: on ? BULB_ON : "rgba(255,255,255,0.1)",
          boxShadow: on ? `0 0 18px ${BULB_ON}90` : "none",
        }}
      />
      {/* the switch */}
      <div
        className="w-5 h-8 rounded border border-white/10 flex flex-col items-center justify-between py-1 transition-colors"
        style={{ background: "#141b24" }}
      >
        <div
          className="w-2.5 h-2.5 rounded-sm transition-all duration-200"
          style={{
            background: on ? BULB_ON : "#475569",
            transform: on ? "translateY(0)" : "translateY(14px)",
          }}
        />
      </div>
      <span className="text-[8px] text-slate-600 font-mono">{value}</span>
    </button>
  );
}

/** A register worktable: 16 tiny bulbs plus the decimal value. */
function RegisterTable({ name, value }: { name: string; value: number }) {
  const bits = toBinary16(value);
  return (
    <div className="rounded-lg border border-white/5 bg-[#141b24] px-3 py-2 flex items-center gap-3">
      <span className="font-mono font-bold text-sm w-7" style={{ color: LAYER_COLOR }}>
        {name}
      </span>
      <div className="flex gap-[3px] flex-1 justify-center">
        {bits.split("").map((b, i) => (
          <div
            key={i}
            className="w-2 h-3 rounded-sm transition-all duration-300"
            style={{
              background: b === "1" ? BULB_ON : BULB_OFF,
              boxShadow: b === "1" ? `0 0 6px ${BULB_ON}` : "none",
            }}
          />
        ))}
      </div>
      <span className="font-mono text-xs text-slate-400 w-12 text-right">{value}</span>
    </div>
  );
}

export default function ManInTheBox() {
  const [cpu, setCpu] = useState<CpuState>(createCpu);
  const [edb, setEdb] = useState<boolean[]>(Array(8).fill(false));
  const [progIndex, setProgIndex] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const [busDriver, setBusDriver] = useState<"you" | "cpu">("you");

  const edbPattern = edb.map((b) => (b ? "1" : "0")).join("");
  const edbValue = parseBinary(edbPattern) ?? 0;
  const decoded = decode(edbPattern);
  const programDone = progIndex >= SAMPLE_PROGRAM.length;

  const phaseLabel =
    cpu.phase === "idle"
      ? "Idle"
      : cpu.phase === "awaiting-operand"
        ? "Waiting for data"
        : `Working · ${cpu.cyclesLeft} left`;
  const phaseColor = cpu.phase === "idle" ? "#64748b" : cpu.phase === "awaiting-operand" ? "#06b6d4" : LAYER_COLOR;

  const toggleBit = (i: number) => {
    setBusDriver("you");
    setEdb((prev) => prev.map((b, j) => (j === i ? !b : b)));
  };

  const pulse = () => {
    const next = pressClock(cpu, edbPattern);
    setCpu(next);
    setLog((prev) => [...prev.slice(-30), `Cycle ${next.totalCycles}: ${next.say}`]);
    if (next.outputEdb) {
      // The Man flipped his switches — both sides of every pair change together.
      setEdb(next.outputEdb.split("").map((c) => c === "1"));
      setBusDriver("cpu");
    }
  };

  const loadNextLine = () => {
    if (programDone) return;
    const line = SAMPLE_PROGRAM[progIndex];
    setEdb(line.pattern.split("").map((c) => c === "1"));
    setBusDriver("you");
    setProgIndex((i) => i + 1);
  };

  const reset = () => {
    setCpu(createCpu());
    setEdb(Array(8).fill(false));
    setProgIndex(0);
    setLog([]);
    setBusDriver("you");
  };

  const footerControls: FooterControl[] = [
    {
      key: "load",
      type: "button",
      label: programDone ? "Program Loaded" : `Load Line ${progIndex + 1}/${SAMPLE_PROGRAM.length}`,
      variant: "cyan",
      icon: <Download size={12} />,
      onClick: loadNextLine,
      disabled: programDone,
    },
    { key: "sp1", type: "spacer" },
    {
      key: "clk",
      type: "button",
      label: "Pulse CLK — Ring the Bell",
      variant: "teal",
      icon: <Bell size={12} />,
      onClick: pulse,
    },
    { key: "sp2", type: "spacer" },
    {
      key: "cycles",
      type: "stat",
      stat: { label: "Clock Cycles", value: String(cpu.totalCycles), color: LAYER_COLOR },
    },
    {
      key: "reset",
      type: "button",
      label: "Reset",
      variant: "secondary",
      icon: <RefreshCw size={12} />,
      onClick: reset,
    },
  ];

  // --- Sidebar: codebook, sample program, and the Man's log ---
  const sidebar = (
    <div className="flex flex-col h-full overflow-y-auto logs-scroll p-3 gap-3">
      <div className="glass-panel border border-white/10 bg-[#141b24] p-3 rounded-xl shrink-0">
        <div className="flex items-center gap-1.5 mb-2">
          <BookOpen size={11} style={{ color: LAYER_COLOR }} />
          <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: LAYER_COLOR }}>
            8088 EDB Codebook
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          {CODEBOOK.map((instr) => {
            const active = cpu.pending?.opcode === instr.opcode || (!cpu.pending && decoded?.opcode === instr.opcode);
            return (
              <div
                key={instr.opcode}
                className="rounded border px-2 py-1.5 transition-all"
                style={{
                  background: active ? `${LAYER_COLOR}15` : "#0c1219",
                  borderColor: active ? `${LAYER_COLOR}55` : "rgba(255,255,255,0.05)",
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold" style={{ color: active ? LAYER_COLOR : "#94a3b8" }}>
                    {instr.opcode}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-slate-500">
                    {instr.mnemonic} · {instr.cycles} cyc
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-snug mt-0.5">{instr.meaning}</p>
              </div>
            );
          })}
          <p className="text-[9px] text-slate-600 leading-snug">
            Any other pattern is just a number (00000101 = 5).
          </p>
        </div>
      </div>

      <div className="glass-panel border border-white/10 bg-[#141b24] p-3 rounded-xl shrink-0">
        <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">
          Program: 2 + 3 on the EDB
        </div>
        <div className="flex flex-col gap-1">
          {SAMPLE_PROGRAM.map((line, i) => {
            const isNext = i === progIndex;
            const done = i < progIndex;
            return (
              <div
                key={i}
                className="flex items-center gap-2 rounded px-2 py-1 border transition-all"
                style={{
                  background: isNext ? "rgba(6,182,212,0.08)" : "transparent",
                  borderColor: isNext ? "rgba(6,182,212,0.35)" : "transparent",
                  opacity: done ? 0.45 : 1,
                }}
              >
                <span className="font-mono text-[10px] font-bold" style={{ color: isNext ? "#06b6d4" : "#94a3b8" }}>
                  {line.pattern}
                </span>
                <span className="text-[9px] text-slate-500 leading-tight">{line.label}</span>
              </div>
            );
          })}
        </div>
        <p className="text-[9px] text-slate-600 leading-snug mt-2">
          Load a line, ring the bell, repeat. ADD needs extra rings — the Man works multiple cycles for one command.
        </p>
      </div>

      <div className="glass-panel border border-white/10 bg-[#141b24] p-3 rounded-xl flex-1 min-h-24">
        <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">The Man's Log</div>
        <div className="flex flex-col-reverse gap-1">
          {[...log].reverse().map((entry, i) => (
            <div key={log.length - i} className="text-[10px] font-mono text-slate-400 leading-snug border-b border-white/3 pb-1">
              {entry}
            </div>
          ))}
          {log.length === 0 && <p className="text-[10px] text-slate-600">No clock pulses yet.</p>}
        </div>
      </div>
    </div>
  );

  return (
    <SimulatorLayout
      title="CPU: The Man in the Box"
      subtitle="External Data Bus · Registers · Clock"
      layerBadge="CPU"
      layerColor={LAYER_COLOR}
      footerControls={footerControls}
      sidebar={sidebar}
    >
      <div className="h-full flex flex-col p-4 select-none overflow-hidden text-slate-400 bg-[#0a0e14]">
        {/* Status metrics */}
        <div className="grid grid-cols-3 gap-3 shrink-0 mb-3">
          {[
            { label: "CLOCK CYCLES", value: String(cpu.totalCycles), color: LAYER_COLOR },
            { label: "CPU PHASE", value: phaseLabel, color: phaseColor },
            {
              label: "EDB READS",
              value: `${edbPattern} (${decoded ? decoded.mnemonic : edbValue})`,
              color: decoded ? "#06b6d4" : "#94a3b8",
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

        {/* The box */}
        <div
          className="flex-1 min-h-0 rounded-xl border-2 relative flex flex-col overflow-hidden"
          style={{
            borderColor: "rgba(180,120,60,0.35)",
            background: "linear-gradient(160deg, #171209 0%, #0f0d08 100%)",
            boxShadow: "inset 0 0 40px rgba(0,0,0,0.6)",
          }}
        >
          <span
            className="absolute top-3 right-4 font-black text-2xl tracking-widest"
            style={{ color: "rgba(180,120,60,0.4)" }}
          >
            CPU
          </span>

          <div className="flex-1 min-h-0 flex items-start gap-4 p-4 overflow-y-auto logs-scroll">
            {/* The Man + speech bubble */}
            <div className="flex flex-col items-center gap-2 shrink-0 w-44 pt-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={cpu.say}
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="relative rounded-xl border border-white/10 bg-[#1c2530] px-3 py-2 w-full"
                >
                  <p className="text-[11px] text-slate-200 leading-snug text-center">{cpu.say}</p>
                  <div
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-[#1c2530] border-b border-r border-white/10"
                  />
                </motion.div>
              </AnimatePresence>
              <div
                className="w-16 h-16 rounded-full border-2 flex items-center justify-center transition-colors duration-300"
                style={{
                  borderColor: cpu.phase === "working" ? LAYER_COLOR : "rgba(255,255,255,0.15)",
                  background: cpu.phase === "working" ? `${LAYER_COLOR}20` : "#141b24",
                  boxShadow: cpu.phase === "working" ? `0 0 20px ${LAYER_COLOR}40` : "none",
                }}
              >
                <User size={30} style={{ color: cpu.phase === "idle" && cpu.totalCycles === 0 ? "#475569" : LAYER_COLOR }} />
              </div>
              <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">The Man in the Box</span>

              {/* The bell */}
              <motion.button
                key={cpu.totalCycles}
                initial={{ rotate: 0 }}
                animate={cpu.totalCycles > 0 ? { rotate: [0, -18, 14, -8, 0] } : {}}
                transition={{ duration: 0.45 }}
                onClick={pulse}
                className="mt-2 flex flex-col items-center gap-1 group"
                title="Pulse the CLK wire"
              >
                <div
                  className="w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all group-hover:scale-110 group-active:scale-95"
                  style={{
                    borderColor: "#facc15",
                    background: "radial-gradient(circle at 40% 35%, #fde68a, #facc15 55%, #a16207)",
                    boxShadow: "0 0 16px rgba(250,204,21,0.35)",
                  }}
                >
                  <Bell size={20} className="text-[#713f12]" />
                </div>
                <span className="text-[8px] uppercase tracking-widest text-yellow-500/80 font-bold">CLK</span>
              </motion.button>
            </div>

            {/* Registers */}
            <div className="flex-1 min-w-0 flex flex-col gap-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
                  General-Purpose Registers · the four worktables
                </span>
                <span className="text-[9px] text-slate-600">16 bulbs each — his switches only</span>
              </div>
              {REGISTER_NAMES.map((name) => (
                <RegisterTable key={name} name={name} value={cpu.registers[name]} />
              ))}
              <p className="text-[10px] text-slate-600 leading-snug mt-1">
                The 8088's AX–DX still exist in modern CPUs — as EAX (32-bit) and RAX (64-bit), with a lot more
                light bulbs. The Man does his math here; you never touch these switches.
              </p>
            </div>
          </div>

          {/* External Data Bus — the wall of the box */}
          <div className="shrink-0 border-t-2 px-4 py-3" style={{ borderColor: "rgba(180,120,60,0.35)", background: "#0d1017" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: LAYER_COLOR }}>
                External Data Bus — 8 pairs of lights
              </span>
              <span
                className="text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full"
                style={{
                  color: busDriver === "cpu" ? "#22c55e" : "#06b6d4",
                  background: busDriver === "cpu" ? "rgba(34,197,94,0.12)" : "rgba(6,182,212,0.12)",
                }}
              >
                {busDriver === "cpu" ? "The Man set these lights" : "You control the switches"}
              </span>
            </div>
            <div className="flex items-end justify-center gap-4">
              <div className="flex gap-3">
                {edb.map((on, i) => (
                  <EdbBulb key={i} on={on} value={BIT_VALUES[i]} onToggle={() => toggleBit(i)} />
                ))}
              </div>
              <div className="flex flex-col items-center gap-0.5 pb-4 pl-3 border-l border-white/5">
                <span className="text-[9px] uppercase tracking-widest text-slate-500">Pattern</span>
                <span className="font-mono font-bold text-sm text-white">{edbPattern}</span>
                <span className="text-[10px] font-mono" style={{ color: decoded ? "#06b6d4" : "#64748b" }}>
                  {decoded ? `command: ${decoded.mnemonic}` : `number: ${edbValue}`}
                </span>
              </div>
            </div>
            <p className="text-[9px] text-slate-600 text-center mt-1.5">
              Flip a switch and both bulbs of the pair change — inside and outside the box. On = 1, off = 0.
              The Man only looks when the bell rings.
            </p>
          </div>
        </div>
      </div>
    </SimulatorLayout>
  );
}
