import { useState, useMemo } from "react";
import { RefreshCw, Code, Lock, Minimize2 } from "lucide-react";
import SimulatorLayout, { FooterControl } from "../../components/SimulatorLayout";

function simpleEncrypt(text: string): string {
  return Array.from(text).map(c => {
    const code = c.charCodeAt(0);
    if (code >= 32 && code <= 126) return String.fromCharCode(((code - 32 + 13) % 95) + 32);
    return c;
  }).join("");
}

function simpleCompress(text: string): string {
  let result = "";
  let i = 0;
  while (i < text.length) {
    let j = i + 1;
    while (j < text.length && text[j] === text[i] && j - i < 9) j++;
    const run = j - i;
    result += run > 2 ? `[${run}×${text[i]}]` : text.slice(i, j);
    i = j;
  }
  return result;
}

function toJSON(text: string): string {
  return JSON.stringify({ type: "message", payload: text, timestamp: "2026-04-20T10:42:00Z", encoding: "UTF-8" }, null, 2);
}

export default function Layer6Presentation() {
  const [rawText, setRawText] = useState("Hello from IoT Sensor #7! Temperature: 24.5°C, Humidity: 65%");
  const [coding, setCoding] = useState(false);
  const [crypto, setCrypto] = useState(false);
  const [compression, setCompression] = useState(false);

  const steps = useMemo(() => {
    let text = rawText;
    const layers = [{ label: "Raw Input", text, size: text.length, color: "#94a3b8" }];

    if (coding) {
      text = toJSON(text);
      layers.push({ label: "After Coding (JSON)", text, size: text.length, color: "#f97316" });
    }
    if (crypto) {
      text = simpleEncrypt(text);
      layers.push({ label: "After Cryptography (ROT-13+)", text, size: text.length, color: "#a855f7" });
    }
    if (compression) {
      text = simpleCompress(text);
      layers.push({ label: "After Compression (RLE)", text, size: text.length, color: "#10b981" });
    }

    return layers;
  }, [rawText, coding, crypto, compression]);

  const originalSize = rawText.length;
  const finalSize = steps[steps.length - 1].size;
  const saving = originalSize > 0 ? Math.round((1 - finalSize / originalSize) * 100) : 0;

  const footerControls: FooterControl[] = [
    {
      key: "coding", type: "toggle",
      label: "Coding (JSON)",
      value: coding,
      icon: <Code size={12} />,
      onChange: v => setCoding(v as boolean),
    },
    {
      key: "crypto", type: "toggle",
      label: "Cryptography",
      value: crypto,
      icon: <Lock size={12} />,
      onChange: v => setCrypto(v as boolean),
    },
    {
      key: "compress", type: "toggle",
      label: "Compression",
      value: compression,
      icon: <Minimize2 size={12} />,
      onChange: v => setCompression(v as boolean),
    },
    { key: "sp", type: "spacer" },
    {
      key: "orig", type: "stat",
      stat: { label: "Original", value: `${originalSize}B`, color: "#94a3b8" },
    },
    {
      key: "final", type: "stat",
      stat: { label: "Final", value: `${finalSize}B`, color: "#f97316" },
    },
    {
      key: "saving", type: "stat",
      stat: { label: "Change", value: `${saving > 0 ? "-" : "+"}${Math.abs(saving)}%`, color: saving > 0 ? "#14b8a6" : "#ef4444" },
    },
    {
      key: "reset", type: "button", label: "Reset", variant: "danger", icon: <RefreshCw size={12} />,
      onClick: () => { setCoding(false); setCrypto(false); setCompression(false); },
    },
  ];

  return (
    <SimulatorLayout
      title="Layer 6 Transformation Simulator"
      subtitle="Presentation Layer · The Three C's"
      layerBadge="L6"
      layerColor="#f97316"
      footerControls={footerControls}
    >
      <div className="h-full flex flex-col gap-4 p-4 overflow-hidden">
        {/* Input */}
        <div className="glass-panel rounded-xl border border-white/5 p-4 shrink-0">
          <div className="text-slate-400 uppercase tracking-widest font-bold mb-2" style={{ fontSize: 9 }}>
            Input Message (editable)
          </div>
          <textarea
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            className="w-full bg-[#0a0e14] text-slate-300 font-mono text-sm rounded-lg border border-white/8 p-3 resize-none focus:outline-none focus:border-orange-500/40 transition-colors"
            rows={2}
            placeholder="Type a message..."
          />
        </div>

        {/* Transformation pipeline */}
        <div className="flex-1 overflow-y-auto logs-scroll space-y-3">
          {steps.map((step, i) => (
            <div key={i} className="glass-panel rounded-xl border border-white/5 overflow-hidden">
              <div
                className="flex items-center justify-between px-4 py-2 border-b border-white/5"
                style={{ background: step.color + "10" }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: step.color + "25", color: step.color }}
                  >
                    {i + 1}
                  </div>
                  <span className="font-bold text-xs" style={{ color: step.color }}>{step.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs" style={{ color: step.color + "cc" }}>
                    {step.size} bytes
                  </span>
                  {i > 0 && (
                    <span className="px-2 py-0.5 rounded-full border font-bold uppercase tracking-widest"
                      style={{
                        fontSize: 8,
                        color: step.size <= steps[i-1].size ? "#14b8a6" : "#ef4444",
                        borderColor: step.size <= steps[i-1].size ? "#14b8a640" : "#ef444440",
                        background: step.size <= steps[i-1].size ? "#14b8a610" : "#ef444410",
                      }}
                    >
                      {step.size <= steps[i-1].size ? `↓ -${steps[i-1].size - step.size}B` : `↑ +${step.size - steps[i-1].size}B`}
                    </span>
                  )}
                </div>
              </div>
              <div className="p-4">
                <pre className="font-mono text-xs leading-relaxed whitespace-pre-wrap break-all"
                  style={{ color: step.color + "cc", maxHeight: 160, overflow: "hidden" }}
                >
                  {step.text}
                </pre>
              </div>
            </div>
          ))}

          {!coding && !crypto && !compression && (
            <div className="text-center py-8 text-slate-600 text-sm">
              Toggle the Three C's in the footer to see transformations
            </div>
          )}
        </div>
      </div>
    </SimulatorLayout>
  );
}
