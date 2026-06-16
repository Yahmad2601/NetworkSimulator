import { useState } from "react";
import { motion } from "framer-motion";
import {
  Laptop,
  Server as ServerIcon,
  ArrowRight,
  ArrowLeft,
  Lock,
  LockOpen,
  Play,
  RefreshCw,
} from "lucide-react";
import SimulatorLayout, { FooterControl } from "../../components/SimulatorLayout";
import { tlsMessages, roundTrips, firstEncryptedIndex, type TlsVersion } from "../../lib/tls";

const PLAINTEXT_COLOR = "#f59e0b";
const ENCRYPTED_COLOR = "#22c55e";
const LAYER_COLOR = "#22c55e";

export default function TLSHandshake() {
  const [version, setVersion] = useState<TlsVersion>("1.3");
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  const messages = tlsMessages(version);
  const total = messages.length;
  const boundary = firstEncryptedIndex(messages);
  const rtt = roundTrips(version);

  const complete = step >= total;
  // Keys are derived (channel encrypted) once the first encrypted record is revealed.
  const encryptedChannel = step > boundary;

  const channel = complete
    ? { label: "Secured", color: ENCRYPTED_COLOR }
    : encryptedChannel
      ? { label: "Encrypted", color: "#06b6d4" }
      : { label: "Plaintext", color: PLAINTEXT_COLOR };

  const selectedMsg = selected !== null && selected < step ? messages[selected] : null;

  const advance = () => {
    if (complete) return;
    setSelected(step); // surface the newly revealed message in the inspector
    setStep((s) => s + 1);
  };

  const reset = () => {
    setStep(0);
    setSelected(null);
  };

  const changeVersion = (v: TlsVersion) => {
    if (v === version) return;
    setVersion(v);
    setStep(0);
    setSelected(null);
  };

  const footerControls: FooterControl[] = [
    {
      key: "ver",
      type: "segmented",
      options: ["1.3", "1.2"],
      value: version,
      onChange: (v) => changeVersion(v as TlsVersion),
    },
    { key: "sp1", type: "spacer" },
    {
      key: "next",
      type: "button",
      label: complete ? "Handshake Complete" : `Send ${messages[step].name}`,
      variant: "teal",
      icon: complete ? undefined : <Play size={12} />,
      onClick: advance,
      disabled: complete,
    },
    { key: "sp2", type: "spacer" },
    {
      key: "reset",
      type: "button",
      label: "Reset",
      variant: "secondary",
      icon: <RefreshCw size={12} />,
      onClick: reset,
    },
  ];

  // --- Right sidebar: message inspector + round-trip summary ---
  const sidebar = (
    <div className="flex flex-col h-full overflow-y-auto logs-scroll p-3 gap-3">
      <div className="glass-panel border border-white/10 bg-[#141b24] p-3 rounded-xl shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: LAYER_COLOR }}>
            Message Inspector
          </span>
          {selectedMsg && (
            <span
              className="text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{
                color: selectedMsg.encrypted ? ENCRYPTED_COLOR : PLAINTEXT_COLOR,
                background: `${selectedMsg.encrypted ? ENCRYPTED_COLOR : PLAINTEXT_COLOR}15`,
              }}
            >
              {selectedMsg.encrypted ? <Lock size={9} /> : <LockOpen size={9} />}
              {selectedMsg.encrypted ? "Encrypted" : "Plaintext"}
            </span>
          )}
        </div>

        {!selectedMsg ? (
          <p className="text-xs text-slate-300 leading-relaxed">
            Step through the handshake to establish a secure channel. Toggle{" "}
            <span style={{ color: LAYER_COLOR }} className="font-bold">
              1.3 vs 1.2
            </span>{" "}
            to compare round trips, and click any message to inspect it.
          </p>
        ) : (
          <>
            <div
              className="text-sm font-bold mb-0.5"
              style={{ color: selectedMsg.encrypted ? ENCRYPTED_COLOR : PLAINTEXT_COLOR }}
            >
              {selectedMsg.name}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">
              {selectedMsg.direction === "client-to-server" ? "Client → Server" : "Server → Client"}
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed mb-3">{selectedMsg.summary}</p>
            {selectedMsg.fields.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {selectedMsg.fields.map((f) => (
                  <div
                    key={f}
                    className="text-[11px] font-mono text-slate-200 bg-[#0c1219] border border-white/5 rounded px-2 py-1 break-all"
                  >
                    {f}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="glass-panel border border-white/10 bg-[#141b24] p-3 rounded-xl shrink-0">
        <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">
          Round-Trip Cost
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="font-mono font-bold text-2xl" style={{ color: LAYER_COLOR }}>
            {rtt}-RTT
          </span>
          <span className="text-[11px] text-slate-500">TLS {version}</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          {version === "1.3"
            ? "The client's key_share rides in the ClientHello, so the client can send application data after just one round trip."
            : "Key exchange only happens after the server's first flight, so application data waits two full round trips."}
        </p>
      </div>
    </div>
  );

  return (
    <SimulatorLayout
      title="TLS 1.3 Handshake"
      subtitle="Securing the Channel in One Round Trip"
      layerBadge="TLS"
      layerColor={LAYER_COLOR}
      footerControls={footerControls}
      sidebar={sidebar}
    >
      <div className="h-full flex flex-col p-4 select-none overflow-hidden text-slate-400 bg-[#0a0e14]">
        {/* Status metrics */}
        <div className="grid grid-cols-3 gap-3 shrink-0 mb-3">
          {[
            { label: "TLS VERSION", value: version, color: LAYER_COLOR },
            { label: "ROUND TRIPS", value: `${rtt}-RTT`, color: "#06b6d4" },
            { label: "CHANNEL", value: channel.label, color: channel.color },
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

        {/* Sequence ladder */}
        <div className="flex-1 relative border border-white/5 rounded-xl bg-[#0c1219] shadow-[inset_0_0_30px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden">
          {/* Lifeline headers */}
          <div className="flex items-center justify-between px-[10%] py-3 border-b border-white/5 shrink-0">
            <div className="flex flex-col items-center gap-1">
              <div className="w-11 h-11 rounded-full border-2 border-[#06b6d4] flex items-center justify-center bg-[#141b24]">
                <Laptop size={20} className="text-[#06b6d4]" />
              </div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-white">Client</span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-500 border-2"
                style={{
                  borderColor: encryptedChannel ? ENCRYPTED_COLOR : PLAINTEXT_COLOR,
                  background: `${encryptedChannel ? ENCRYPTED_COLOR : PLAINTEXT_COLOR}1a`,
                }}
              >
                {encryptedChannel ? (
                  <Lock size={16} style={{ color: ENCRYPTED_COLOR }} />
                ) : (
                  <LockOpen size={16} style={{ color: PLAINTEXT_COLOR }} />
                )}
              </div>
              <span
                className="text-[9px] uppercase tracking-widest font-bold"
                style={{ color: encryptedChannel ? ENCRYPTED_COLOR : PLAINTEXT_COLOR }}
              >
                {encryptedChannel ? "Encrypted" : "Plaintext"}
              </span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className="w-11 h-11 rounded-full border-2 border-[#a855f7] flex items-center justify-center bg-[#141b24]">
                <ServerIcon size={20} className="text-[#a855f7]" />
              </div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-white">Server</span>
            </div>
          </div>

          {/* Ladder body */}
          <div className="relative flex-1 overflow-y-auto logs-scroll py-3">
            {/* Lifelines */}
            <div className="absolute left-[14%] top-0 bottom-0 w-px bg-gradient-to-b from-[#06b6d4]/40 to-[#06b6d4]/5" />
            <div className="absolute right-[14%] top-0 bottom-0 w-px bg-gradient-to-b from-[#a855f7]/40 to-[#a855f7]/5" />

            {step === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[11px] uppercase tracking-widest text-slate-600">
                  Press “Send ClientHello” to begin the handshake
                </span>
              </div>
            ) : (
              <div className="flex flex-col">
                {messages.slice(0, step).map((m, i) => {
                  const color = m.encrypted ? ENCRYPTED_COLOR : PLAINTEXT_COLOR;
                  const c2s = m.direction === "client-to-server";
                  const isSelected = selected === i;
                  return (
                    <div key={`${version}-${i}`}>
                      {i === boundary && (
                        <div className="relative h-7 flex items-center justify-center my-1">
                          <div className="absolute left-[8%] right-[8%] border-t border-dashed border-[#22c55e]/30" />
                          <span className="relative z-10 px-2 bg-[#0c1219] text-[8px] uppercase tracking-widest font-bold text-[#22c55e] flex items-center gap-1">
                            <Lock size={9} /> Handshake keys derived · encrypted from here
                          </span>
                        </div>
                      )}
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35 }}
                        className="relative h-11 shrink-0"
                      >
                        {/* connecting line */}
                        <div
                          className="absolute left-[14%] right-[14%] top-1/2 h-[2px] -translate-y-1/2 rounded"
                          style={{ background: color, opacity: 0.4 }}
                        />
                        {/* arrowhead at the destination lifeline */}
                        {c2s ? (
                          <ArrowRight
                            size={16}
                            className="absolute right-[14%] top-1/2 -translate-y-1/2 translate-x-1/2"
                            style={{ color }}
                          />
                        ) : (
                          <ArrowLeft
                            size={16}
                            className="absolute left-[14%] top-1/2 -translate-y-1/2 -translate-x-1/2"
                            style={{ color }}
                          />
                        )}
                        {/* message chip */}
                        <button
                          onClick={() => setSelected(i)}
                          className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md border flex items-center gap-1.5 text-[11px] font-mono whitespace-nowrap transition-all"
                          style={{
                            background: `${color}${isSelected ? "30" : "15"}`,
                            borderColor: `${color}${isSelected ? "" : "55"}`,
                            color,
                            boxShadow: isSelected ? `0 0 12px ${color}55` : "none",
                          }}
                        >
                          {m.encrypted ? <Lock size={9} /> : <LockOpen size={9} />}
                          {m.name}
                        </button>
                      </motion.div>
                    </div>
                  );
                })}

                {complete && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="relative h-9 flex items-center justify-center mt-1"
                  >
                    <span className="text-[10px] uppercase tracking-widest font-bold text-[#22c55e] flex items-center gap-1.5">
                      <Lock size={11} /> Secure channel established · {rtt}-RTT
                    </span>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </SimulatorLayout>
  );
}
