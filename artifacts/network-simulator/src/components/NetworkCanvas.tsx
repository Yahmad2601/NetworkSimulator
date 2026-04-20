import { useRef, useState, useEffect, useCallback } from "react";
import { Shield, Server, Laptop, Router, Wifi, Camera } from "lucide-react";
import type { NetworkNode, NetworkEdge } from "../data/mockData";

interface Props {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  selectedNode: string | null;
  onSelectNode: (id: string | null) => void;
  scanning: boolean;
}

const NODE_RADIUS = 32;

function getNodeColor(node: NetworkNode) {
  if (node.status === "threat") return { border: "#ef4444", fill: "#1a0a0a", glow: "rgba(239,68,68,0.8)" };
  if (node.status === "warning") return { border: "#f59e0b", fill: "#0d0c08", glow: "rgba(245,158,11,0.6)" };
  if (node.status === "idle") return { border: "#334155", fill: "#0d1117", glow: "transparent" };
  return { border: "#06b6d4", fill: "#061820", glow: "rgba(6,182,212,0.6)" };
}

function NodeIcon({ type, color }: { type: NetworkNode["type"]; color: string }) {
  const props = { size: 18, color, strokeWidth: 1.5 };
  switch (type) {
    case "router": return <Router {...props} />;
    case "server": return <Server {...props} />;
    case "laptop": return <Laptop {...props} />;
    case "firewall": return <Shield {...props} />;
    case "switch": return <Wifi {...props} />;
    case "iot": return <Camera {...props} />;
  }
}

interface PacketState {
  edgeId: string;
  progress: number;
  id: string;
}

export default function NetworkCanvas({ nodes, edges, selectedNode, onSelectNode, scanning }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [packets, setPackets] = useState<PacketState[]>([]);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const getNode = useCallback((id: string) => nodes.find(n => n.id === id), [nodes]);

  useEffect(() => {
    const activeEdges = edges.filter(e => e.active);
    const initialPackets: PacketState[] = activeEdges.slice(0, 4).map((edge, i) => ({
      edgeId: edge.id,
      progress: (i * 0.25) % 1,
      id: `pkt-${edge.id}-${i}`,
    }));
    setPackets(initialPackets);
  }, [edges]);

  useEffect(() => {
    const speed = scanning ? 0.0018 : 0.0012;

    const animate = (time: number) => {
      const delta = time - lastTimeRef.current;
      lastTimeRef.current = time;

      setPackets(prev =>
        prev.map(pkt => ({
          ...pkt,
          progress: (pkt.progress + speed * Math.min(delta, 50)) % 1,
        }))
      );

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame((time) => {
      lastTimeRef.current = time;
      animFrameRef.current = requestAnimationFrame(animate);
    });

    return () => cancelAnimationFrame(animFrameRef.current);
  }, [scanning]);

  function getPacketPosition(edgeId: string, progress: number) {
    const edge = edges.find(e => e.id === edgeId);
    if (!edge) return null;
    const fromNode = getNode(edge.from);
    const toNode = getNode(edge.to);
    if (!fromNode || !toNode) return null;

    const x = fromNode.x + (toNode.x - fromNode.x) * progress;
    const y = fromNode.y + (toNode.y - fromNode.y) * progress;
    return { x, y };
  }

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden canvas-grid bg-[#0c1219]">
      {/* Scan overlay */}
      {scanning && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="scanning-overlay absolute inset-x-0 h-1 opacity-40"
            style={{
              background: "linear-gradient(to bottom, transparent, rgba(6,182,212,0.6), transparent)",
              top: 0,
              height: "60px",
            }}
          />
          <div className="absolute inset-0 border border-cyan-500/20 rounded-xl animate-pulse" />
        </div>
      )}

      {/* Node info tooltip */}
      {hoveredNode && (() => {
        const node = nodes.find(n => n.id === hoveredNode);
        if (!node) return null;
        const colors = getNodeColor(node);
        return (
          <div
            className="absolute z-20 pointer-events-none glass-panel rounded-lg p-3 border text-xs"
            style={{
              left: node.x + NODE_RADIUS + 12,
              top: node.y - 40,
              borderColor: colors.border + "50",
              minWidth: 180,
            }}
          >
            <div className="font-bold text-white mb-1" style={{ color: colors.border }}>{node.label}</div>
            <div className="text-slate-400 font-mono">{node.ip}</div>
            <div className="mt-2 grid grid-cols-2 gap-1">
              <div className="text-slate-500 uppercase tracking-widest" style={{ fontSize: 9 }}>IN</div>
              <div className="text-slate-500 uppercase tracking-widest" style={{ fontSize: 9 }}>OUT</div>
              <div className="text-cyan-400 font-mono">{node.packets_in.toLocaleString()}</div>
              <div className="text-teal-400 font-mono">{node.packets_out.toLocaleString()}</div>
            </div>
            <div
              className="mt-2 px-2 py-0.5 rounded-full inline-block uppercase tracking-widest font-bold"
              style={{
                fontSize: 9,
                background: colors.border + "20",
                color: colors.border,
              }}
            >
              {node.status}
            </div>
          </div>
        );
      })()}

      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 800 560"
        preserveAspectRatio="xMidYMid meet"
        onClick={() => onSelectNode(null)}
      >
        <defs>
          <filter id="glow-cyan">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-red">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-packet">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="edge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Connection lines */}
        {edges.map(edge => {
          const fromNode = getNode(edge.from);
          const toNode = getNode(edge.to);
          if (!fromNode || !toNode) return null;
          const isActive = edge.active;
          const isSelected = selectedNode === edge.from || selectedNode === edge.to;

          return (
            <g key={edge.id}>
              {/* Base line */}
              <line
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke={isActive ? "#06b6d4" : "#1e2d3d"}
                strokeWidth={isSelected ? 2 : 1}
                strokeOpacity={isActive ? (isSelected ? 0.8 : 0.25) : 0.12}
              />
              {/* Marching ants / flowing line */}
              {isActive && (
                <line
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke="#06b6d4"
                  strokeWidth={isSelected ? 2 : 1.5}
                  strokeOpacity={isSelected ? 0.9 : 0.5}
                  strokeDasharray="8 12"
                  style={{
                    animation: `dash-flow ${scanning ? "0.8s" : "1.4s"} linear infinite`,
                  }}
                />
              )}
              {/* Protocol label */}
              {isSelected && (
                <text
                  x={(fromNode.x + toNode.x) / 2}
                  y={(fromNode.y + toNode.y) / 2 - 8}
                  fill="#06b6d4"
                  fontSize="9"
                  textAnchor="middle"
                  fontFamily="monospace"
                  opacity="0.9"
                >
                  {edge.protocol} · {edge.bandwidth}
                </text>
              )}
            </g>
          );
        })}

        {/* Animated data packets */}
        {packets.map(pkt => {
          const pos = getPacketPosition(pkt.edgeId, pkt.progress);
          if (!pos) return null;
          const edge = edges.find(e => e.id === pkt.edgeId);
          const isThreated = edge?.from === "iot-1" || edge?.to === "iot-1";
          return (
            <circle
              key={pkt.id}
              cx={pos.x}
              cy={pos.y}
              r={isThreated ? 4 : 5}
              fill={isThreated ? "#ef4444" : "#06b6d4"}
              filter={isThreated ? "url(#glow-red)" : "url(#glow-packet)"}
              opacity={0.95}
            />
          );
        })}

        {/* Network nodes */}
        {nodes.map(node => {
          const colors = getNodeColor(node);
          const isHovered = hoveredNode === node.id;
          const isSelected = selectedNode === node.id;
          const scale = isHovered || isSelected ? 1.12 : 1;
          const r = NODE_RADIUS * scale;

          return (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y})`}
              style={{ cursor: "pointer", transition: "transform 0.2s" }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectNode(isSelected ? null : node.id);
              }}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              {/* Pulse ring for active nodes */}
              {node.status === "active" && (
                <circle
                  r={r + 6}
                  fill="none"
                  stroke={colors.border}
                  strokeWidth="1"
                  opacity="0"
                  style={{
                    animation: "node-pulse-ring 2.5s ease-out infinite",
                  }}
                />
              )}

              {/* Threat ring */}
              {node.status === "threat" && (
                <circle
                  r={r + 8}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="1"
                  style={{
                    animation: "threat-blink 1s ease-in-out infinite",
                  }}
                />
              )}

              {/* Background circle */}
              <circle
                r={r}
                fill={colors.fill}
                stroke={colors.border}
                strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1.5}
                filter={node.status === "threat" ? "url(#glow-red)" : "url(#glow-cyan)"}
                style={{ transition: "all 0.25s ease" }}
              />

              {/* Icon (SVG foreignObject for React icons) */}
              <foreignObject
                x={-12}
                y={-12}
                width={24}
                height={24}
                style={{ overflow: "visible" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 24,
                    height: 24,
                    pointerEvents: "none",
                  }}
                >
                  <NodeIcon
                    type={node.type}
                    color={
                      node.status === "threat"
                        ? "#ef4444"
                        : node.status === "warning"
                        ? "#f59e0b"
                        : node.status === "idle"
                        ? "#475569"
                        : "#06b6d4"
                    }
                  />
                </div>
              </foreignObject>

              {/* IP label pill */}
              <g transform={`translate(0, ${r + 14})`}>
                <rect
                  x={-36}
                  y={-10}
                  width={72}
                  height={18}
                  rx={9}
                  fill="#0c1219"
                  stroke={colors.border}
                  strokeWidth="0.8"
                  strokeOpacity="0.5"
                />
                <text
                  textAnchor="middle"
                  y={3}
                  fill={colors.border}
                  fontSize="8.5"
                  fontFamily="monospace"
                  opacity="0.9"
                >
                  {node.ip}
                </text>
              </g>

              {/* Node label */}
              <text
                textAnchor="middle"
                y={r + 36}
                fill="#94a3b8"
                fontSize="9"
                fontFamily="Inter, sans-serif"
                letterSpacing="0.05em"
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex items-center gap-4 glass-panel rounded-lg px-3 py-2 border border-white/5">
        {[
          { color: "#06b6d4", label: "Active" },
          { color: "#f59e0b", label: "Warning" },
          { color: "#ef4444", label: "Threat" },
          { color: "#475569", label: "Idle" },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-slate-500 uppercase tracking-widest" style={{ fontSize: 9 }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Packet counter */}
      <div className="absolute bottom-4 right-4 glass-panel rounded-lg px-3 py-2 border border-white/5">
        <span className="text-slate-500 uppercase tracking-widest" style={{ fontSize: 9 }}>
          Packets/s
        </span>
        <span className="ml-2 font-mono text-cyan-400 font-bold" style={{ fontSize: 11 }}>
          {scanning ? "8,412" : "3,247"}
        </span>
      </div>
    </div>
  );
}
