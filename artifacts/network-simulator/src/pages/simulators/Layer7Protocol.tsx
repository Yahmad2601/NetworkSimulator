import { useState } from "react";
import { RefreshCw, Globe, Mail, Folder, Search, MessageSquare, Video } from "lucide-react";
import SimulatorLayout, { FooterControl } from "../../components/SimulatorLayout";

interface UserAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  protocol: string;
  port: number;
  method: string;
  color: string;
  description: string;
  request: string;
  response: string;
}

const ACTIONS: UserAction[] = [
  {
    id: "browse",
    label: "Visit Website",
    icon: <Globe size={16} />,
    protocol: "HTTP/1.1",
    port: 80,
    method: "GET",
    color: "#06b6d4",
    description: "Browser sends an HTTP GET request to fetch the webpage HTML.",
    request: `GET /index.html HTTP/1.1\nHost: example.com\nUser-Agent: Chrome/120\nAccept: text/html`,
    response: `HTTP/1.1 200 OK\nContent-Type: text/html\nContent-Length: 4823\n\n<html>...</html>`,
  },
  {
    id: "send-email",
    label: "Send Email",
    icon: <Mail size={16} />,
    protocol: "SMTP",
    port: 587,
    method: "MAIL FROM",
    color: "#10b981",
    description: "Email client speaks SMTP to relay the message via the mail server.",
    request: `EHLO client.local\nMAIL FROM:<user@corp.com>\nRCPT TO:<boss@corp.com>\nDATA\nSubject: Q2 Report\n\nPlease find attached...\n.`,
    response: `220 mail.corp.com ESMTP\n250 OK\n250 Accepted\n354 Start mail input\n250 Message queued`,
  },
  {
    id: "download",
    label: "Download File",
    icon: <Folder size={16} />,
    protocol: "FTP",
    port: 21,
    method: "RETR",
    color: "#f97316",
    description: "FTP protocol negotiates a control channel then opens a data channel for transfer.",
    request: `USER ftpuser\nPASS ••••••\nPASV\nRETR /files/report.pdf`,
    response: `331 Password required\n230 Login OK\n227 Entering Passive Mode (192,168,1,10)\n226 Transfer complete`,
  },
  {
    id: "dns",
    label: "Resolve Domain",
    icon: <Search size={16} />,
    protocol: "DNS",
    port: 53,
    method: "Query",
    color: "#a855f7",
    description: "OS sends a UDP DNS query to the resolver to map a hostname to an IP address.",
    request: `DNS Query (UDP)\nType: A\nName: api.example.com\nID: 0x4A2F`,
    response: `DNS Response\nType: A\nTTL: 300s\nAnswer: 203.0.113.42`,
  },
  {
    id: "chat",
    label: "Send Chat Message",
    icon: <MessageSquare size={16} />,
    protocol: "WebSocket",
    port: 443,
    method: "WS SEND",
    color: "#ec4899",
    description: "WebSocket maintains a persistent bi-directional channel over a single TCP connection.",
    request: `WS FRAME\nopcode: text\nPayload: {"type":"msg","body":"Hello!","ts":1745145600}`,
    response: `WS FRAME\nopcode: text\nPayload: {"type":"ack","id":"msg_42","delivered":true}`,
  },
  {
    id: "video",
    label: "Stream Video",
    icon: <Video size={16} />,
    protocol: "RTSP / HLS",
    port: 554,
    method: "PLAY",
    color: "#f59e0b",
    description: "RTSP negotiates the stream, then RTP/UDP carries the time-sensitive video frames.",
    request: `RTSP/1.0 PLAY\nSession: 12345\nRange: npt=0-\nCSeq: 4`,
    response: `RTSP/1.0 200 OK\nSession: 12345\nRTP-Info: seq=0;rtptime=0\n\n[RTP frames flowing...]`,
  },
];

export default function Layer7Protocol() {
  const [selected, setSelected] = useState<UserAction | null>(null);
  const [log, setLog] = useState<{ action: UserAction; ts: string }[]>([]);

  const handleAction = (action: UserAction) => {
    setSelected(action);
    const now = new Date();
    const ts = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
    setLog(prev => [...prev.slice(-10), { action, ts }]);
  };

  const reset = () => { setSelected(null); setLog([]); };

  const footerControls: FooterControl[] = [
    {
      key: "proto", type: "stat",
      stat: {
        label: "Active Protocol",
        value: selected ? selected.protocol : "—",
        color: selected ? selected.color : "#475569",
      },
    },
    {
      key: "port", type: "stat",
      stat: {
        label: "Port",
        value: selected ? String(selected.port) : "—",
        color: selected ? selected.color : "#475569",
      },
    },
    { key: "sp", type: "spacer" },
    {
      key: "interactions", type: "stat",
      stat: { label: "Interactions", value: String(log.length), color: "#14b8a6" },
    },
    { key: "reset", type: "button", label: "Reset", variant: "danger", icon: <RefreshCw size={12} />, onClick: reset },
  ];

  return (
    <SimulatorLayout
      title="Layer 7 Protocol Simulator"
      subtitle="Application Layer · Human → Protocol"
      layerBadge="L7"
      layerColor="#14b8a6"
      footerControls={footerControls}
    >
      <div className="h-full flex gap-4 p-4 overflow-hidden">
        {/* Left: User actions */}
        <div className="w-52 shrink-0 flex flex-col gap-2">
          <div className="text-slate-400 uppercase tracking-widest font-bold mb-1" style={{ fontSize: 9 }}>
            User Actions
          </div>
          {ACTIONS.map(action => (
            <button
              key={action.id}
              onClick={() => handleAction(action)}
              className="flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-left hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: selected?.id === action.id ? action.color + "15" : "#141b24",
                borderColor: selected?.id === action.id ? action.color + "50" : "rgba(255,255,255,0.05)",
              }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: action.color + "20", color: action.color }}
              >
                {action.icon}
              </div>
              <span className="text-sm font-semibold text-slate-300">{action.label}</span>
            </button>
          ))}
        </div>

        {/* Center: Protocol detail */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {selected ? (
            <>
              <div className="glass-panel rounded-xl border border-white/5 p-4 shrink-0">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: selected.color + "20", color: selected.color }}
                  >
                    {selected.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-sm">{selected.protocol}</span>
                      <span className="font-mono px-2 py-0.5 rounded-full border text-xs font-bold"
                        style={{ color: selected.color, borderColor: selected.color + "40", background: selected.color + "10" }}>
                        Port {selected.port}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs mt-1">{selected.description}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 flex-1">
                <div className="flex-1 glass-panel rounded-xl border border-white/5 p-4 flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full" style={{ background: selected.color }} />
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: selected.color }}>
                      Request → Server
                    </span>
                  </div>
                  <pre className="font-mono text-xs text-slate-300 leading-relaxed flex-1 whitespace-pre-wrap">
                    {selected.request}
                  </pre>
                </div>
                <div className="flex-1 glass-panel rounded-xl border border-white/5 p-4 flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-teal-400" />
                    <span className="text-xs font-bold uppercase tracking-widest text-teal-400">
                      Response ← Server
                    </span>
                  </div>
                  <pre className="font-mono text-xs text-slate-300 leading-relaxed flex-1 whitespace-pre-wrap">
                    {selected.response}
                  </pre>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-slate-600">
                <Globe size={32} className="mx-auto mb-3 opacity-30" />
                <div className="text-sm">Select a user action to see Layer 7 in action</div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Log */}
        <div className="w-52 shrink-0 glass-panel rounded-xl border border-white/5 flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b border-white/5">
            <span className="text-slate-400 uppercase tracking-widest font-bold" style={{ fontSize: 9 }}>Activity Log</span>
          </div>
          <div className="flex-1 overflow-y-auto logs-scroll px-2 py-2 space-y-1">
            {log.length === 0 && (
              <div className="text-slate-600 text-center py-4 text-xs">No activity yet</div>
            )}
            {log.map((entry, i) => (
              <div key={i} className="flex items-start gap-2 py-1.5 px-2 rounded-md hover:bg-white/3">
                <span className="font-mono text-slate-600" style={{ fontSize: 8 }}>{entry.ts}</span>
                <div>
                  <div className="font-mono font-bold" style={{ fontSize: 9, color: entry.action.color }}>
                    {entry.action.protocol}
                  </div>
                  <div className="text-slate-500" style={{ fontSize: 9 }}>{entry.action.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SimulatorLayout>
  );
}
