import { useState, useEffect, useRef } from "react";
import { Play, RefreshCw, FastForward, Info } from "lucide-react";
import SimulatorLayout, { FooterControl } from "../../components/SimulatorLayout";

interface RouteEntry {
  network: string;
  mask: number;
  nextHop: string;
  interface: string;
  metric: number;
}

const ROUTING_TABLE: RouteEntry[] = [
  { network: "10.0.1.0", mask: 24, nextHop: "10.0.0.2", interface: "eth0", metric: 1 },
  { network: "10.0.2.0", mask: 24, nextHop: "10.0.0.3", interface: "eth1", metric: 2 },
  { network: "192.168.0.0", mask: 16, nextHop: "172.16.0.1", interface: "eth2", metric: 5 },
  { network: "10.0.0.0", mask: 8, nextHop: "10.255.0.1", interface: "eth3", metric: 10 },
  { network: "0.0.0.0", mask: 0, nextHop: "203.0.113.1", interface: "wan0", metric: 100 },
];

const PACKETS = [
  { dest: "10.0.1.42", src: "10.0.2.1", data: "HTTP GET /index.html" },
  { dest: "192.168.5.100", src: "10.0.1.5", data: "SSH Connect" },
  { dest: "8.8.8.8", src: "10.0.1.10", data: "DNS Query: google.com" },
  { dest: "10.0.2.200", src: "10.0.1.3", data: "MQTT Publish topic/sensors" },
];

type Step = "idle" | "receive" | "strip-l2" | "read-ip" | "lookup" | "matched" | "decrement-ttl" | "re-encapsulate" | "forward";

const STEP_LABELS: Record<Step, string> = {
  idle: "Waiting for packet...",
  receive: "Packet received on interface",
  "strip-l2": "Stripping Layer 2 MAC header",
  "read-ip": "Reading IP destination address",
  lookup: "Running Longest Prefix Match (LPM) on routing table",
  matched: "Route matched! Most specific prefix wins",
  "decrement-ttl": "Decrementing TTL (Time to Live)",
  "re-encapsulate": "Re-encapsulating with new Layer 2 header",
  forward: "Forwarding packet to next hop",
};

export default function Layer3Routing() {
  const [step, setStep] = useState<Step>("idle");
  const [packetIdx, setPacketIdx] = useState(0);
  const [matchedRoute, setMatchedRoute] = useState<RouteEntry | null>(null);
  const [ttl, setTtl] = useState(64);
  const [autoPlay, setAutoPlay] = useState(false);
  const [speed, setSpeed] = useState<"normal" | "fast">("normal");
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  const STEPS: Step[] = ["receive", "strip-l2", "read-ip", "lookup", "matched", "decrement-ttl", "re-encapsulate", "forward"];

  const packet = PACKETS[packetIdx];

  function findRoute(dest: string): RouteEntry {
    const parts = dest.split(".").map(Number);
    let best: RouteEntry = ROUTING_TABLE[ROUTING_TABLE.length - 1];
    for (const route of ROUTING_TABLE) {
      const routeParts = route.network.split(".").map(Number);
      const maskBits = route.mask;
      let match = true;
      for (let i = 0; i < 4; i++) {
        const shift = Math.max(0, 8 - Math.max(0, maskBits - i * 8));
        const m = 0xff & (0xff << shift);
        if ((parts[i] & m) !== (routeParts[i] & m)) { match = false; break; }
      }
      if (match && route.mask >= best.mask) best = route;
    }
    return best;
  }

  const advanceStep = () => {
    setStep(prev => {
      const idx = STEPS.indexOf(prev as any);
      if (prev === "idle") {
        setTtl(64);
        setMatchedRoute(null);
        return "receive";
      }
      if (prev === "lookup") {
        const route = findRoute(packet.dest);
        setMatchedRoute(route);
        return "matched";
      }
      if (prev === "decrement-ttl") {
        setTtl(t => t - 1);
      }
      if (prev === "forward") {
        return "idle";
      }
      return STEPS[idx + 1] ?? "forward";
    });
  };

  useEffect(() => {
    if (autoPlay) {
      const delay = speed === "fast" ? 600 : 1400;
      intervalRef.current = setInterval(advanceStep, delay);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoPlay, speed, packetIdx]);

  const reset = () => {
    setStep("idle");
    setMatchedRoute(null);
    setTtl(64);
    setAutoPlay(false);
  };

  const nextPacket = () => {
    setPacketIdx(i => (i + 1) % PACKETS.length);
    reset();
  };

  const footerControls: FooterControl[] = [
    {
      key: "play", type: "button", label: autoPlay ? "Pause" : "Auto Play",
      variant: autoPlay ? "cyan" : "teal",
      icon: <Play size={12} />,
      onClick: () => setAutoPlay(a => !a),
    },
    {
      key: "step", type: "button", label: "Step",
      variant: "secondary",
      icon: <FastForward size={12} />,
      disabled: autoPlay,
      onClick: advanceStep,
    },
    {
      key: "speed", type: "segmented",
      options: ["Normal", "Fast"],
      value: speed === "normal" ? "Normal" : "Fast",
      onChange: v => setSpeed(v === "Fast" ? "fast" : "normal"),
    },
    { key: "div1", type: "spacer" },
    {
      key: "pkt", type: "stat",
      stat: { label: "Packet", value: `${packetIdx + 1} / ${PACKETS.length}`, color: "#8b5cf6" },
    },
    {
      key: "ttl-stat", type: "stat",
      stat: { label: "TTL", value: String(ttl), color: ttl < 20 ? "#ef4444" : "#06b6d4" },
    },
    {
      key: "next-pkt", type: "button", label: "Next Packet",
      variant: "secondary",
      onClick: nextPacket,
    },
    {
      key: "reset", type: "button", label: "Reset",
      variant: "danger",
      icon: <RefreshCw size={12} />,
      onClick: reset,
    },
  ];

  const stepIdx = STEPS.indexOf(step as any);

  return (
    <SimulatorLayout
      title="Layer 3 Routing Simulator"
      subtitle="Network Layer · OSI Model"
      layerBadge="L3"
      layerColor="#8b5cf6"
      footerControls={footerControls}
    >
      <div className="h-full flex gap-4 p-4 overflow-hidden">
        {/* Left: Packet Journey */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Packet info */}
          <div className="glass-panel rounded-xl border border-white/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-slate-400 uppercase tracking-widest font-bold" style={{ fontSize: 9 }}>
                Current Packet
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="text-slate-600 uppercase tracking-widest mb-1" style={{ fontSize: 8 }}>Source IP</div>
                <div className="font-mono text-cyan-400 font-bold text-xs">{packet.src}</div>
              </div>
              <div>
                <div className="text-slate-600 uppercase tracking-widest mb-1" style={{ fontSize: 8 }}>Destination IP</div>
                <div className="font-mono text-purple-400 font-bold text-xs">{packet.dest}</div>
              </div>
              <div>
                <div className="text-slate-600 uppercase tracking-widest mb-1" style={{ fontSize: 8 }}>Payload</div>
                <div className="font-mono text-slate-400 text-xs truncate">{packet.data}</div>
              </div>
            </div>
          </div>

          {/* Step visualization */}
          <div className="flex-1 glass-panel rounded-xl border border-white/5 p-4 flex flex-col">
            <div className="text-slate-400 uppercase tracking-widest font-bold mb-4" style={{ fontSize: 9 }}>
              Processing Pipeline
            </div>

            {/* Layer stack visual */}
            <div className="flex-1 flex flex-col justify-center gap-2">
              {[
                { key: "receive", label: "RECEIVE", sublabel: "Interface ingress", layers: ["L2 Header", "IP Header", "Payload"] },
                { key: "strip-l2", label: "STRIP L2", sublabel: "Remove MAC frame", layers: ["IP Header", "Payload"] },
                { key: "read-ip", label: "READ IP", sublabel: "Parse destination", layers: ["IP Header", "Payload"], highlight: "IP" },
                { key: "lookup", label: "LPM LOOKUP", sublabel: "Match routing table", layers: ["IP Header", "Payload"] },
                { key: "matched", label: "ROUTE MATCHED", sublabel: matchedRoute ? `/${matchedRoute.mask} via ${matchedRoute.nextHop}` : "Awaiting match", layers: ["IP Header", "Payload"] },
                { key: "decrement-ttl", label: "TTL -1", sublabel: `TTL: 64 → ${ttl}`, layers: ["IP Header (TTL-1)", "Payload"] },
                { key: "re-encapsulate", label: "RE-ENCAPSULATE", sublabel: "Add new L2 header", layers: ["New L2 Header", "IP Header", "Payload"] },
                { key: "forward", label: "FORWARD", sublabel: matchedRoute ? `Out via ${matchedRoute.interface}` : "Out to next hop", layers: ["L2 Header", "IP Header", "Payload"] },
              ].map((s, i) => {
                const isActive = step === s.key;
                const isDone = stepIdx > i && step !== "idle";
                const color = isActive ? "#8b5cf6" : isDone ? "#14b8a6" : "#1e2d3d";

                return (
                  <div key={s.key} className="flex items-center gap-3">
                    {/* Step indicator */}
                    <div className="flex flex-col items-center shrink-0" style={{ width: 20 }}>
                      <div
                        className="w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-300"
                        style={{
                          borderColor: color,
                          background: isActive || isDone ? color + "30" : "transparent",
                        }}
                      >
                        {isDone && <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#14b8a6" }} />}
                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />}
                      </div>
                      {i < 7 && <div className="w-px h-3 mt-0.5" style={{ background: color + "40" }} />}
                    </div>

                    {/* Content */}
                    <div
                      className="flex-1 flex items-center justify-between rounded-lg px-3 py-2 border transition-all duration-300"
                      style={{
                        background: isActive ? "#8b5cf620" : isDone ? "#14b8a610" : "#0a0e14",
                        borderColor: isActive ? "#8b5cf640" : isDone ? "#14b8a625" : "#1e2d3d",
                      }}
                    >
                      <div>
                        <span
                          className="font-bold uppercase tracking-widest"
                          style={{ fontSize: 9, color: isActive ? "#a78bfa" : isDone ? "#14b8a6" : "#475569" }}
                        >
                          {s.label}
                        </span>
                        <span className="ml-2 text-slate-600" style={{ fontSize: 9 }}>{s.sublabel}</span>
                      </div>
                      <div className="flex gap-1">
                        {s.layers.map(l => (
                          <span
                            key={l}
                            className="px-1.5 py-0.5 rounded font-mono"
                            style={{
                              fontSize: 8,
                              background: l.includes("L2") ? "#1e3a4a" : l.includes("IP") ? "#2d1b4e" : "#1a2e1e",
                              color: l.includes("L2") ? "#06b6d4" : l.includes("IP") ? "#a78bfa" : "#4ade80",
                            }}
                          >
                            {l}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Status bar */}
            <div className="mt-3 px-3 py-2 rounded-lg border border-purple-500/20 bg-purple-500/5 flex items-center gap-2">
              <Info size={11} className="text-purple-400 shrink-0" />
              <span className="text-purple-300 text-xs">{STEP_LABELS[step]}</span>
            </div>
          </div>
        </div>

        {/* Right: Routing table */}
        <div className="w-80 shrink-0 glass-panel rounded-xl border border-white/5 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <span className="text-slate-400 uppercase tracking-widest font-bold" style={{ fontSize: 9 }}>
              Routing Table
            </span>
            <span className="font-mono text-slate-600" style={{ fontSize: 9 }}>
              {ROUTING_TABLE.length} entries
            </span>
          </div>
          <div className="flex-1 overflow-y-auto logs-scroll">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5">
                  {["Network/Mask", "Next Hop", "If", "Metric"].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-slate-600 uppercase tracking-widest font-bold" style={{ fontSize: 8 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROUTING_TABLE.map((route, i) => {
                  const isMatch = matchedRoute?.network === route.network && matchedRoute?.mask === route.mask;
                  const isChecking = step === "lookup";
                  return (
                    <tr
                      key={i}
                      className="border-b border-white/3 transition-all duration-300"
                      style={{
                        background: isMatch
                          ? "rgba(139,92,246,0.12)"
                          : isChecking && i <= stepIdx
                          ? "rgba(6,182,212,0.04)"
                          : "transparent",
                      }}
                    >
                      <td className="px-3 py-2 font-mono" style={{ color: isMatch ? "#a78bfa" : "#94a3b8" }}>
                        {route.network}/{route.mask}
                      </td>
                      <td className="px-3 py-2 font-mono text-cyan-400/70">{route.nextHop}</td>
                      <td className="px-3 py-2 text-slate-500">{route.interface}</td>
                      <td className="px-3 py-2 text-slate-500">{route.metric}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {matchedRoute && (
            <div className="p-3 border-t border-purple-500/20 bg-purple-500/5">
              <div className="text-purple-400 uppercase tracking-widest font-bold mb-1" style={{ fontSize: 9 }}>
                LPM Winner
              </div>
              <div className="font-mono text-white text-xs">
                {matchedRoute.network}/{matchedRoute.mask} → {matchedRoute.nextHop}
              </div>
              <div className="text-slate-500 mt-1" style={{ fontSize: 10 }}>
                Most specific prefix match wins
              </div>
            </div>
          )}
        </div>
      </div>
    </SimulatorLayout>
  );
}
