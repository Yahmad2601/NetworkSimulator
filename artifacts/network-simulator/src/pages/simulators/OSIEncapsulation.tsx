import { useState } from "react";
import { ChevronDown, ChevronUp, RefreshCw, Play } from "lucide-react";
import SimulatorLayout, { FooterControl } from "../../components/SimulatorLayout";

type Direction = "down" | "up";

interface Layer {
  num: number;
  name: string;
  shortName: string;
  color: string;
  pdu: string;
  header: string;
  description: string;
  addedByDesc: string;
}

const LAYERS: Layer[] = [
  { num: 7, name: "Application", shortName: "App", color: "#14b8a6", pdu: "Data", header: "L7H", description: "User data — HTTP, SMTP, DNS payload", addedByDesc: "Application protocol adds request/response data" },
  { num: 6, name: "Presentation", shortName: "Pres", color: "#f97316", pdu: "Data", header: "L6H", description: "Encoded, encrypted, compressed", addedByDesc: "Encoding, encryption, compression applied" },
  { num: 5, name: "Session", shortName: "Sess", color: "#ec4899", pdu: "Data", header: "L5H", description: "Session ID, dialog control", addedByDesc: "Session token and synchronization markers added" },
  { num: 4, name: "Transport", shortName: "TCP", color: "#8b5cf6", pdu: "Segment", header: "TCP", description: "TCP: src port, dst port, seq, ack", addedByDesc: "TCP header adds port numbers and reliability info" },
  { num: 3, name: "Network", shortName: "IP", color: "#06b6d4", pdu: "Packet", header: "IP", description: "IP: src IP, dst IP, TTL, protocol", addedByDesc: "IP header adds source/destination IP addresses" },
  { num: 2, name: "Data Link", shortName: "MAC", color: "#f59e0b", pdu: "Frame", header: "MAC", description: "MAC: src MAC, dst MAC, FCS", addedByDesc: "MAC header adds hardware addresses and FCS" },
  { num: 1, name: "Physical", shortName: "Bits", color: "#64748b", pdu: "Bits", header: "101...", description: "Raw binary: 0101010110001...", addedByDesc: "Data converted to electrical/optical signals" },
];

export default function OSIEncapsulation() {
  const [direction, setDirection] = useState<Direction>("down");
  const [activeLayer, setActiveLayer] = useState<number>(-1);
  const [step, setStep] = useState(0); // 0 = idle, 1-7 = layers added/removed

  const maxStep = 7;
  const headersVisible = direction === "down" ? step : maxStep - step;

  const advance = () => {
    setStep(s => {
      const next = Math.min(s + 1, maxStep);
      setActiveLayer(direction === "down" ? (7 - next) : (next - 1));
      return next;
    });
  };

  const reset = () => {
    setStep(0);
    setActiveLayer(-1);
  };

  const toggleDir = () => {
    setDirection(d => d === "down" ? "up" : "down");
    reset();
  };

  // Which headers are currently visible in the packet
  const visibleHeaders = direction === "down"
    ? LAYERS.slice(7 - headersVisible).reverse()
    : LAYERS.slice(0, headersVisible);

  const currentLayer = activeLayer >= 0 && activeLayer < 7 ? LAYERS[activeLayer] : null;

  const footerControls: FooterControl[] = [
    {
      key: "dir", type: "segmented",
      options: ["Encapsulate ↓", "Decapsulate ↑"],
      value: direction === "down" ? "Encapsulate ↓" : "Decapsulate ↑",
      onChange: () => toggleDir(),
    },
    {
      key: "step-btn", type: "button",
      label: step === 0 ? "Start" : step >= maxStep ? "Done" : "Next Layer",
      variant: step >= maxStep ? "secondary" : "teal",
      icon: direction === "down" ? <ChevronDown size={12} /> : <ChevronUp size={12} />,
      disabled: step >= maxStep,
      onClick: advance,
    },
    {
      key: "auto", type: "button",
      label: "Auto Run",
      variant: "cyan",
      icon: <Play size={12} />,
      onClick: () => {
        reset();
        let s = 0;
        const iv = setInterval(() => {
          s++;
          setStep(s);
          setActiveLayer(direction === "down" ? (7 - s) : (s - 1));
          if (s >= maxStep) clearInterval(iv);
        }, 900);
      },
    },
    { key: "sp", type: "spacer" },
    {
      key: "layer-stat", type: "stat",
      stat: {
        label: "Layer",
        value: currentLayer ? `L${currentLayer.num} ${currentLayer.shortName}` : "—",
        color: currentLayer?.color ?? "#475569",
      },
    },
    {
      key: "pdu-stat", type: "stat",
      stat: {
        label: "PDU",
        value: currentLayer?.pdu ?? "—",
        color: currentLayer?.color ?? "#475569",
      },
    },
    { key: "reset", type: "button", label: "Reset", variant: "danger", icon: <RefreshCw size={12} />, onClick: reset },
  ];

  return (
    <SimulatorLayout
      title="OSI Encapsulation Simulator"
      subtitle="Full Stack · Russian Nesting Doll"
      layerBadge="L1-7"
      layerColor="#a855f7"
      footerControls={footerControls}
    >
      <div className="h-full flex gap-4 p-4 overflow-hidden">
        {/* Left: Layer stack */}
        <div className="w-56 shrink-0 flex flex-col gap-1 justify-center">
          <div className="text-slate-400 uppercase tracking-widest font-bold mb-2" style={{ fontSize: 9 }}>
            OSI Model
          </div>
          {LAYERS.map(layer => {
            const isActive = layer.num - 1 === activeLayer;
            const passed = direction === "down"
              ? layer.num > (7 - headersVisible)
              : layer.num <= headersVisible;

            return (
              <div
                key={layer.num}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-300"
                style={{
                  background: isActive ? layer.color + "15" : passed ? layer.color + "08" : "#0a0e14",
                  borderColor: isActive ? layer.color + "50" : passed ? layer.color + "25" : "#1e2d3d",
                }}
              >
                <div className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: layer.color + "25", color: layer.color }}
                >
                  {layer.num}
                </div>
                <div>
                  <div className="font-bold text-xs" style={{ color: isActive ? layer.color : passed ? layer.color + "cc" : "#475569" }}>
                    {layer.name}
                  </div>
                  <div className="text-slate-600" style={{ fontSize: 8 }}>{layer.pdu}</div>
                </div>
                {isActive && direction === "down" && <ChevronDown size={12} className="ml-auto" style={{ color: layer.color }} />}
                {isActive && direction === "up" && <ChevronUp size={12} className="ml-auto" style={{ color: layer.color }} />}
              </div>
            );
          })}
        </div>

        {/* Center: Packet visualization */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="text-slate-400 uppercase tracking-widest font-bold mb-3" style={{ fontSize: 9 }}>
            Packet on the Wire
          </div>
          <div className="flex-1 glass-panel rounded-xl border border-white/5 p-5 flex flex-col justify-center">
            {/* Packet stack */}
            <div className="space-y-1">
              {step === 0 && (
                <div className="text-center text-slate-600 py-8">
                  Press Start to begin {direction === "down" ? "encapsulation ↓" : "decapsulation ↑"}
                </div>
              )}
              {LAYERS.filter(l => {
                const hNum = direction === "down" ? l.num > (7 - headersVisible) : l.num <= headersVisible;
                return hNum;
              }).sort((a, b) => b.num - a.num).map((layer, i, arr) => {
                const isPayload = layer.num === 7;
                const isActive = layer.num - 1 === activeLayer;

                return (
                  <div
                    key={layer.num}
                    className="rounded-lg border transition-all duration-300 overflow-hidden"
                    style={{
                      background: isActive ? layer.color + "20" : layer.color + "08",
                      borderColor: isActive ? layer.color + "60" : layer.color + "25",
                      boxShadow: isActive ? `0 0 0 1px ${layer.color}30` : undefined,
                      marginLeft: `${i * 8}px`,
                      marginRight: `${(arr.length - 1 - i) * 8}px`,
                    }}
                  >
                    <div className="flex items-center justify-between px-4 py-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs" style={{ color: layer.color }}>
                          {isPayload ? "PAYLOAD" : layer.header}
                        </span>
                        <span className="text-slate-500 text-xs">{layer.description}</span>
                      </div>
                      <span className="text-slate-600 uppercase tracking-widest" style={{ fontSize: 8 }}>
                        L{layer.num}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Current action */}
        <div className="w-56 shrink-0 flex flex-col gap-3">
          <div className="glass-panel rounded-xl border border-white/5 p-4 flex-1">
            <div className="text-slate-400 uppercase tracking-widest font-bold mb-3" style={{ fontSize: 9 }}>
              Current Action
            </div>
            {currentLayer ? (
              <>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: currentLayer.color + "20", color: currentLayer.color }}>
                  <span className="font-bold text-lg">L{currentLayer.num}</span>
                </div>
                <div className="font-bold text-white mb-1">{currentLayer.name} Layer</div>
                <div className="font-mono text-xs mb-3" style={{ color: currentLayer.color }}>
                  PDU: {currentLayer.pdu}
                </div>
                <div className="p-3 rounded-lg border text-xs leading-relaxed text-slate-400"
                  style={{ borderColor: currentLayer.color + "25", background: currentLayer.color + "08" }}>
                  {direction === "down" ? "+" : "−"} {currentLayer.addedByDesc}
                </div>
              </>
            ) : (
              <div className="text-slate-600 text-sm text-center py-8">
                Start the simulation to see layer-by-layer {direction === "down" ? "encapsulation" : "decapsulation"}
              </div>
            )}
          </div>

          <div className="glass-panel rounded-xl border border-white/5 p-3">
            <div className="text-slate-600 uppercase tracking-widest font-bold mb-2" style={{ fontSize: 8 }}>
              Progress
            </div>
            <div className="h-2 rounded-full bg-[#0a0e14] overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(step / maxStep) * 100}%`,
                  background: "linear-gradient(90deg, #a855f7, #06b6d4)",
                }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-slate-600" style={{ fontSize: 9 }}>{step} / {maxStep} layers</span>
              <span className="text-slate-600" style={{ fontSize: 9 }}>
                {step >= maxStep ? "Complete" : "In progress"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </SimulatorLayout>
  );
}
