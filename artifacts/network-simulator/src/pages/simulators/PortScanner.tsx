import { useEffect, useMemo, useRef, useState } from "react";
import { Radar, Server as ServerIcon, ShieldCheck, Play, RefreshCw } from "lucide-react";
import SimulatorLayout, { FooterControl } from "../../components/SimulatorLayout";
import { scanPort, DEFAULT_PORTS, type ScanType, type PortState, type ScanResult } from "../../lib/portscan";

const LAYER_COLOR = "#ef4444";
const TARGET_IP = "203.0.113.45";

const SCAN_LABELS: Record<string, ScanType> = {
  "SYN": "syn",
  "Connect": "connect",
  "NULL": "null",
  "Xmas": "xmas",
  "UDP": "udp",
};

const STATE_COLOR: Record<PortState, string> = {
  open: "#22c55e",
  closed: "#64748b",
  filtered: "#f59e0b",
  "open|filtered": "#14b8a6",
};

export default function PortScanner() {
  const [scanLabel, setScanLabel] = useState("SYN");
  const [firewall, setFirewall] = useState(false);
  const [revealed, setRevealed] = useState(0);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [scanning, setScanning] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const scan = SCAN_LABELS[scanLabel];
  const results = useMemo<ScanResult[]>(
    () => DEFAULT_PORTS.map((p) => scanPort(p, scan, firewall)),
    [scan, firewall],
  );

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  // Changing the scan parameters clears any previous result.
  useEffect(() => {
    clearTimers();
    setRevealed(0);
    setActiveIndex(-1);
    setScanning(false);
  }, [scan, firewall]);

  const runScan = () => {
    if (scanning) return;
    clearTimers();
    setScanning(true);
    setRevealed(0);
    DEFAULT_PORTS.forEach((_, i) => {
      timers.current.push(
        setTimeout(() => {
          setActiveIndex(i);
          setRevealed(i + 1);
        }, i * 360),
      );
    });
    timers.current.push(
      setTimeout(() => {
        setActiveIndex(-1);
        setScanning(false);
      }, DEFAULT_PORTS.length * 360 + 200),
    );
  };

  const reset = () => {
    clearTimers();
    setScanLabel("SYN");
    setFirewall(false);
    setRevealed(0);
    setActiveIndex(-1);
    setScanning(false);
  };

  const openCount = results.slice(0, revealed).filter((r) => r.state === "open").length;

  const footerControls: FooterControl[] = [
    { key: "scan", type: "segmented", options: Object.keys(SCAN_LABELS), value: scanLabel, onChange: (v) => setScanLabel(v as string) },
    { key: "sp1", type: "spacer" },
    { key: "run", type: "button", label: scanning ? "Scanning…" : "Run Scan", variant: "warning", icon: <Play size={12} />, onClick: runScan, disabled: scanning },
    { key: "sp2", type: "spacer" },
    { key: "reset", type: "button", label: "Reset", variant: "secondary", icon: <RefreshCw size={12} />, onClick: reset },
  ];

  const sidebar = (
    <div className="flex flex-col h-full overflow-y-auto logs-scroll p-3 gap-3">
      <div className="glass-panel border border-white/10 bg-[#141b24] p-3 rounded-xl shrink-0">
        <div className="text-[10px] uppercase tracking-widest font-bold mb-2" style={{ color: LAYER_COLOR }}>
          Reading the Responses
        </div>
        <div className="flex flex-col gap-1.5 text-[11px]">
          <Legend color={STATE_COLOR.open} text="open — service replied (SYN-ACK)" />
          <Legend color={STATE_COLOR.closed} text="closed — host sent RST / ICMP unreachable" />
          <Legend color={STATE_COLOR.filtered} text="filtered — silently dropped (firewall)" />
          <Legend color={STATE_COLOR["open|filtered"]} text="open|filtered — no reply (stealth/UDP)" />
        </div>
      </div>
      <div className="glass-panel border border-white/10 bg-[#141b24] p-3 rounded-xl shrink-0">
        <div className="text-[10px] uppercase tracking-widest font-bold mb-2 text-slate-400">Scan Techniques</div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          <span className="font-mono">SYN</span> half-opens (stealthier than full <span className="font-mono">connect()</span>).{" "}
          <span className="font-mono">NULL/Xmas</span> exploit RFC 793: closed ports send RST, open ports stay
          silent. <span className="font-mono">UDP</span> infers closed from ICMP Port Unreachable.
        </p>
      </div>
      <div className="glass-panel border border-amber-500/20 bg-amber-500/5 p-3 rounded-xl shrink-0">
        <p className="text-[10px] text-amber-300/90 leading-relaxed">
          ⚠ Port scanning networks you don't own may be illegal. This is for authorized testing and learning
          only.
        </p>
      </div>
    </div>
  );

  return (
    <SimulatorLayout
      title="Port Scanning (nmap)"
      subtitle="Mapping What's Listening"
      layerBadge="SEC"
      layerColor={LAYER_COLOR}
      footerControls={footerControls}
      sidebar={sidebar}
    >
      <div className="h-full flex flex-col p-4 select-none overflow-hidden text-slate-400 bg-[#0a0e14]">
        {/* Status metrics */}
        <div className="grid grid-cols-3 gap-3 shrink-0 mb-3">
          {[
            { label: "TARGET", value: TARGET_IP, color: LAYER_COLOR },
            { label: "SCAN TYPE", value: `${scanLabel}${firewall ? " · FW" : ""}`, color: "#06b6d4" },
            { label: "OPEN PORTS", value: revealed > 0 ? String(openCount) : "—", color: "#22c55e" },
          ].map((item) => (
            <div key={item.label} className="glass-panel border border-white/5 bg-[#141b24] p-3 rounded-xl shadow-lg flex flex-col items-center">
              <div className="text-[10px] uppercase tracking-widest mb-1">{item.label}</div>
              <div className="font-mono font-bold text-base" style={{ color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Firewall toggle */}
        <div className="flex items-center gap-2 shrink-0 mb-3">
          <span className="text-[10px] uppercase tracking-widest text-slate-500 mr-1">Defense:</span>
          <button
            onClick={() => setFirewall((f) => !f)}
            className="px-3 py-1.5 rounded-full border text-[11px] font-semibold uppercase tracking-widest transition-colors flex items-center gap-1.5"
            style={{ borderColor: firewall ? "#06b6d4" : "rgba(255,255,255,0.1)", background: firewall ? "#06b6d415" : "transparent", color: firewall ? "#06b6d4" : "#64748b" }}
          >
            <ShieldCheck size={12} /> Firewall {firewall ? "On" : "Off"}
          </button>
          <span className="text-[10px] text-slate-500">
            {firewall ? "Closed ports are dropped silently → they show as filtered." : "Closed ports answer with RST → visible as closed."}
          </span>
        </div>

        {/* Scanner / target */}
        <div className="flex-1 flex gap-4 min-h-0">
          {/* left: scanner + lane */}
          <div className="flex-1 relative border border-white/5 rounded-xl bg-[#0c1219] shadow-[inset_0_0_30px_rgba(0,0,0,0.4)] flex items-center px-4 overflow-hidden min-h-0">
            <div className="relative z-10 flex flex-col items-center gap-2 w-28 shrink-0">
              <div className="w-16 h-16 rounded-2xl border-2 border-red-500/60 flex items-center justify-center bg-[#141b24]" style={{ boxShadow: scanning ? "0 0 18px rgba(239,68,68,0.5)" : "none" }}>
                <Radar size={28} className={`text-red-400 ${scanning ? "animate-pulse" : ""}`} />
              </div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-red-400">Scanner</span>
            </div>

            <div className="flex-1 h-full relative">
              {scanning && activeIndex >= 0 && (
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-red-500/40" />
              )}
            </div>

            {/* target with port stack */}
            <div className="relative z-10 flex flex-col items-center gap-2 w-44 shrink-0">
              <div className="w-16 h-16 rounded-2xl border-2 border-cyan-500/60 flex items-center justify-center bg-[#141b24]">
                <ServerIcon size={28} className="text-cyan-400" />
              </div>
              <span className="text-[9px] font-mono text-slate-500">{TARGET_IP}</span>
              <div className="w-full flex flex-col gap-1">
                {results.map((r, i) => {
                  const shown = i < revealed;
                  const active = i === activeIndex;
                  const color = shown ? STATE_COLOR[r.state] : "#334155";
                  return (
                    <div
                      key={r.port}
                      className="flex items-center justify-between rounded border px-2 py-1 transition-all duration-200 text-[10px] font-mono"
                      style={{
                        borderColor: shown ? `${color}66` : "rgba(255,255,255,0.06)",
                        background: shown ? `${color}12` : "#0c1219",
                        boxShadow: active ? `0 0 10px ${STATE_COLOR[r.state]}88` : "none",
                      }}
                    >
                      <span className="text-slate-300">{r.port}</span>
                      <span className="text-slate-500">{r.service}</span>
                      <span style={{ color: shown ? color : "#334155", fontWeight: 700 }}>
                        {shown ? r.state : "·····"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* right: results table */}
          <div className="w-80 shrink-0 border border-white/5 rounded-xl bg-[#0c1219] overflow-hidden flex flex-col">
            <div className="grid grid-cols-[3rem_1fr_1.4fr] gap-2 px-3 py-2 border-b border-white/5 text-[9px] uppercase tracking-widest text-slate-500 shrink-0">
              <span>Port</span>
              <span>State</span>
              <span>Probe → Reply</span>
            </div>
            <div className="flex-1 overflow-y-auto logs-scroll">
              {revealed === 0 ? (
                <div className="h-full flex items-center justify-center text-[11px] uppercase tracking-widest text-slate-600 text-center px-4">
                  Run a scan to probe the ports
                </div>
              ) : (
                results.slice(0, revealed).map((r) => (
                  <div key={r.port} className="grid grid-cols-[3rem_1fr_1.4fr] gap-2 px-3 py-1.5 border-b border-white/5 text-[10px] font-mono items-center">
                    <span className="text-slate-300">{r.port}</span>
                    <span style={{ color: STATE_COLOR[r.state], fontWeight: 700 }}>{r.state}</span>
                    <span className="text-slate-500 truncate">{r.probe} → {r.response}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </SimulatorLayout>
  );
}

function Legend({ color, text }: { color: string; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
      <span className="text-slate-300">{text}</span>
    </div>
  );
}
