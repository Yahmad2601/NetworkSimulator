import { ReactNode } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export interface FooterControl {
  type: "button" | "toggle" | "segmented" | "slider" | "stat" | "spacer";
  key?: string;
  label?: string;
  value?: string | number | boolean;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  variant?: "primary" | "secondary" | "danger" | "warning" | "cyan" | "teal";
  disabled?: boolean;
  icon?: ReactNode;
  onChange?: (val: string | number | boolean) => void;
  onClick?: () => void;
  stat?: { label: string; value: string; color?: string };
}

interface Props {
  title: string;
  subtitle: string;
  layerBadge?: string;
  layerColor?: string;
  children: ReactNode;
  footerControls: FooterControl[];
  sidebar?: ReactNode;
}

function FooterControlRenderer({ ctrl }: { ctrl: FooterControl }) {
  if (ctrl.type === "spacer") {
    return <div className="flex-1" />;
  }

  if (ctrl.type === "stat" && ctrl.stat) {
    return (
      <div className="flex items-center gap-2 shrink-0">
        {ctrl.icon && <span className="text-slate-500">{ctrl.icon}</span>}
        <span className="text-slate-500 uppercase tracking-widest" style={{ fontSize: 9 }}>
          {ctrl.stat.label}
        </span>
        <span
          className="font-mono font-bold text-xs"
          style={{ color: ctrl.stat.color ?? "#06b6d4" }}
        >
          {ctrl.stat.value}
        </span>
      </div>
    );
  }

  if (ctrl.type === "segmented" && ctrl.options) {
    return (
      <div
        className="flex items-center rounded-full p-1 border border-white/8 shrink-0"
        style={{ background: "#0a0e14" }}
      >
        {ctrl.options.map(opt => (
          <button
            key={opt}
            onClick={() => ctrl.onChange?.(opt)}
            className={`
              px-4 py-1.5 rounded-full font-semibold uppercase tracking-widest transition-all duration-300
              ${ctrl.value === opt
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                : "text-slate-500 hover:text-slate-400"
              }
            `}
            style={{ fontSize: 10 }}
          >
            {opt}
          </button>
        ))}
      </div>
    );
  }

  if (ctrl.type === "toggle") {
    const on = ctrl.value === true;
    return (
      <button
        onClick={() => ctrl.onChange?.(!on)}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-full border font-semibold uppercase tracking-widest transition-all duration-300
          ${on
            ? "bg-teal-500/15 border-teal-500/30 text-teal-400"
            : "bg-white/4 border-white/8 text-slate-500 hover:text-slate-300"
          }
        `}
        style={{ fontSize: 10 }}
      >
        {ctrl.icon && <span>{ctrl.icon}</span>}
        {ctrl.label}
      </button>
    );
  }

  if (ctrl.type === "slider") {
    return (
      <div className="flex items-center gap-3 shrink-0">
        {ctrl.label && (
          <span className="text-slate-500 uppercase tracking-widest whitespace-nowrap" style={{ fontSize: 9 }}>
            {ctrl.label}
          </span>
        )}
        <input
          type="range"
          min={ctrl.min ?? 0}
          max={ctrl.max ?? 100}
          step={ctrl.step ?? 1}
          value={ctrl.value as number}
          onChange={e => ctrl.onChange?.(Number(e.target.value))}
          className="w-28 accent-cyan-400"
          style={{ cursor: "pointer" }}
        />
        <span className="font-mono text-cyan-400 font-bold text-xs w-8 shrink-0">
          {ctrl.value}
        </span>
      </div>
    );
  }

  if (ctrl.type === "button") {
    const variantStyles: Record<string, string> = {
      primary: "text-[#0a0e14] font-bold hover:scale-105 active:scale-95",
      secondary: "bg-white/4 border border-white/8 text-slate-400 hover:text-slate-300",
      danger: "bg-white/4 border border-white/8 text-slate-400 hover:text-red-400 hover:border-red-500/30",
      warning: "bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20",
      cyan: "bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20",
      teal: "text-[#0a0e14] font-bold hover:scale-105 active:scale-95",
    };
    const variantBg: Record<string, string> = {
      primary: "linear-gradient(135deg, #14b8a6, #0891b2)",
      teal: "linear-gradient(135deg, #14b8a6, #0891b2)",
    };

    return (
      <button
        onClick={ctrl.onClick}
        disabled={ctrl.disabled}
        className={`
          flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold uppercase tracking-widest transition-all duration-300
          ${variantStyles[ctrl.variant ?? "secondary"]}
          ${ctrl.disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
        style={{
          fontSize: 10,
          background: variantBg[ctrl.variant ?? "secondary"],
        }}
      >
        {ctrl.icon && <span>{ctrl.icon}</span>}
        {ctrl.label}
      </button>
    );
  }

  return null;
}

export default function SimulatorLayout({
  title,
  subtitle,
  layerBadge,
  layerColor = "#06b6d4",
  children,
  footerControls,
  sidebar,
}: Props) {
  const [, navigate] = useLocation();

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
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `linear-gradient(135deg, ${layerColor}, ${layerColor}99)` }}
          >
            <ShieldCheck size={16} className="text-[#0a0e14]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-white font-bold tracking-tight text-sm leading-none" style={{
                textShadow: `0 0 20px ${layerColor}50`,
              }}>
                {title}
              </h1>
              {layerBadge && (
                <span
                  className="px-2 py-0.5 rounded-full font-bold uppercase tracking-widest"
                  style={{
                    fontSize: 8,
                    background: `${layerColor}20`,
                    color: layerColor,
                    border: `1px solid ${layerColor}30`,
                  }}
                >
                  {layerBadge}
                </span>
              )}
            </div>
            <p className="text-slate-500 uppercase tracking-widest mt-0.5" style={{ fontSize: 9 }}>
              {subtitle}
            </p>
          </div>
        </div>

        {/* Right status */}
        <div className="flex items-center gap-2 text-slate-500" style={{ fontSize: 9 }}>
          <div className="relative flex">
            <span className="w-2 h-2 rounded-full" style={{ background: layerColor }} />
            <span className="status-ping absolute inline-flex w-2 h-2 rounded-full opacity-75" style={{ background: layerColor }} />
          </div>
          <span className="uppercase tracking-widest font-bold" style={{ color: layerColor }}>
            Simulator Active
          </span>
        </div>
      </header>

      {/* Main body */}
      <main className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-hidden relative min-w-0">
          {children}
        </div>
        {sidebar && (
          <aside
            className="w-72 shrink-0 border-l border-white/5 flex flex-col overflow-hidden"
            style={{ background: "#0d1520" }}
          >
            {sidebar}
          </aside>
        )}
      </main>

      {/* Dynamic Control Footer */}
      <footer className="border-t border-white/5 bg-[#0d1520]/90 backdrop-blur-md px-5 py-3 flex items-center gap-4 shrink-0">
        {footerControls.map((ctrl, i) => (
          <FooterControlRenderer key={ctrl.key ?? i} ctrl={ctrl} />
        ))}
      </footer>
    </div>
  );
}
