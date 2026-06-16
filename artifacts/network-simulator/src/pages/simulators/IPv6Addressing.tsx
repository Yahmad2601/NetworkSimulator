import { useMemo, useState } from "react";
import { Network, ArrowRight, RefreshCw, Cpu, Boxes } from "lucide-react";
import SimulatorLayout, { FooterControl } from "../../components/SimulatorLayout";
import {
  isValidIPv6,
  expandIPv6,
  compressIPv6,
  classifyIPv6,
  parseMac,
  eui64,
  slaacAddress,
} from "../../lib/ipv6";

const LAYER_COLOR = "#06b6d4";
const PREFIX_COLOR = "#06b6d4";
const IID_COLOR = "#a855f7";

const TYPES = [
  { name: "Global Unicast", prefix: "2000::/3", color: "#22c55e" },
  { name: "Link-Local", prefix: "fe80::/10", color: "#06b6d4" },
  { name: "Unique Local", prefix: "fc00::/7", color: "#a855f7" },
  { name: "Multicast", prefix: "ff00::/8", color: "#f59e0b" },
  { name: "Loopback", prefix: "::1/128", color: "#14b8a6" },
  { name: "Unspecified", prefix: "::/128", color: "#64748b" },
];

// One hex group with leading zeros dimmed (visualises the compression rule).
function GroupBox({ hex, color }: { hex: string; color: string }) {
  const leadCount = hex.length - (hex.replace(/^0+/, "").length || 0);
  return (
    <div
      className="flex-1 rounded-md border py-2 text-center font-mono text-sm"
      style={{ borderColor: `${color}40`, background: `${color}0d` }}
    >
      {hex.split("").map((c, i) => (
        <span key={i} style={{ color, opacity: i < leadCount ? 0.3 : 1 }}>
          {c}
        </span>
      ))}
    </div>
  );
}

function Bits({ value, highlight }: { value: number; highlight: number }) {
  const bits = value.toString(2).padStart(8, "0").split("");
  return (
    <span className="font-mono">
      {bits.map((b, i) => (
        <span
          key={i}
          style={{ color: i === highlight ? "#f59e0b" : "#64748b", fontWeight: i === highlight ? 700 : 400 }}
        >
          {b}
        </span>
      ))}
    </span>
  );
}

export default function IPv6Addressing() {
  const [mode, setMode] = useState("Analyze");
  const [addr, setAddr] = useState("2001:0db8:85a3:0000:0000:8a2e:0370:7334");
  const [mac, setMac] = useState("00:1A:2B:3C:4D:5E");
  const [prefix, setPrefix] = useState("2001:db8::/64");

  const valid = isValidIPv6(addr);
  const analysis = useMemo(() => {
    if (!valid) return null;
    const expanded = expandIPv6(addr);
    return {
      expanded,
      groups: expanded.split(":"),
      compressed: compressIPv6(addr),
      type: classifyIPv6(addr),
    };
  }, [addr, valid]);

  const macBytes = parseMac(mac);
  const prefixValid = isValidIPv6(prefix.split("/")[0]);
  const slaac = useMemo(() => {
    if (!macBytes || !prefixValid) return null;
    return {
      iid: eui64(mac),
      full: slaacAddress(prefix, mac),
      prefixGroups: expandIPv6(prefix.split("/")[0]).split(":").slice(0, 4),
    };
  }, [mac, prefix, macBytes, prefixValid]);

  const reset = () => {
    setMode("Analyze");
    setAddr("2001:0db8:85a3:0000:0000:8a2e:0370:7334");
    setMac("00:1A:2B:3C:4D:5E");
    setPrefix("2001:db8::/64");
  };

  const footerControls: FooterControl[] = [
    {
      key: "mode",
      type: "segmented",
      options: ["Analyze", "SLAAC"],
      value: mode,
      onChange: (v) => setMode(v as string),
    },
    { key: "sp", type: "spacer" },
    {
      key: "reset",
      type: "button",
      label: "Reset",
      variant: "secondary",
      icon: <RefreshCw size={12} />,
      onClick: reset,
    },
  ];

  const statusCards =
    mode === "Analyze"
      ? [
          { label: "ADDRESS TYPE", value: analysis?.type.type ?? "—", color: analysis ? "#22c55e" : "#ef4444" },
          { label: "TYPE PREFIX", value: analysis?.type.prefix ?? "—", color: "#f59e0b" },
          { label: "STRUCTURE", value: "/64 + IID", color: LAYER_COLOR },
        ]
      : [
          { label: "METHOD", value: "EUI-64", color: LAYER_COLOR },
          { label: "INTERFACE ID", value: slaac ? slaac.iid : "—", color: IID_COLOR },
          { label: "VALID INPUT", value: slaac ? "Yes" : "No", color: slaac ? "#22c55e" : "#ef4444" },
        ];

  const sidebar = (
    <div className="flex flex-col h-full overflow-y-auto logs-scroll p-3 gap-3">
      {mode === "Analyze" ? (
        <>
          <div className="glass-panel border border-white/10 bg-[#141b24] p-3 rounded-xl shrink-0">
            <div className="text-[10px] uppercase tracking-widest font-bold mb-2" style={{ color: LAYER_COLOR }}>
              Compression Rules
            </div>
            <ol className="flex flex-col gap-1.5 text-[11px] text-slate-300 leading-relaxed list-decimal list-inside">
              <li>Drop the leading zeros within each 16-bit group (dimmed above).</li>
              <li>Replace the single longest run of all-zero groups with <span className="font-mono text-cyan-400">::</span>.</li>
              <li><span className="font-mono">::</span> may appear only once, and never for a single zero group.</li>
            </ol>
          </div>
          <div className="glass-panel border border-white/10 bg-[#141b24] p-3 rounded-xl shrink-0">
            <div className="text-[10px] uppercase tracking-widest font-bold mb-2 text-slate-400">Structure</div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              A typical address splits at <span className="font-mono">/64</span>: the first 64 bits are the{" "}
              <span style={{ color: PREFIX_COLOR }} className="font-bold">network prefix</span>, the last 64 are the{" "}
              <span style={{ color: IID_COLOR }} className="font-bold">interface identifier</span>. IPv6 has{" "}
              <span className="font-bold">no broadcast</span> — its job is done by multicast.
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="glass-panel border border-white/10 bg-[#141b24] p-3 rounded-xl shrink-0">
            <div className="text-[10px] uppercase tracking-widest font-bold mb-2" style={{ color: LAYER_COLOR }}>
              EUI-64 &amp; SLAAC
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Stateless Address Autoconfiguration lets a host build its own global address with no DHCP
              server: take the router-advertised <span className="font-mono">/64</span> prefix and generate the
              interface ID from the MAC via EUI-64 — split the MAC, insert{" "}
              <span className="font-mono text-amber-300">FFFE</span>, and flip the Universal/Local (7th) bit.
            </p>
          </div>
          <div className="glass-panel border border-amber-500/20 bg-amber-500/5 p-3 rounded-xl shrink-0">
            <div className="text-[10px] uppercase tracking-widest font-bold mb-1.5 text-amber-400">Privacy Note</div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              EUI-64 embeds the MAC, which is trackable. Modern stacks prefer random{" "}
              <span className="font-bold text-amber-300">privacy addresses</span> (RFC 4941/8981) instead.
            </p>
          </div>
        </>
      )}
    </div>
  );

  return (
    <SimulatorLayout
      title="IPv6 Addressing"
      subtitle="Compression, Types & SLAAC"
      layerBadge="L3"
      layerColor={LAYER_COLOR}
      footerControls={footerControls}
      sidebar={sidebar}
    >
      <div className="h-full flex flex-col p-4 select-none overflow-y-auto logs-scroll text-slate-400 bg-[#0a0e14]">
        {/* Status metrics */}
        <div className="grid grid-cols-3 gap-3 shrink-0 mb-3">
          {statusCards.map((item) => (
            <div
              key={item.label}
              className="glass-panel border border-white/5 bg-[#141b24] p-3 rounded-xl shadow-lg flex flex-col items-center"
            >
              <div className="text-[10px] uppercase tracking-widest mb-1">{item.label}</div>
              <div className="font-mono font-bold text-base truncate w-full text-center" style={{ color: item.color }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {mode === "Analyze" ? (
          <div className="flex flex-col gap-4">
            {/* Address input */}
            <div className="glass-panel border border-white/5 bg-[#141b24] p-4 rounded-xl flex flex-col gap-2">
              <label className="text-[9px] uppercase tracking-widest text-slate-500">IPv6 Address</label>
              <input
                type="text"
                value={addr}
                onChange={(e) => setAddr(e.target.value)}
                className={`bg-[#0c1219] border rounded p-2 text-white font-mono text-sm outline-none transition-colors w-full ${
                  valid ? "border-white/10 focus:border-[#06b6d4]" : "border-red-500"
                }`}
              />
              {!valid && <span className="text-[10px] text-red-500">Invalid IPv6 address</span>}
            </div>

            {analysis && (
              <>
                {/* Expanded groups with prefix / IID split */}
                <div className="glass-panel border border-white/5 bg-[#141b24] p-4 rounded-xl">
                  <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">
                    Expanded · leading zeros dimmed
                  </div>
                  <div className="flex items-stretch gap-1.5">
                    {analysis.groups.map((g, i) => (
                      <GroupBox key={i} hex={g} color={i < 4 ? PREFIX_COLOR : IID_COLOR} />
                    ))}
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    <div
                      className="flex-1 text-center text-[9px] uppercase tracking-widest font-bold py-1 rounded"
                      style={{ color: PREFIX_COLOR, background: `${PREFIX_COLOR}10` }}
                    >
                      Network Prefix · /64
                    </div>
                    <div
                      className="flex-1 text-center text-[9px] uppercase tracking-widest font-bold py-1 rounded"
                      style={{ color: IID_COLOR, background: `${IID_COLOR}10` }}
                    >
                      Interface Identifier · 64 bits
                    </div>
                  </div>
                </div>

                {/* Compressed */}
                <div className="glass-panel border border-white/5 bg-[#141b24] p-4 rounded-xl text-center">
                  <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">
                    Compressed (RFC 5952)
                  </div>
                  <div className="font-mono font-bold text-xl text-white break-all">{analysis.compressed}</div>
                </div>

                {/* Type classifier */}
                <div className="glass-panel border border-white/5 bg-[#141b24] p-4 rounded-xl">
                  <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Address Type</div>
                  <div className="grid grid-cols-3 gap-2">
                    {TYPES.map((t) => {
                      const matched = t.name === analysis.type.type;
                      return (
                        <div
                          key={t.name}
                          className="rounded-lg border p-2 text-center transition-all duration-300"
                          style={{
                            borderColor: matched ? t.color : "rgba(255,255,255,0.06)",
                            background: matched ? `${t.color}15` : "#0c1219",
                            opacity: matched ? 1 : 0.5,
                          }}
                        >
                          <div className="text-[11px] font-bold" style={{ color: matched ? t.color : "#64748b" }}>
                            {t.name}
                          </div>
                          <div className="text-[9px] font-mono text-slate-500">{t.prefix}</div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">{analysis.type.description}</p>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="glass-panel border border-white/5 bg-[#141b24] p-4 rounded-xl flex flex-col gap-2">
                <label className="text-[9px] uppercase tracking-widest text-slate-500 flex items-center gap-1">
                  <Cpu size={11} /> MAC Address (48-bit)
                </label>
                <input
                  type="text"
                  value={mac}
                  onChange={(e) => setMac(e.target.value)}
                  className={`bg-[#0c1219] border rounded p-2 text-white font-mono text-sm outline-none transition-colors w-full ${
                    macBytes ? "border-white/10 focus:border-[#06b6d4]" : "border-red-500"
                  }`}
                />
              </div>
              <div className="glass-panel border border-white/5 bg-[#141b24] p-4 rounded-xl flex flex-col gap-2">
                <label className="text-[9px] uppercase tracking-widest text-slate-500 flex items-center gap-1">
                  <Network size={11} /> Router-Advertised /64 Prefix
                </label>
                <input
                  type="text"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  className={`bg-[#0c1219] border rounded p-2 text-white font-mono text-sm outline-none transition-colors w-full ${
                    prefixValid ? "border-white/10 focus:border-[#06b6d4]" : "border-red-500"
                  }`}
                />
              </div>
            </div>

            {slaac && macBytes && (
              <>
                {/* Step 1: split + insert FFFE */}
                <div className="glass-panel border border-white/5 bg-[#141b24] p-4 rounded-xl">
                  <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
                    <Boxes size={12} /> Step 1 · Split the MAC and insert FFFE in the middle
                  </div>
                  <div className="flex items-center justify-center gap-1.5 font-mono text-sm flex-wrap">
                    {macBytes.slice(0, 3).map((b, i) => (
                      <span key={i} className="px-2 py-1 rounded bg-[#0c1219] border border-white/10 text-slate-200">
                        {b.toString(16).padStart(2, "0")}
                      </span>
                    ))}
                    {["ff", "fe"].map((h) => (
                      <span key={h} className="px-2 py-1 rounded border text-amber-300" style={{ borderColor: "#f59e0b", background: "#f59e0b15" }}>
                        {h}
                      </span>
                    ))}
                    {macBytes.slice(3).map((b, i) => (
                      <span key={i} className="px-2 py-1 rounded bg-[#0c1219] border border-white/10 text-slate-200">
                        {b.toString(16).padStart(2, "0")}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Step 2: flip U/L bit */}
                <div className="glass-panel border border-white/5 bg-[#141b24] p-4 rounded-xl">
                  <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">
                    Step 2 · Flip the Universal/Local (7th) bit of the first byte
                  </div>
                  <div className="flex items-center justify-center gap-3 font-mono text-sm">
                    <div className="text-center">
                      <div className="text-slate-200">{macBytes[0].toString(16).padStart(2, "0")}</div>
                      <Bits value={macBytes[0]} highlight={6} />
                    </div>
                    <ArrowRight size={16} className="text-slate-500" />
                    <div className="text-center">
                      <div style={{ color: IID_COLOR }}>{(macBytes[0] ^ 0x02).toString(16).padStart(2, "0")}</div>
                      <Bits value={macBytes[0] ^ 0x02} highlight={6} />
                    </div>
                  </div>
                </div>

                {/* Step 3: interface ID + full address */}
                <div className="glass-panel border border-white/5 bg-[#141b24] p-4 rounded-xl text-center">
                  <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Interface ID (EUI-64)</div>
                  <div className="font-mono font-bold text-lg break-all" style={{ color: IID_COLOR }}>
                    {slaac.iid}
                  </div>
                </div>

                <div className="glass-panel border p-4 rounded-xl text-center" style={{ borderColor: `${LAYER_COLOR}40`, background: `${LAYER_COLOR}0d` }}>
                  <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">
                    SLAAC Address ·{" "}
                    <span style={{ color: PREFIX_COLOR }}>prefix</span> +{" "}
                    <span style={{ color: IID_COLOR }}>interface ID</span>
                  </div>
                  <div className="font-mono font-bold text-xl text-white break-all">{slaac.full}</div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </SimulatorLayout>
  );
}
