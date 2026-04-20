import { useState } from "react";
import { Play, RefreshCw, Shield, AlertTriangle, ZapOff } from "lucide-react";
import SimulatorLayout, { FooterControl } from "../../components/SimulatorLayout";

type Phase = "idle" | "normal-arp" | "normal-traffic" | "spoofing" | "poisoned" | "mitm";

interface ArpEntry { ip: string; mac: string; poisoned?: boolean; }

const NORMAL_TABLE: ArpEntry[] = [
  { ip: "192.168.1.1", mac: "AA:BB:CC:11:22:33" },
  { ip: "192.168.1.100", mac: "AA:BB:CC:44:55:66" },
  { ip: "192.168.1.200", mac: "AA:BB:CC:77:88:99" },
];

const POISONED_TABLE: ArpEntry[] = [
  { ip: "192.168.1.1", mac: "DE:AD:BE:EF:00:01", poisoned: true },
  { ip: "192.168.1.100", mac: "DE:AD:BE:EF:00:01", poisoned: true },
  { ip: "192.168.1.200", mac: "AA:BB:CC:77:88:99" },
];

const PHASE_MESSAGES: Record<Phase, string> = {
  idle: "Network is quiet. All ARP caches are valid.",
  "normal-arp": "Host A broadcasts: 'Who has 192.168.1.1? Tell 192.168.1.100'",
  "normal-traffic": "Router replies. ARP cache updated. Traffic flows normally.",
  spoofing: "ATTACKER sends forged ARP replies: 'I AM the router' to both victims!",
  poisoned: "Victims' ARP caches poisoned. Both now map router IP to attacker MAC.",
  mitm: "All traffic now routes through attacker. Man-in-the-Middle active!",
};

export default function ARPSpoofing() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [arpTable, setArpTable] = useState<ArpEntry[]>(NORMAL_TABLE);
  const [interceptedPackets, setInterceptedPackets] = useState(0);

  const runNormalARP = () => {
    setPhase("normal-arp");
    setTimeout(() => {
      setPhase("normal-traffic");
      setArpTable(NORMAL_TABLE);
    }, 2000);
  };

  const runSpoofing = () => {
    setPhase("spoofing");
    setTimeout(() => {
      setPhase("poisoned");
      setArpTable(POISONED_TABLE);
      setTimeout(() => {
        setPhase("mitm");
        const iv = setInterval(() => setInterceptedPackets(n => n + 1), 500);
        setTimeout(() => clearInterval(iv), 8000);
      }, 1500);
    }, 2000);
  };

  const reset = () => {
    setPhase("idle");
    setArpTable(NORMAL_TABLE);
    setInterceptedPackets(0);
  };

  const isMITM = phase === "mitm" || phase === "poisoned";

  const footerControls: FooterControl[] = [
    {
      key: "normal", type: "button",
      label: "Run Normal ARP",
      variant: "teal",
      icon: <Play size={12} />,
      disabled: phase !== "idle" && phase !== "normal-traffic",
      onClick: runNormalARP,
    },
    {
      key: "spoof", type: "button",
      label: "Launch ARP Spoofing",
      variant: "danger",
      icon: <AlertTriangle size={12} />,
      disabled: phase === "spoofing" || phase === "poisoned" || phase === "mitm",
      onClick: runSpoofing,
    },
    { key: "sp", type: "spacer" },
    {
      key: "intercept", type: "stat",
      stat: {
        label: "Intercepted",
        value: `${interceptedPackets} pkts`,
        color: interceptedPackets > 0 ? "#ef4444" : "#475569",
      },
    },
    {
      key: "status", type: "stat",
      stat: {
        label: "Status",
        value: isMITM ? "COMPROMISED" : "Secure",
        color: isMITM ? "#ef4444" : "#14b8a6",
      },
    },
    { key: "reset", type: "button", label: "Reset", variant: "danger", icon: <RefreshCw size={12} />, onClick: reset },
  ];

  return (
    <SimulatorLayout
      title="ARP & ARP Spoofing"
      subtitle="Layer 2 · Man-in-the-Middle Attack"
      layerBadge="L2 SEC"
      layerColor="#ef4444"
      footerControls={footerControls}
    >
      <div className="h-full flex gap-4 p-4 overflow-hidden">
        {/* Network diagram */}
        <div className="flex-1 glass-panel rounded-xl border border-white/5 relative overflow-hidden canvas-grid">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 700 400" preserveAspectRatio="xMidYMid meet">
            <defs>
              <filter id="glow-red2">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="glow-green2">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#ef4444" />
              </marker>
            </defs>

            {/* Normal traffic lines */}
            {(phase === "normal-traffic" || phase === "idle") && (
              <>
                <line x1={180} y1={200} x2={380} y2={200} stroke="#14b8a6" strokeWidth={2} strokeOpacity={0.4}
                  strokeDasharray="6 4" style={{ animation: "dash-flow 1.2s linear infinite" }} />
                <line x1={380} y1={200} x2={540} y2={130} stroke="#14b8a6" strokeWidth={2} strokeOpacity={0.4}
                  strokeDasharray="6 4" style={{ animation: "dash-flow 1.2s linear infinite" }} />
              </>
            )}

            {/* MITM lines (attacker intercepts) */}
            {(phase === "mitm" || phase === "poisoned") && (
              <>
                <line x1={180} y1={200} x2={380} y2={280} stroke="#ef4444" strokeWidth={2} strokeOpacity={0.7}
                  strokeDasharray="6 4" style={{ animation: "dash-flow 0.6s linear infinite" }} />
                <line x1={380} y1={280} x2={540} y2={130} stroke="#ef4444" strokeWidth={2} strokeOpacity={0.7}
                  strokeDasharray="6 4" style={{ animation: "dash-flow 0.6s linear infinite" }} />
              </>
            )}

            {/* Spoofing broadcast arrows */}
            {(phase === "spoofing" || phase === "poisoned") && (
              <>
                <line x1={380} y1={270} x2={185} y2={205} stroke="#ef4444" strokeWidth={2} strokeOpacity={0.9}
                  markerEnd="url(#arrow)" />
                <line x1={380} y1={270} x2={535} y2={135} stroke="#ef4444" strokeWidth={2} strokeOpacity={0.9}
                  markerEnd="url(#arrow)" />
              </>
            )}

            {/* Host A (Client) */}
            <g transform="translate(140, 200)">
              <circle r={36} fill="#061820" stroke="#06b6d4" strokeWidth={2} filter="url(#glow-green2)" />
              <text textAnchor="middle" y={-42} fill="#94a3b8" fontSize={9} fontFamily="monospace">
                .100 / AA:BB:CC:44:55:66
              </text>
              <text textAnchor="middle" y={4} fill="#06b6d4" fontSize={11} fontWeight="bold">HOST A</text>
            </g>

            {/* Router */}
            <g transform="translate(560, 130)">
              <circle r={36} fill="#061820" stroke={isMITM ? "#ef4444" : "#14b8a6"} strokeWidth={2}
                filter={isMITM ? "url(#glow-red2)" : "url(#glow-green2)"} />
              <text textAnchor="middle" y={-42} fill="#94a3b8" fontSize={9} fontFamily="monospace">
                .1 / AA:BB:CC:11:22:33
              </text>
              <text textAnchor="middle" y={4} fill={isMITM ? "#ef4444" : "#14b8a6"} fontSize={11} fontWeight="bold">
                ROUTER
              </text>
            </g>

            {/* Attacker */}
            <g transform="translate(380, 290)">
              <circle r={38} fill="#1a0505"
                stroke={phase === "spoofing" || phase === "poisoned" || phase === "mitm" ? "#ef4444" : "#334155"}
                strokeWidth={phase === "mitm" ? 3 : 2}
                filter={phase === "mitm" ? "url(#glow-red2)" : undefined}
              />
              <text textAnchor="middle" y={-44} fill="#94a3b8" fontSize={9} fontFamily="monospace">
                .200 / DE:AD:BE:EF:00:01
              </text>
              <text textAnchor="middle" y={0} fill="#ef4444" fontSize={11} fontWeight="bold">ATTACKER</text>
              {phase === "mitm" && (
                <text textAnchor="middle" y={16} fill="#ef4444" fontSize={8}>
                  MITM ACTIVE
                </text>
              )}
            </g>

            {/* ARP broadcast animation */}
            {phase === "normal-arp" && (
              <text x={350} y={170} textAnchor="middle" fill="#14b8a6" fontSize={9} fontFamily="monospace"
                style={{ animation: "threat-blink 0.8s ease-in-out infinite" }}>
                Who has 192.168.1.1? Tell .100
              </text>
            )}

            {phase === "spoofing" && (
              <text x={350} y={380} textAnchor="middle" fill="#ef4444" fontSize={9} fontFamily="monospace"
                style={{ animation: "threat-blink 0.6s ease-in-out infinite" }}>
                "I AM the router!" (FORGED)
              </text>
            )}
          </svg>

          {/* Status bar */}
          <div className={`absolute bottom-4 left-4 right-4 px-4 py-3 rounded-xl border flex items-center gap-3 ${
            isMITM ? "border-red-500/30 bg-red-500/5" : "border-teal-500/25 bg-teal-500/5"
          }`}>
            {isMITM
              ? <AlertTriangle size={14} className="text-red-400 shrink-0" />
              : <Shield size={14} className="text-teal-400 shrink-0" />}
            <span className={`text-sm font-semibold ${isMITM ? "text-red-300" : "text-teal-300"}`}>
              {PHASE_MESSAGES[phase]}
            </span>
            {phase === "mitm" && (
              <span className="ml-auto font-mono text-red-400 font-bold text-xs animate-pulse">
                {interceptedPackets} packets stolen
              </span>
            )}
          </div>
        </div>

        {/* Right: ARP Cache */}
        <div className="w-72 shrink-0 flex flex-col gap-4">
          {/* Victim ARP cache */}
          <div className="glass-panel rounded-xl border border-white/5 flex-1 overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <span className="text-slate-400 uppercase tracking-widest font-bold" style={{ fontSize: 9 }}>
                Host A ARP Cache
              </span>
              {isMITM && (
                <span className="text-red-400 uppercase tracking-widest font-bold flex items-center gap-1" style={{ fontSize: 8 }}>
                  <ZapOff size={9} /> POISONED
                </span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto logs-scroll">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/5">
                    {["IP Address", "MAC Address", "Status"].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-slate-600 uppercase tracking-widest font-bold" style={{ fontSize: 8 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {arpTable.map((entry, i) => (
                    <tr key={i} className="border-b border-white/3 transition-all duration-500"
                      style={{ background: entry.poisoned ? "rgba(239,68,68,0.08)" : "transparent" }}
                    >
                      <td className="px-3 py-2 font-mono" style={{ color: entry.poisoned ? "#ef4444" : "#94a3b8" }}>
                        {entry.ip}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs" style={{
                        color: entry.poisoned ? "#ef4444" : "#475569",
                        fontSize: 9,
                      }}>
                        {entry.mac}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`px-1.5 py-0.5 rounded font-bold uppercase tracking-widest`}
                          style={{
                            fontSize: 7,
                            background: entry.poisoned ? "#ef444420" : "#14b8a615",
                            color: entry.poisoned ? "#ef4444" : "#14b8a6",
                          }}
                        >
                          {entry.poisoned ? "SPOOFED" : "Valid"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Explanation */}
          <div className="glass-panel rounded-xl border border-red-500/15 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={12} className="text-red-400" />
              <span className="text-red-400 uppercase tracking-widest font-bold" style={{ fontSize: 9 }}>Why ARP is Vulnerable</span>
            </div>
            <p className="text-slate-400 leading-relaxed" style={{ fontSize: 10 }}>
              ARP has no authentication. Any host can claim any IP address. Attackers exploit this to insert themselves between two hosts, intercepting or modifying all traffic — a classic MITM attack.
            </p>
            <div className="mt-2 pt-2 border-t border-white/5">
              <span className="text-slate-500 uppercase tracking-widest" style={{ fontSize: 8 }}>Mitigations: </span>
              <span className="text-slate-400" style={{ fontSize: 10 }}>Dynamic ARP Inspection, Static entries, 802.1X</span>
            </div>
          </div>
        </div>
      </div>
    </SimulatorLayout>
  );
}
