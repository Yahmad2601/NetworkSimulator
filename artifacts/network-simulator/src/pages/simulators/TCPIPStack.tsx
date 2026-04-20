import { useState } from "react";
import { RefreshCw, Globe, MessageSquare, Video, Folder } from "lucide-react";
import SimulatorLayout, { FooterControl } from "../../components/SimulatorLayout";

interface Task { id: string; label: string; icon: React.ReactNode; protocol: string; transport: "TCP" | "UDP"; color: string; layers: LayerData[]; }
interface LayerData { layer: string; protocol: string; pdu: string; info: string; color: string; }

const TASKS: Task[] = [
  {
    id: "web", label: "Browse Website", icon: <Globe size={14} />, protocol: "HTTP/2", transport: "TCP", color: "#06b6d4",
    layers: [
      { layer: "Application", protocol: "HTTP/2", pdu: "Message", info: "GET /index.html Host: example.com", color: "#14b8a6" },
      { layer: "Transport", protocol: "TCP", pdu: "Segment", info: "SYN → SYN-ACK → ACK (reliable, ordered)", color: "#8b5cf6" },
      { layer: "Internet", protocol: "IPv4", pdu: "Packet", info: "Src: 10.0.0.5 → Dst: 93.184.216.34 TTL:64", color: "#06b6d4" },
      { layer: "Network Interface", protocol: "Ethernet II", pdu: "Frame", info: "MAC: aa:bb:cc → ff:ee:dd FCS: valid", color: "#f59e0b" },
    ],
  },
  {
    id: "voip", label: "VoIP Call", icon: <MessageSquare size={14} />, protocol: "SIP/RTP", transport: "UDP", color: "#ec4899",
    layers: [
      { layer: "Application", protocol: "SIP + RTP", pdu: "Audio Stream", info: "RTP payload type: G.711 PCMU 64kbps", color: "#ec4899" },
      { layer: "Transport", protocol: "UDP", pdu: "Datagram", info: "No handshake — low latency, loss-tolerant", color: "#f97316" },
      { layer: "Internet", protocol: "IPv4", pdu: "Packet", info: "DSCP: EF (Expedited Forwarding) QoS marked", color: "#06b6d4" },
      { layer: "Network Interface", protocol: "Ethernet II", pdu: "Frame", info: "VLAN tagged 802.1Q priority 5 (voice)", color: "#f59e0b" },
    ],
  },
  {
    id: "stream", label: "Stream Video", icon: <Video size={14} />, protocol: "HLS/DASH", transport: "TCP", color: "#a855f7",
    layers: [
      { layer: "Application", protocol: "HLS/DASH", pdu: "Segment", info: "MPEG-TS segment: 6s, 4K @15Mbps", color: "#a855f7" },
      { layer: "Transport", protocol: "TCP", pdu: "Segment", info: "Large receive window, TLS 1.3 encrypted", color: "#8b5cf6" },
      { layer: "Internet", protocol: "IPv4", pdu: "Packet", info: "CDN Anycast — routed to nearest edge", color: "#06b6d4" },
      { layer: "Network Interface", protocol: "Ethernet II", pdu: "Frame", info: "Jumbo frames (9000 MTU) for throughput", color: "#f59e0b" },
    ],
  },
  {
    id: "iot", label: "IoT Telemetry", icon: <Folder size={14} />, protocol: "MQTT", transport: "TCP", color: "#10b981",
    layers: [
      { layer: "Application", protocol: "MQTT 5.0", pdu: "PUBLISH", info: "Topic: sensors/temp QoS:1 retain:true", color: "#10b981" },
      { layer: "Transport", protocol: "TCP", pdu: "Segment", info: "Port 1883, keepalive 60s PINGREQ/PINGRESP", color: "#8b5cf6" },
      { layer: "Internet", protocol: "IPv6", pdu: "Packet", info: "fe80::1 → 2001:db8::1 (IoT uses IPv6)", color: "#06b6d4" },
      { layer: "Network Interface", protocol: "IEEE 802.15.4", pdu: "Frame", info: "Zigbee/Thread low-power radio link", color: "#f59e0b" },
    ],
  },
];

export default function TCPIPStack() {
  const [selected, setSelected] = useState<Task | null>(null);
  const [activeLayer, setActiveLayer] = useState<number>(-1);

  const handleSelect = (task: Task) => {
    setSelected(task);
    setActiveLayer(-1);
    let i = 0;
    const iv = setInterval(() => {
      setActiveLayer(i);
      i++;
      if (i >= 4) clearInterval(iv);
    }, 600);
  };

  const footerControls: FooterControl[] = [
    {
      key: "transport", type: "stat",
      stat: {
        label: "Transport",
        value: selected ? selected.transport : "—",
        color: selected?.transport === "TCP" ? "#8b5cf6" : selected?.transport === "UDP" ? "#f97316" : "#475569",
      },
    },
    {
      key: "protocol", type: "stat",
      stat: { label: "Protocol", value: selected?.protocol ?? "—", color: selected?.color ?? "#475569" },
    },
    { key: "sp", type: "spacer" },
    {
      key: "tcp-info", type: "stat",
      stat: {
        label: "TCP vs UDP",
        value: selected?.transport === "TCP" ? "Reliable, Ordered" : selected?.transport === "UDP" ? "Fast, Lossy OK" : "—",
        color: selected?.transport === "TCP" ? "#8b5cf6" : "#f97316",
      },
    },
    { key: "reset", type: "button", label: "Reset", variant: "danger", icon: <RefreshCw size={12} />, onClick: () => { setSelected(null); setActiveLayer(-1); } },
  ];

  return (
    <SimulatorLayout
      title="TCP/IP 4-Layer Stack"
      subtitle="DoD Model · Theory to Reality"
      layerBadge="DoD"
      layerColor="#0891b2"
      footerControls={footerControls}
    >
      <div className="h-full flex gap-4 p-4 overflow-hidden">
        {/* User actions */}
        <div className="w-44 shrink-0 flex flex-col gap-2">
          <div className="text-slate-400 uppercase tracking-widest font-bold mb-1" style={{ fontSize: 9 }}>
            User Task
          </div>
          {TASKS.map(task => (
            <button
              key={task.id}
              onClick={() => handleSelect(task)}
              className="flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-left hover:scale-[1.02]"
              style={{
                background: selected?.id === task.id ? task.color + "15" : "#141b24",
                borderColor: selected?.id === task.id ? task.color + "50" : "rgba(255,255,255,0.05)",
              }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: task.color + "20", color: task.color }}>
                {task.icon}
              </div>
              <div>
                <div className="font-semibold text-xs text-slate-300">{task.label}</div>
                <div className="font-mono" style={{ fontSize: 8, color: task.color }}>{task.protocol}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Stack visualization */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="text-slate-400 uppercase tracking-widest font-bold mb-3" style={{ fontSize: 9 }}>
            TCP/IP 4-Layer Stack
          </div>

          {selected ? (
            <div className="flex-1 flex flex-col gap-3">
              {selected.layers.map((layer, i) => {
                const isActive = activeLayer === i;
                const passed = activeLayer > i || activeLayer === -1;
                return (
                  <div key={layer.layer}
                    className="flex-1 rounded-xl border transition-all duration-500 overflow-hidden"
                    style={{
                      background: isActive ? layer.color + "15" : "#141b24",
                      borderColor: isActive ? layer.color + "50" : activeLayer >= i ? layer.color + "25" : "#1e2d3d",
                      boxShadow: isActive ? `0 0 0 1px ${layer.color}30, 0 0 20px ${layer.color}15` : undefined,
                    }}
                  >
                    <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 h-10"
                      style={{ background: isActive ? layer.color + "10" : "transparent" }}>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-full rounded-full" style={{ background: layer.color }} />
                        <span className="font-bold text-xs" style={{ color: isActive ? layer.color : "#94a3b8" }}>
                          {layer.layer}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono px-2 py-0.5 rounded-full border font-bold"
                          style={{ fontSize: 8, color: layer.color, borderColor: layer.color + "40", background: layer.color + "10" }}>
                          {layer.protocol}
                        </span>
                        <span className="text-slate-600 uppercase tracking-widest" style={{ fontSize: 8 }}>
                          PDU: {layer.pdu}
                        </span>
                      </div>
                    </div>
                    <div className="px-4 py-2">
                      <p className="font-mono text-xs leading-relaxed" style={{ color: isActive ? layer.color + "cc" : "#475569" }}>
                        {layer.info}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 glass-panel rounded-xl border border-white/5 flex items-center justify-center">
              <div className="text-center text-slate-600">
                <div className="text-sm mb-2">Select a user task to see the stack in action</div>
                <div className="text-xs">Each task selects different protocols at each layer</div>
              </div>
            </div>
          )}
        </div>

        {/* Right: TCP vs UDP comparison */}
        <div className="w-56 shrink-0 glass-panel rounded-xl border border-white/5 p-4 flex flex-col">
          <div className="text-slate-400 uppercase tracking-widest font-bold mb-4" style={{ fontSize: 9 }}>
            TCP vs UDP
          </div>
          {[
            { prop: "Handshake", tcp: "3-Way SYN", udp: "None" },
            { prop: "Reliability", tcp: "ACK+Retry", udp: "Best Effort" },
            { prop: "Ordering", tcp: "Guaranteed", udp: "None" },
            { prop: "Speed", tcp: "Slower", udp: "Fast" },
            { prop: "Use Case", tcp: "HTTP,SSH,FTP", udp: "VoIP,DNS,Game" },
          ].map(row => {
            const isTCP = selected?.transport === "TCP";
            const isUDP = selected?.transport === "UDP";
            return (
              <div key={row.prop} className="py-2 border-b border-white/3">
                <div className="text-slate-600 uppercase tracking-widest mb-1" style={{ fontSize: 7 }}>{row.prop}</div>
                <div className="flex gap-2">
                  <div className="flex-1 text-center py-0.5 rounded text-xs font-semibold"
                    style={{
                      background: isTCP ? "#8b5cf620" : "transparent",
                      color: isTCP ? "#a78bfa" : "#475569",
                    }}>
                    {row.tcp}
                  </div>
                  <div className="flex-1 text-center py-0.5 rounded text-xs font-semibold"
                    style={{
                      background: isUDP ? "#f9731620" : "transparent",
                      color: isUDP ? "#fb923c" : "#475569",
                    }}>
                    {row.udp}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SimulatorLayout>
  );
}
