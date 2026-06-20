import { useMemo, useState } from "react";
import { Database, ShieldCheck, ShieldAlert, KeyRound, RefreshCw, Lock } from "lucide-react";
import SimulatorLayout, { FooterControl } from "../../components/SimulatorLayout";
import { evaluateLogin, detectInjection, DEMO_USERS, PARAM_QUERY } from "../../lib/sqli";

const LAYER_COLOR = "#f97316";

const PRESETS = [
  { label: "Valid login", user: "admin", pass: "S3cr3t!" },
  { label: "Wrong password", user: "admin", pass: "guess123" },
  { label: "Tautology injection", user: "' OR '1'='1' --", pass: "" },
  { label: "Comment-out injection", user: "admin'--", pass: "anything" },
];

export default function SQLInjection() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("S3cr3t!");
  const [parameterized, setParameterized] = useState(false);

  const result = useMemo(
    () => evaluateLogin(username, password, parameterized),
    [username, password, parameterized],
  );
  const userInjected = !parameterized && detectInjection(username);
  const passInjected = !parameterized && detectInjection(password);

  const reset = () => {
    setUsername("admin");
    setPassword("S3cr3t!");
    setParameterized(false);
  };

  const footerControls: FooterControl[] = [
    {
      key: "param",
      type: "toggle",
      label: "Parameterized Query",
      value: parameterized,
      onChange: (v) => setParameterized(v as boolean),
      icon: <Lock size={12} />,
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

  const sidebar = (
    <div className="flex flex-col h-full overflow-y-auto logs-scroll p-3 gap-3">
      <div className="glass-panel border border-white/10 bg-[#141b24] p-3 rounded-xl shrink-0">
        <div className="text-[10px] uppercase tracking-widest font-bold mb-2" style={{ color: LAYER_COLOR }}>
          What's Happening
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          The app pastes your input straight into the SQL string. Typing{" "}
          <span className="font-mono text-red-300">' OR '1'='1' --</span> closes the username quote, adds an
          always-true condition, and comments out the password check — so the database returns every row and
          you're logged in as the first user.
        </p>
      </div>
      <div className="glass-panel border border-green-500/20 bg-green-500/5 p-3 rounded-xl shrink-0">
        <div className="flex items-center gap-1.5 mb-1.5">
          <ShieldCheck size={12} className="text-green-400" />
          <span className="text-[10px] uppercase tracking-widest font-bold text-green-400">The Fix</span>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          A <span className="font-bold">parameterized query</span> sends the SQL and the data separately, so
          input is always treated as a literal value — never as code. Add least-privilege DB accounts and input
          validation for defense in depth.
        </p>
      </div>
      <div className="glass-panel border border-white/10 bg-[#141b24] p-3 rounded-xl shrink-0">
        <div className="text-[10px] uppercase tracking-widest font-bold mb-2 text-slate-400">users table</div>
        <div className="flex flex-col gap-1 text-[10px] font-mono">
          {DEMO_USERS.map((u) => (
            <div key={u.username} className="flex justify-between bg-[#0c1219] border border-white/5 rounded px-2 py-1">
              <span className="text-slate-300">{u.username}</span>
              <span className="text-slate-600">{u.password}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <SimulatorLayout
      title="SQL Injection"
      subtitle="Breaking Out of the Data Context"
      layerBadge="SEC"
      layerColor={LAYER_COLOR}
      footerControls={footerControls}
      sidebar={sidebar}
    >
      <div className="h-full flex flex-col p-4 select-none overflow-y-auto logs-scroll text-slate-400 bg-[#0a0e14]">
        {/* Status metrics */}
        <div className="grid grid-cols-3 gap-3 shrink-0 mb-3">
          {[
            { label: "MODE", value: parameterized ? "Parameterized" : "Vulnerable", color: parameterized ? "#22c55e" : "#ef4444" },
            { label: "INJECTION", value: result.injected ? "Detected" : "None", color: result.injected ? "#ef4444" : "#64748b" },
            { label: "ACCESS", value: result.authenticated ? "Granted" : "Denied", color: result.authenticated ? (result.injected ? "#ef4444" : "#22c55e") : "#64748b" },
          ].map((item) => (
            <div key={item.label} className="glass-panel border border-white/5 bg-[#141b24] p-3 rounded-xl shadow-lg flex flex-col items-center">
              <div className="text-[10px] uppercase tracking-widest mb-1">{item.label}</div>
              <div className="font-mono font-bold text-base" style={{ color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-2 shrink-0 mb-3">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => {
                setUsername(p.user);
                setPassword(p.pass);
              }}
              className="px-3 py-1.5 rounded-lg border border-white/8 bg-[#141b24] text-[11px] text-slate-300 hover:border-white/20 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Login form */}
          <div className="glass-panel border border-white/5 bg-[#141b24] p-4 rounded-xl flex flex-col gap-3">
            <div className="flex items-center gap-2 text-white border-b border-white/5 pb-2">
              <KeyRound size={15} style={{ color: LAYER_COLOR }} />
              <span className="text-[11px] uppercase tracking-widest font-bold">Login Form</span>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase tracking-widest text-slate-500">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`bg-[#0c1219] border rounded p-2 text-white font-mono text-sm outline-none transition-colors ${userInjected ? "border-red-500" : "border-white/10 focus:border-[#f97316]"}`}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase tracking-widest text-slate-500">Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`bg-[#0c1219] border rounded p-2 text-white font-mono text-sm outline-none transition-colors ${passInjected ? "border-red-500" : "border-white/10 focus:border-[#f97316]"}`}
              />
            </div>
            <div
              className="mt-1 rounded-lg p-3 flex items-center gap-2 text-sm font-bold"
              style={{
                background: result.authenticated ? (result.injected ? "#ef444415" : "#22c55e15") : "#0c1219",
                border: `1px solid ${result.authenticated ? (result.injected ? "#ef4444" : "#22c55e") : "rgba(255,255,255,0.08)"}40`,
                color: result.authenticated ? (result.injected ? "#ef4444" : "#22c55e") : "#64748b",
              }}
            >
              {result.authenticated ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
              {result.authenticated
                ? result.injected
                  ? `Access bypassed — logged in as ${result.matchedUser}`
                  : `Welcome, ${result.matchedUser}`
                : "Access denied — invalid credentials"}
            </div>
          </div>

          {/* Query + DB */}
          <div className="flex flex-col gap-4">
            <div className="glass-panel border border-white/5 bg-[#141b24] p-4 rounded-xl">
              <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">
                Query sent to the database
              </div>
              {parameterized ? (
                <div className="flex flex-col gap-2">
                  <code className="text-[12px] font-mono text-slate-200 bg-[#0c1219] border border-white/5 rounded p-2 block break-all">
                    {PARAM_QUERY}
                  </code>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "param 1 (username)", value: username },
                      { label: "param 2 (password)", value: password },
                    ].map((b) => (
                      <div key={b.label} className="rounded border border-green-500/30 bg-green-500/5 p-2">
                        <div className="text-[8px] uppercase tracking-widest text-green-400">{b.label}</div>
                        <div className="text-[11px] font-mono text-green-300 break-all">"{b.value}"</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-green-400/80">Bound as literal data — never parsed as SQL.</p>
                </div>
              ) : (
                <code className="text-[12px] font-mono leading-relaxed bg-[#0c1219] border border-white/5 rounded p-2 block break-all">
                  <span className="text-cyan-400">SELECT </span>
                  <span className="text-slate-400">* </span>
                  <span className="text-cyan-400">FROM </span>
                  <span className="text-slate-300">users </span>
                  <span className="text-cyan-400">WHERE </span>
                  <span className="text-slate-300">username=</span>
                  <span className="text-slate-500">'</span>
                  <span style={{ color: userInjected ? "#ef4444" : "#f59e0b", fontWeight: 700 }}>{username}</span>
                  <span className="text-slate-500">'</span>
                  <span className="text-cyan-400"> AND </span>
                  <span className="text-slate-300">password=</span>
                  <span className="text-slate-500">'</span>
                  <span style={{ color: passInjected ? "#ef4444" : "#f59e0b", fontWeight: 700 }}>{password}</span>
                  <span className="text-slate-500">'</span>
                </code>
              )}
              {result.injected && (
                <p className="text-[10px] text-red-400 mt-2">
                  ⚠ The input broke out of the quoted string and changed the query's logic.
                </p>
              )}
            </div>

            <div className="glass-panel border border-white/5 bg-[#141b24] p-4 rounded-xl flex items-center gap-3">
              <Database size={18} style={{ color: result.rowsReturned > 0 ? (result.injected ? "#ef4444" : "#22c55e") : "#64748b" }} />
              <div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500">Database response</div>
                <div className="font-mono font-bold" style={{ color: result.rowsReturned > 0 ? (result.injected ? "#ef4444" : "#22c55e") : "#64748b" }}>
                  {result.rowsReturned} row(s) returned
                  {result.injected && result.rowsReturned === DEMO_USERS.length && " — entire users table!"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SimulatorLayout>
  );
}
