import { useLocation } from "wouter";
import { ShieldCheck, ChevronRight, Layers, Zap, Lock } from "lucide-react";
import { SIMULATORS } from "../data/simulators";

const difficultyColor = {
  beginner: { color: "#14b8a6", label: "Beginner" },
  intermediate: { color: "#f59e0b", label: "Intermediate" },
  advanced: { color: "#ef4444", label: "Advanced" },
};

export default function Home() {
  const [, navigate] = useLocation();

  return (
    <div
      className="h-screen overflow-hidden flex flex-col"
      style={{ background: "#0a0e14" }}
    >
      {/* Header */}
      <header
        className="flex items-center justify-between px-8 py-4 border-b border-white/5 shrink-0"
        style={{ background: "rgba(13,21,32,0.95)", backdropFilter: "blur(12px)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #06b6d4, #0891b2)" }}
          >
            <ShieldCheck size={22} className="text-[#0a0e14]" />
          </div>
          <div>
            <h1
              className="text-white font-bold text-xl leading-none"
              style={{ textShadow: "0 0 20px rgba(6,182,212,0.5), 0 0 40px rgba(6,182,212,0.2)" }}
            >
              NetSec Academy
            </h1>
            <p className="text-slate-500 uppercase tracking-widest mt-0.5" style={{ fontSize: 10 }}>
              Interactive Network Protocol Simulators
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="relative flex">
              <span className="w-2 h-2 rounded-full bg-teal-400" />
              <span className="status-ping absolute inline-flex w-2 h-2 rounded-full bg-teal-400 opacity-75" />
            </div>
            <span className="text-teal-400 uppercase tracking-widest font-bold" style={{ fontSize: 9 }}>
              {SIMULATORS.length} Simulators Available
            </span>
          </div>
        </div>
      </header>

      {/* Subtitle bar */}
      <div className="px-8 py-3 border-b border-white/5 flex items-center gap-6 shrink-0" style={{ background: "#0d1520" }}>
        {[
          { icon: <Layers size={12} />, label: "OSI Layers 1–7", color: "#a855f7" },
          { icon: <Zap size={12} />, label: "Real-Time Animations", color: "#06b6d4" },
          { icon: <Lock size={12} />, label: "Security Concepts", color: "#ef4444" },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5" style={{ color: item.color }}>
            {item.icon}
            <span className="uppercase tracking-widest font-semibold" style={{ fontSize: 9 }}>
              {item.label}
            </span>
          </div>
        ))}
        <div className="ml-auto">
          <span className="text-slate-600 uppercase tracking-widest" style={{ fontSize: 9 }}>
            Select a simulator to begin
          </span>
        </div>
      </div>

      {/* Grid of simulators */}
      <main className="flex-1 overflow-y-auto logs-scroll px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-screen-2xl">
          {SIMULATORS.map((sim) => {
            const diff = difficultyColor[sim.difficulty];
            return (
              <button
                key={sim.id}
                onClick={() => navigate(sim.path)}
                className="group text-left rounded-xl border border-white/5 overflow-hidden transition-all duration-300 hover:border-opacity-50 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.99]"
                style={{
                  background: "#141b24",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = sim.color + "50";
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px ${sim.color}30`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.05)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 24px rgba(0,0,0,0.3)";
                }}
              >
                {/* Color bar */}
                <div
                  className="h-1 w-full transition-all duration-300"
                  style={{ background: `linear-gradient(90deg, ${sim.color}, ${sim.color}55)` }}
                />

                <div className="p-4">
                  {/* Layer badge + difficulty */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="px-2 py-0.5 rounded-full font-bold uppercase tracking-widest"
                      style={{
                        fontSize: 8,
                        background: sim.accentColor,
                        color: sim.color,
                        border: `1px solid ${sim.color}30`,
                      }}
                    >
                      {sim.layer}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-full font-bold uppercase tracking-widest"
                      style={{
                        fontSize: 8,
                        background: diff.color + "15",
                        color: diff.color,
                        border: `1px solid ${diff.color}25`,
                      }}
                    >
                      {diff.label}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-white font-bold text-sm leading-snug mb-1 group-hover:text-opacity-90 transition-colors" style={{ color: "rgba(255,255,255,0.92)" }}>
                    {sim.title}
                  </h2>
                  <p className="text-xs font-medium mb-2" style={{ color: sim.color + "90" }}>
                    {sim.subtitle}
                  </p>

                  {/* Description */}
                  <p className="text-slate-500 leading-relaxed mb-3" style={{ fontSize: 11 }}>
                    {sim.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {sim.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 rounded font-mono uppercase"
                        style={{
                          fontSize: 8,
                          background: "#0a0e14",
                          color: "#475569",
                          border: "1px solid rgba(255,255,255,0.05)",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Launch */}
                  <div
                    className="flex items-center gap-1 font-bold uppercase tracking-widest transition-all duration-300 group-hover:gap-2"
                    style={{ fontSize: 9, color: sim.color }}
                  >
                    Launch Simulator
                    <ChevronRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
