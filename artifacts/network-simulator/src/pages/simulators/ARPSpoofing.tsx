import { useState, useEffect, useRef } from "react";
import SimulatorLayout, { FooterControl } from "../../components/SimulatorLayout";
import { RefreshCw } from "lucide-react";

type Mode = "normal" | "spoofing";
type Phase =
  | "idle"
  | "arp-request"
  | "arp-reply"
  | "traffic-normal"
  | "spoof-sending"
  | "spoof-poisoned"
  | "traffic-mitm";

interface AnimPacket {
  id: number;
  x1: number; y1: number;
  x2: number; y2: number;
  progress: number;
  color: string;
  label?: string;
}

// Triangle node positions (in SVG viewBox 600×380)
const GATEWAY  = { x: 300, y:  68 };
const TARGET   = { x: 108, y: 238 };
const ATTACKER = { x: 492, y: 238 };

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

const STATUS_LABELS: Partial<Record<Phase, { status: string; action: string; color: string }>> = {
  idle:            { status: "Clean",       action: "Ready. Click 'Run ARP Protocol'",               color: "#14b8a6" },
  "arp-request":   { status: "Clean",       action: "TARGET broadcast: 'Who has 10.0.0.1?'",         color: "#06b6d4" },
  "arp-reply":     { status: "Clean",       action: "GATEWAY replies with its real MAC address",      color: "#14b8a6" },
  "traffic-normal":{ status: "Clean",       action: "Data flows directly TARGET → GATEWAY",           color: "#14b8a6" },
  "spoof-sending": { status: "Danger",      action: "ATTACKER flooding forged ARP replies!",          color: "#f59e0b" },
  "spoof-poisoned":{ status: "Compromised", action: "TARGET cache poisoned. Attacker = Gateway",      color: "#ef4444" },
  "traffic-mitm":  { status: "Compromised", action: "All packets intercepted by ATTACKER (MITM)",     color: "#ef4444" },
};

export default function ARPSpoofing() {
  const [mode, setMode]   = useState<Mode>("normal");
  const [phase, setPhase] = useState<Phase>("idle");
  const [packets, setPackets] = useState<AnimPacket[]>([]);
  const [lastAction, setLastAction] = useState("Ready. Click 'Run ARP Protocol' to see how devices find each other.");
  const [poisoned, setPoisoned] = useState(false);
  const nextId = useRef(1);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  function addTimer(fn: () => void, ms: number) {
    timers.current.push(setTimeout(fn, ms));
  }
  function clearTimers() { timers.current.forEach(clearTimeout); timers.current = []; }

  useEffect(() => () => clearTimers(), []);

  function spawnPacket(x1: number, y1: number, x2: number, y2: number, color: string, label?: string) {
    const id = nextId.current++;
    setPackets(prev => [...prev, { id, x1, y1, x2, y2, progress: 0, color, label }]);
  }

  useEffect(() => {
    const iv = setInterval(() => {
      setPackets(prev => {
        const next = prev.map(p => ({ ...p, progress: Math.min(1, p.progress + 0.025) }));
        return next.filter(p => p.progress < 1);
      });
    }, 30);
    return () => clearInterval(iv);
  }, []);

  function runARP() {
    clearTimers();
    setPoisoned(false);

    // Phase: broadcast
    setPhase("arp-request");
    setLastAction("TARGET broadcasts: 'Who has 10.0.0.1? Tell 10.0.0.5'");
    spawnPacket(TARGET.x, TARGET.y, GATEWAY.x, GATEWAY.y, "#06b6d4", "ARP REQ");
    spawnPacket(TARGET.x, TARGET.y, ATTACKER.x, ATTACKER.y, "#06b6d4", "ARP REQ");

    addTimer(() => {
      setPhase("arp-reply");
      setLastAction("GATEWAY replies: '10.0.0.1 is at 00:11:BB:22'");
      spawnPacket(GATEWAY.x, GATEWAY.y, TARGET.x, TARGET.y, "#14b8a6", "ARP REPLY");
    }, 1200);

    addTimer(() => {
      setPhase("traffic-normal");
      setLastAction("ARP cache updated. Data flows directly TARGET → GATEWAY");
    }, 2400);
  }

  function sendDataPacket() {
    if (mode === "normal" && (phase === "traffic-normal" || phase === "arp-reply")) {
      spawnPacket(TARGET.x, TARGET.y, GATEWAY.x, GATEWAY.y, "#14b8a6", "DATA");
      setLastAction("Data packet sent: TARGET → GATEWAY (direct, secure)");
    } else if (mode === "spoofing" && (phase === "traffic-mitm" || phase === "spoof-poisoned")) {
      // Goes to attacker first
      spawnPacket(TARGET.x, TARGET.y, ATTACKER.x, ATTACKER.y, "#ef4444", "DATA");
      addTimer(() => spawnPacket(ATTACKER.x, ATTACKER.y, GATEWAY.x, GATEWAY.y, "#ef4444", "FWD"), 700);
      setLastAction("DATA packet hijacked! Attacker reads then forwards to GATEWAY");
    } else {
      setLastAction("Run ARP Protocol first to establish the cache.");
    }
  }

  function runSpoofing() {
    clearTimers();
    setPoisoned(false);

    setPhase("arp-request");
    setLastAction("TARGET broadcasts: 'Who has 10.0.0.1? Tell 10.0.0.5'");
    spawnPacket(TARGET.x, TARGET.y, GATEWAY.x, GATEWAY.y, "#06b6d4", "ARP REQ");
    spawnPacket(TARGET.x, TARGET.y, ATTACKER.x, ATTACKER.y, "#06b6d4", "ARP REQ");

    addTimer(() => {
      // GATEWAY sends real reply AND attacker sends fake replies
      setPhase("spoof-sending");
      setLastAction("ATTACKER flooding forged ARP replies to TARGET and GATEWAY!");
      spawnPacket(GATEWAY.x, GATEWAY.y, TARGET.x, TARGET.y, "#14b8a680", "ARP REPLY");
      spawnPacket(ATTACKER.x, ATTACKER.y, TARGET.x, TARGET.y, "#ef4444", "FAKE REPLY");
      spawnPacket(ATTACKER.x, ATTACKER.y, GATEWAY.x, GATEWAY.y, "#ef4444", "FAKE REPLY");
    }, 1200);

    addTimer(() => {
      setPhase("spoof-poisoned");
      setPoisoned(true);
      setLastAction("Cache poisoned! TARGET believes ATTACKER = Gateway (DE:AD:BE:EF:00:01)");
    }, 2600);

    addTimer(() => {
      setPhase("traffic-mitm");
      setLastAction("MITM active. All data routes through ATTACKER before reaching GATEWAY");
    }, 3800);
  }

  function handleRunARP() {
    if (mode === "normal") runARP();
    else runSpoofing();
  }

  function reset() {
    clearTimers();
    setPhase("idle");
    setPackets([]);
    setLastAction("Ready. Click 'Run ARP Protocol' to see how devices find each other.");
    setPoisoned(false);
  }

  const statusInfo = STATUS_LABELS[phase] ?? STATUS_LABELS["idle"]!;
  const isMITM = phase === "traffic-mitm" || phase === "spoof-poisoned";

  const footerControls: FooterControl[] = [
    {
      key: "mode", type: "segmented",
      options: ["Normal", "Spoofing"],
      value: mode === "normal" ? "Normal" : "Spoofing",
      onChange: v => { setMode(v === "Normal" ? "normal" : "spoofing"); reset(); },
    },
    {
      key: "run", type: "button",
      label: "Run ARP Protocol",
      variant: "teal",
      onClick: handleRunARP,
    },
    {
      key: "send", type: "button",
      label: "Send Data Packet",
      variant: "secondary",
      onClick: sendDataPacket,
    },
    { key: "sp", type: "spacer" },
    { key: "reset", type: "button", label: "Reset Network", variant: "danger", icon: <RefreshCw size={12} />, onClick: reset },
  ];

  // ARP table shown below the canvas
  const targetArpTable = poisoned
    ? [{ ip: "10.0.0.1", mac: "DE:AD:BE:EF:00:01", poisoned: true }]
    : phase !== "idle"
    ? [{ ip: "10.0.0.1", mac: "00:11:BB:22:CC:33", poisoned: false }]
    : [];

  return (
    <SimulatorLayout
      title="ARP Spoofing Simulator"
      subtitle="Layer 2 · Man-in-the-Middle Attack"
      layerBadge="L2 SEC"
      layerColor="#ef4444"
      footerControls={footerControls}
    >
      <div className="h-full flex flex-col p-4 gap-3 overflow-hidden">

        {/* Status bar */}
        <div className="flex items-center justify-between glass-panel rounded-xl border border-white/5 px-5 py-3 shrink-0">
          <p className="text-slate-400 text-sm">{lastAction}</p>
          <div className="flex items-center gap-6 shrink-0 ml-6">
            <div className="text-right">
              <div className="text-slate-600 uppercase tracking-widest font-bold" style={{ fontSize: 8 }}>STATUS</div>
              <div className="font-bold text-sm" style={{ color: statusInfo.color }}>{statusInfo.status}</div>
            </div>
            <div className="text-right">
              <div className="text-slate-600 uppercase tracking-widest font-bold" style={{ fontSize: 8 }}>LAST ACTION</div>
              <div className="font-mono text-xs text-slate-300" style={{ maxWidth: 220, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {statusInfo.action}
              </div>
            </div>
          </div>
        </div>

        {/* Main canvas */}
        <div className="flex-1 glass-panel rounded-xl border border-white/5 relative overflow-hidden min-h-0">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 380" preserveAspectRatio="xMidYMid meet">
            <defs>
              <filter id="arp-glow-red">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="arp-glow-teal">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="arp-glow-blue">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <marker id="arp-arrow-red" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                <path d="M0,0 L0,7 L7,3.5 z" fill="#ef4444" />
              </marker>
              <marker id="arp-arrow-teal" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                <path d="M0,0 L0,7 L7,3.5 z" fill="#14b8a6" />
              </marker>
            </defs>

            {/* Connection lines - triangle edges */}
            {/* Gateway — Target */}
            <line
              x1={GATEWAY.x} y1={GATEWAY.y}
              x2={TARGET.x} y2={TARGET.y}
              stroke={isMITM ? "#ef444430" : "#1e3148"}
              strokeWidth={isMITM ? 1 : 2}
              strokeDasharray="8 5"
            />
            {/* Gateway — Attacker */}
            <line
              x1={GATEWAY.x} y1={GATEWAY.y}
              x2={ATTACKER.x} y2={ATTACKER.y}
              stroke="#1e3148"
              strokeWidth={2}
              strokeDasharray="8 5"
            />
            {/* Target — Attacker */}
            <line
              x1={TARGET.x} y1={TARGET.y}
              x2={ATTACKER.x} y2={ATTACKER.y}
              stroke={isMITM ? "#ef444450" : "#1e2d3d"}
              strokeWidth={isMITM ? 2 : 1.5}
              strokeDasharray={isMITM ? "6 3" : "8 5"}
              style={isMITM ? { animation: "dash-flow 0.7s linear infinite" } : undefined}
            />

            {/* Animated packets */}
            {packets.map(pkt => {
              const x = lerp(pkt.x1, pkt.x2, pkt.progress);
              const y = lerp(pkt.y1, pkt.y2, pkt.progress);
              return (
                <g key={pkt.id}>
                  <circle cx={x} cy={y} r={7} fill={pkt.color} opacity={0.9} />
                  {pkt.label && (
                    <text x={x} y={y - 12} textAnchor="middle" fill={pkt.color}
                      fontSize={8} fontFamily="monospace" fontWeight="bold">
                      {pkt.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* ── GATEWAY node ── */}
            <g transform={`translate(${GATEWAY.x},${GATEWAY.y})`}>
              {/* Outer pulse ring when active */}
              {(phase !== "idle") && (
                <circle r={46} fill="none" stroke={isMITM ? "#ef444430" : "#14b8a630"} strokeWidth={1}
                  style={{ animation: "node-pulse-ring 2s ease-out infinite" }} />
              )}
              <circle r={36}
                fill={isMITM ? "#1a0509" : "#061a18"}
                stroke={isMITM ? "#ef4444" : "#14b8a6"}
                strokeWidth={2}
                filter={isMITM ? "url(#arp-glow-red)" : "url(#arp-glow-teal)"}
              />
              {/* Router icon (SVG path) */}
              <g transform="translate(-11,-14)">
                <rect x={0} y={4} width={22} height={14} rx={3}
                  fill="none" stroke={isMITM ? "#ef4444" : "#14b8a6"} strokeWidth={1.5} />
                <circle cx={5}  cy={11} r={1.5} fill={isMITM ? "#ef4444" : "#14b8a6"} />
                <circle cx={11} cy={11} r={1.5} fill={isMITM ? "#ef4444" : "#14b8a6"} />
                <circle cx={17} cy={11} r={1.5} fill={isMITM ? "#ef4444" : "#14b8a6"} />
                <line x1={11} y1={0} x2={11} y2={4} stroke={isMITM ? "#ef4444" : "#14b8a6"} strokeWidth={1.5} />
                <line x1={5}  y1={0} x2={11} y2={0} stroke={isMITM ? "#ef4444" : "#14b8a6"} strokeWidth={1.5} strokeLinecap="round" />
                <line x1={17} y1={0} x2={11} y2={0} stroke={isMITM ? "#ef4444" : "#14b8a6"} strokeWidth={1.5} strokeLinecap="round" />
              </g>
              <text textAnchor="middle" y={54} fill={isMITM ? "#ef4444" : "#14b8a6"}
                fontSize={11} fontWeight="bold" fontFamily="monospace" letterSpacing={1}>
                GATEWAY
              </text>
              <text textAnchor="middle" y={66} fill="#475569" fontSize={8} fontFamily="monospace">IP: 10.0.0.1</text>
              <text textAnchor="middle" y={76} fill="#334155" fontSize={7.5} fontFamily="monospace">
                {poisoned ? "MAC: DE:AD:BE:EF (FAKE)" : "MAC: 00:11:BB:22"}
              </text>
            </g>

            {/* ── TARGET PC node ── */}
            <g transform={`translate(${TARGET.x},${TARGET.y})`}>
              <circle r={36} fill="#061820" stroke="#06b6d4" strokeWidth={2} filter="url(#arp-glow-blue)" />
              {/* Laptop icon */}
              <g transform="translate(-12,-12)">
                <rect x={2} y={2} width={20} height={13} rx={2} fill="none" stroke="#06b6d4" strokeWidth={1.5} />
                <rect x={0} y={15} width={24} height={3} rx={1.5} fill="none" stroke="#06b6d4" strokeWidth={1.5} />
              </g>
              <text textAnchor="middle" y={54} fill="#06b6d4"
                fontSize={11} fontWeight="bold" fontFamily="monospace" letterSpacing={1}>
                TARGET PC
              </text>
              <text textAnchor="middle" y={66} fill="#475569" fontSize={8} fontFamily="monospace">IP: 10.0.0.5</text>
            </g>

            {/* ── ATTACKER node ── */}
            <g transform={`translate(${ATTACKER.x},${ATTACKER.y})`}>
              {isMITM && (
                <circle r={46} fill="none" stroke="#ef444440" strokeWidth={1}
                  style={{ animation: "node-pulse-ring 1.2s ease-out infinite" }} />
              )}
              <circle r={36}
                fill="#1a0505"
                stroke={mode === "spoofing" ? "#ef4444" : "#334155"}
                strokeWidth={mode === "spoofing" && isMITM ? 3 : 2}
                filter={isMITM ? "url(#arp-glow-red)" : undefined}
              />
              {/* Person + exclamation icon */}
              <g transform="translate(-10,-14)">
                <circle cx={10} cy={4} r={4} fill="none" stroke={mode === "spoofing" ? "#ef4444" : "#475569"} strokeWidth={1.5} />
                <path d="M2,17 Q10,11 18,17" fill="none" stroke={mode === "spoofing" ? "#ef4444" : "#475569"} strokeWidth={1.5} strokeLinecap="round" />
                {mode === "spoofing" && (
                  <>
                    <text x={17} y={7} fill="#ef4444" fontSize={10} fontWeight="bold">!</text>
                  </>
                )}
              </g>
              <text textAnchor="middle" y={54}
                fill={mode === "spoofing" ? "#ef4444" : "#475569"}
                fontSize={11} fontWeight="bold" fontFamily="monospace" letterSpacing={1}>
                ATTACKER
              </text>
              <text textAnchor="middle" y={66} fill="#475569" fontSize={8} fontFamily="monospace">IP: 10.0.0.9</text>
              {isMITM && (
                <text textAnchor="middle" y={78} fill="#ef4444" fontSize={7.5} fontFamily="monospace"
                  style={{ animation: "threat-blink 1s ease-in-out infinite" }}>
                  MITM ACTIVE
                </text>
              )}
            </g>

            {/* ARP request label on line */}
            {phase === "arp-request" && (
              <text x={205} y={175} fill="#06b6d4" fontSize={8.5} fontFamily="monospace" textAnchor="middle"
                style={{ animation: "threat-blink 0.9s ease-in-out infinite" }}>
                Who has 10.0.0.1?
              </text>
            )}
            {phase === "arp-reply" && (
              <text x={205} y={175} fill="#14b8a6" fontSize={8.5} fontFamily="monospace" textAnchor="middle"
                style={{ animation: "threat-blink 0.9s ease-in-out infinite" }}>
                10.0.0.1 is at 00:11:BB:22
              </text>
            )}
            {phase === "spoof-sending" && (
              <text x={400} y={195} fill="#ef4444" fontSize={8.5} fontFamily="monospace" textAnchor="middle"
                style={{ animation: "threat-blink 0.7s ease-in-out infinite" }}>
                "I'm the gateway!" (FORGED)
              </text>
            )}

            {/* Vulnerability note at bottom of canvas */}
            <foreignObject x={20} y={328} width={560} height={44}>
              <div style={{
                color: "#64748b",
                fontSize: "9px",
                lineHeight: "1.5",
                fontFamily: "monospace",
                padding: "2px 0",
              }}>
                <span style={{ color: "#94a3b8", fontWeight: "bold" }}>Vulnerability: </span>
                ARP is a stateless protocol. Devices trust and store ARP replies even if they never asked for them.
                This allows attackers to 'impersonate' other IPs by simply sending frequent unsolicited replies.
              </div>
            </foreignObject>
          </svg>
        </div>

        {/* ARP Cache strip */}
        {targetArpTable.length > 0 && (
          <div className="shrink-0 glass-panel rounded-xl border border-white/5 px-4 py-3 flex items-center gap-6">
            <span className="text-slate-600 uppercase tracking-widest font-bold shrink-0" style={{ fontSize: 8 }}>
              TARGET ARP CACHE
            </span>
            {targetArpTable.map((entry, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-xs">IP:</span>
                  <span className="font-mono font-bold text-xs" style={{ color: entry.poisoned ? "#ef4444" : "#06b6d4" }}>
                    {entry.ip}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-xs">MAC:</span>
                  <span className="font-mono font-bold text-xs" style={{ color: entry.poisoned ? "#ef4444" : "#14b8a6" }}>
                    {entry.mac}
                  </span>
                </div>
                <span
                  className="px-2 py-0.5 rounded-full border font-bold uppercase tracking-widest"
                  style={{
                    fontSize: 7,
                    color: entry.poisoned ? "#ef4444" : "#14b8a6",
                    borderColor: entry.poisoned ? "#ef444440" : "#14b8a640",
                    background: entry.poisoned ? "#ef444410" : "#14b8a610",
                  }}
                >
                  {entry.poisoned ? "SPOOFED" : "Legitimate"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </SimulatorLayout>
  );
}
