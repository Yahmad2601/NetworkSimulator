import { useEffect, useMemo, useState } from "react";
import { Hash, RefreshCw, ShieldCheck, ShieldAlert, Database, AlertTriangle, KeyRound } from "lucide-react";
import SimulatorLayout, { FooterControl } from "../../components/SimulatorLayout";
import { sha256Hex, combineWithSalt, randomSalt, bitDifference } from "../../lib/hashing";

const LAYER_COLOR = "#ec4899";
const COMMON_PASSWORDS = ["123456", "password", "qwerty", "letmein", "admin"];

// Render a hash, highlighting characters that differ from a reference hash —
// a direct visual of the avalanche effect.
function HashChars({ hash, other }: { hash: string; other: string }) {
  if (!hash) return <span className="text-slate-600">computing…</span>;
  return (
    <span className="break-all">
      {hash.split("").map((c, i) => {
        const differs = other && other[i] !== c;
        return (
          <span key={i} style={{ color: differs ? LAYER_COLOR : "#64748b" }}>
            {c}
          </span>
        );
      })}
    </span>
  );
}

export default function HashingSalting() {
  const [passwordA, setPasswordA] = useState("password");
  const [passwordB, setPasswordB] = useState("password");
  const [salted, setSalted] = useState(false);
  const [saltA, setSaltA] = useState(() => randomSalt());
  const [saltB, setSaltB] = useState(() => randomSalt());

  const [hashA, setHashA] = useState("");
  const [hashB, setHashB] = useState("");
  const [rainbow, setRainbow] = useState<Map<string, string>>(new Map());

  const inputA = salted ? combineWithSalt(saltA, passwordA) : passwordA;
  const inputB = salted ? combineWithSalt(saltB, passwordB) : passwordB;

  // Compute both stored hashes whenever the inputs change.
  useEffect(() => {
    let active = true;
    Promise.all([sha256Hex(inputA), sha256Hex(inputB)]).then(([ha, hb]) => {
      if (active) {
        setHashA(ha);
        setHashB(hb);
      }
    });
    return () => {
      active = false;
    };
  }, [inputA, inputB]);

  // Precompute the attacker's rainbow table (unsalted hashes of common passwords).
  useEffect(() => {
    let active = true;
    Promise.all(
      COMMON_PASSWORDS.map(async (p) => [await sha256Hex(p), p] as const),
    ).then((entries) => {
      if (active) setRainbow(new Map(entries));
    });
    return () => {
      active = false;
    };
  }, []);

  const crackedA = rainbow.get(hashA);
  const crackedB = rainbow.get(hashB);
  const identical = Boolean(hashA) && hashA === hashB;
  const diff = useMemo(() => bitDifference(hashA, hashB), [hashA, hashB]);

  const verdict = !hashA
    ? { label: "…", color: "#475569" }
    : identical
      ? { label: "Identical", color: "#ef4444" }
      : { label: "Unique", color: "#22c55e" };

  const reset = () => {
    setPasswordA("password");
    setPasswordB("password");
    setSalted(false);
    setSaltA(randomSalt());
    setSaltB(randomSalt());
  };

  const footerControls: FooterControl[] = [
    {
      key: "salt",
      type: "toggle",
      label: "Per-user Salt",
      value: salted,
      onChange: (v) => setSalted(v as boolean),
      icon: <KeyRound size={12} />,
    },
    { key: "sp1", type: "spacer" },
    {
      key: "regen",
      type: "button",
      label: "Regenerate Salts",
      variant: "cyan",
      icon: <RefreshCw size={12} />,
      onClick: () => {
        setSaltA(randomSalt());
        setSaltB(randomSalt());
      },
      disabled: !salted,
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

  const sidebar = (
    <div className="flex flex-col h-full overflow-y-auto logs-scroll p-3 gap-3">
      {/* Rainbow table */}
      <div className="glass-panel border border-white/10 bg-[#141b24] p-3 rounded-xl shrink-0">
        <div className="flex items-center gap-1.5 mb-2">
          <Database size={12} className="text-[#ef4444]" />
          <span className="text-[10px] uppercase tracking-widest font-bold text-[#ef4444]">
            Attacker's Rainbow Table
          </span>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed mb-2">
          Precomputed SHA-256 of common passwords. A plain hash can be reversed by a
          simple lookup; a salt makes every stored hash unique, so this table no longer matches.
        </p>
        <div className="flex flex-col gap-1">
          {COMMON_PASSWORDS.map((p) => (
            <div
              key={p}
              className="flex items-center justify-between text-[10px] font-mono bg-[#0c1219] border border-white/5 rounded px-2 py-1"
            >
              <span className="text-slate-300">{p}</span>
              <span className="text-slate-600">
                {[...rainbow.entries()].find(([, pw]) => pw === p)?.[0].slice(0, 8) ?? "…"}…
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Production note */}
      <div className="glass-panel border border-amber-500/20 bg-amber-500/5 p-3 rounded-xl shrink-0">
        <div className="flex items-center gap-1.5 mb-1.5">
          <AlertTriangle size={12} className="text-amber-400" />
          <span className="text-[10px] uppercase tracking-widest font-bold text-amber-400">
            In Production
          </span>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          SHA-256 is fast — great for integrity, bad for passwords. Real systems use a
          deliberately <span className="font-bold text-amber-300">slow</span> key-derivation
          function — <span className="font-mono">bcrypt</span>, <span className="font-mono">scrypt</span>,
          or <span className="font-mono">Argon2</span> — with a per-user salt, so brute-forcing
          billions of guesses becomes infeasibly expensive.
        </p>
      </div>
    </div>
  );

  return (
    <SimulatorLayout
      title="Hashing & Salting"
      subtitle="Why a Salt Defeats Rainbow Tables"
      layerBadge="HASH"
      layerColor={LAYER_COLOR}
      footerControls={footerControls}
      sidebar={sidebar}
    >
      <div className="h-full flex flex-col p-4 select-none overflow-hidden text-slate-400 bg-[#0a0e14]">
        {/* Status metrics */}
        <div className="grid grid-cols-3 gap-3 shrink-0 mb-3">
          {[
            { label: "ALGORITHM", value: "SHA-256", color: LAYER_COLOR },
            { label: "SALT", value: salted ? "On" : "Off", color: salted ? "#22c55e" : "#475569" },
            { label: "HASHES", value: verdict.label, color: verdict.color },
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

        {/* Two users + verdict, vertically centred in the remaining space */}
        <div className="flex-1 flex flex-col justify-center gap-4 min-h-0">
        <div className="grid grid-cols-2 gap-3 shrink-0">
          {[
            { name: "User A", pw: passwordA, set: setPasswordA, salt: saltA, hash: hashA, other: hashB, cracked: crackedA },
            { name: "User B", pw: passwordB, set: setPasswordB, salt: saltB, hash: hashB, other: hashA, cracked: crackedB },
          ].map((u) => (
            <div key={u.name} className="glass-panel border border-white/5 bg-[#141b24] p-4 rounded-xl shadow-lg flex flex-col gap-3">
              <div className="flex items-center gap-2 text-white border-b border-white/5 pb-2">
                <Hash size={15} style={{ color: LAYER_COLOR }} />
                <span className="text-[11px] uppercase tracking-widest font-bold">{u.name}</span>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase tracking-widest text-slate-500">Password</label>
                <input
                  type="text"
                  value={u.pw}
                  onChange={(e) => u.set(e.target.value)}
                  className="bg-[#0c1219] border border-white/10 focus:border-[#ec4899] rounded p-2 text-white font-mono text-sm outline-none transition-colors w-full"
                />
              </div>

              {salted && (
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] uppercase tracking-widest text-slate-500">Salt (random, per user)</span>
                  <div className="text-[11px] font-mono text-cyan-400 bg-[#0c1219] border border-white/5 rounded px-2 py-1 break-all">
                    {u.salt}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <span className="text-[9px] uppercase tracking-widest text-slate-500">
                  Hashed input{salted ? " (salt + password)" : ""}
                </span>
                <div className="text-[10px] font-mono text-slate-400 bg-[#0c1219] border border-white/5 rounded px-2 py-1 break-all">
                  {salted ? `${u.salt}${u.pw}` : u.pw || "∅"}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[9px] uppercase tracking-widest text-slate-500">SHA-256 digest</span>
                <div className="text-[12px] font-mono leading-relaxed bg-[#0c1219] border border-white/5 rounded px-2 py-2 min-h-[3rem]">
                  <HashChars hash={u.hash} other={u.other} />
                </div>
              </div>

              {u.cracked ? (
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 rounded px-2 py-1.5">
                  <ShieldAlert size={12} />
                  Cracked — found in rainbow table
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-teal-400 bg-teal-500/10 border border-teal-500/20 rounded px-2 py-1.5">
                  <ShieldCheck size={12} />
                  Not in rainbow table
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Comparison verdict */}
        <div className="flex items-center justify-center">
          <div
            className="w-full max-w-2xl rounded-xl border p-4 text-center transition-colors duration-300"
            style={{
              background: `${verdict.color}10`,
              borderColor: `${verdict.color}40`,
            }}
          >
            <div className="text-sm font-bold mb-1" style={{ color: verdict.color }}>
              {!hashA
                ? "Computing…"
                : identical
                  ? "⚠ Identical hashes — the password is leaked"
                  : "✓ Unique hashes"}
            </div>
            <p className="text-[12px] text-slate-400 leading-relaxed mb-3">
              {!hashA
                ? ""
                : identical
                  ? "Both users hash to the exact same digest, so an attacker instantly knows they share a password — and a rainbow-table lookup reveals it. Turn on per-user salt to fix this."
                  : "Even identical passwords now produce completely different digests, because each user's unique salt is mixed in before hashing."}
            </p>
            <div className="flex items-center gap-3">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 shrink-0">
                Bits differing
              </span>
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${diff.percent}%`, background: verdict.color }}
                />
              </div>
              <span className="text-[11px] font-mono font-bold shrink-0" style={{ color: verdict.color }}>
                {diff.percent.toFixed(0)}% ({diff.differingBits}/{diff.totalBits})
              </span>
            </div>
          </div>
        </div>
        </div>
      </div>
    </SimulatorLayout>
  );
}
