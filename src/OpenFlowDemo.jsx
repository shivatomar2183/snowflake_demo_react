import { useState, useEffect, useRef } from "react";

const COLORS = {
  snow: "#1A1F3C",
  snowLight: "#232849",
  ice: "#29B5E8",
  iceGlow: "#00D4FF",
  frost: "#0A0E24",
  white: "#F0F4FF",
  muted: "#8892B0",
  success: "#00E5A0",
  warning: "#FFB347",
  danger: "#FF4D6A",
  purple: "#9B6DFF",
};

const SOURCES = [
  { id: "erp", label: "SAP ERP", icon: "🏭", color: "#FF6B35", type: "ERP System" },
  { id: "iot", label: "IoT Sensors", icon: "📡", color: "#00E5A0", type: "Real-time Stream" },
  { id: "supplier", label: "Supplier APIs", icon: "🚚", color: "#29B5E8", type: "REST API" },
  { id: "wms", label: "Warehouse WMS", icon: "📦", color: "#9B6DFF", type: "Database CDC" },
  { id: "pos", label: "POS / Orders", icon: "🛒", color: "#FFB347", type: "Event Stream" },
  { id: "weather", label: "Weather Data", icon: "🌦", color: "#FF4D6A", type: "External Feed" },
];

const PROCESSORS = [
  { id: "validate", label: "Data Validation", icon: "✅", desc: "Schema + quality checks" },
  { id: "enrich", label: "Enrichment", icon: "⚡", desc: "Lookup & join supplier master" },
  { id: "transform", label: "Transform", icon: "🔄", desc: "Normalize, dedupe, flatten" },
  { id: "cdc", label: "CDC Capture", icon: "📊", desc: "Change data capture streams" },
];

const DESTINATIONS = [
  { id: "raw", label: "Raw Zone", icon: "🗄", color: "#8892B0", desc: "Iceberg tables" },
  { id: "stream", label: "Snowflake Stream", icon: "⚡", color: "#29B5E8", desc: "CDC offsets" },
  { id: "dynamic", label: "Dynamic Tables", icon: "🔄", color: "#00E5A0", desc: "Auto-refresh" },
  { id: "cortex", label: "Cortex AI", icon: "🧠", color: "#9B6DFF", desc: "Anomaly detection" },
];

const EVENTS = [
  { source: "iot", msg: "Temp alert: Warehouse B — 2.3°C above threshold", severity: "warning", ts: 0 },
  { source: "supplier", msg: "Supplier APAC-04 shipment delayed 3 days", severity: "danger", ts: 1200 },
  { source: "pos", msg: "Demand spike: SKU-7821 orders +340% in 2h", severity: "warning", ts: 2400 },
  { source: "wms", msg: "Stock level critical: SKU-7821 → 48 units remain", severity: "danger", ts: 3600 },
  { source: "erp", msg: "Auto PO raised: 5,000 units to Supplier US-02", severity: "success", ts: 4800 },
  { source: "weather", msg: "Storm forecast: rerouting 3 shipments via rail", severity: "warning", ts: 6000 },
  { source: "iot", msg: "Cold chain integrity restored: Warehouse B nominal", severity: "success", ts: 7200 },
];

function Pill({ color, children }) {
  return (
    <span style={{
      background: color + "22", color, border: `1px solid ${color}44`,
      borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600,
    }}>{children}</span>
  );
}

function AnimatedPacket({ active, from, to, color }) {
  const [pos, setPos] = useState(0);
  useEffect(() => {
    if (!active) { setPos(0); return; }
    let raf, start;
    const animate = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 1200, 1);
      setPos(p);
      if (p < 1) raf = requestAnimationFrame(animate);
      else setPos(0);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [active]);
  return null;
}

function FlowLine({ active, color }) {
  return (
    <div style={{ position: "relative", width: "100%", height: 3, background: "#ffffff11", borderRadius: 2, overflow: "visible" }}>
      <div style={{
        position: "absolute", top: 0, left: 0, height: "100%",
        width: active ? "100%" : "0%",
        background: `linear-gradient(90deg, transparent, ${color}, ${color})`,
        borderRadius: 2,
        transition: active ? "width 0.8s ease" : "width 0.2s ease",
        boxShadow: active ? `0 0 8px ${color}` : "none",
      }} />
      {active && (
        <div style={{
          position: "absolute", top: -4, right: 0, width: 10, height: 10,
          borderRadius: "50%", background: color,
          boxShadow: `0 0 12px ${color}`,
          animation: "pulse 1s infinite",
        }} />
      )}
    </div>
  );
}

export default function OpenFlowDemo() {
  const [running, setRunning] = useState(false);
  const [activeSource, setActiveSource] = useState(null);
  const [activeProc, setActiveProc] = useState(null);
  const [activeDest, setActiveDest] = useState(null);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ records: 0, latency: 0, errors: 0, throughput: 0 });
  const [tick, setTick] = useState(0);
  const [phase, setPhase] = useState("idle");
  const intervalRef = useRef(null);
  const eventRef = useRef(0);

  const startFlow = () => {
    setRunning(true);
    setEvents([]);
    setStats({ records: 0, latency: 0, errors: 0, throughput: 0 });
    eventRef.current = 0;
    let t = 0;

    intervalRef.current = setInterval(() => {
      t++;
      setTick(t);

      const src = SOURCES[t % SOURCES.length];
      const proc = PROCESSORS[Math.floor(t / 2) % PROCESSORS.length];
      const dest = DESTINATIONS[Math.floor(t / 3) % DESTINATIONS.length];

      setActiveSource(src.id);
      setTimeout(() => setActiveProc(proc.id), 400);
      setTimeout(() => setActiveDest(dest.id), 800);
      setTimeout(() => { setActiveSource(null); setActiveProc(null); setActiveDest(null); }, 1100);

      setStats(s => ({
        records: s.records + Math.floor(Math.random() * 1200 + 400),
        latency: Math.floor(Math.random() * 80 + 40),
        errors: s.errors + (Math.random() > 0.92 ? 1 : 0),
        throughput: Math.floor(Math.random() * 8000 + 4000),
      }));

      const nextEvent = EVENTS[eventRef.current % EVENTS.length];
      if (t % 3 === 0) {
        setEvents(ev => [{ ...nextEvent, id: t }, ...ev].slice(0, 8));
        eventRef.current++;
      }
    }, 1200);
  };

  const stopFlow = () => {
    setRunning(false);
    clearInterval(intervalRef.current);
    setActiveSource(null); setActiveProc(null); setActiveDest(null);
  };

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const srcColor = activeSource ? SOURCES.find(s => s.id === activeSource)?.color : COLORS.ice;

  return (
    <div style={{
      minHeight: "100vh", background: COLORS.frost, fontFamily: "'Inter', 'SF Pro', sans-serif",
      color: COLORS.white, padding: "24px 20px",
    }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(1.3)} }
        @keyframes flow { 0%{background-position:0 0} 100%{background-position:40px 0} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glow { 0%,100%{box-shadow:0 0 8px #29B5E844} 50%{box-shadow:0 0 20px #29B5E8aa} }
        .src-card:hover { transform: translateY(-2px); transition: transform 0.2s; }
        .proc-card { transition: all 0.3s; }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: COLORS.ice, textTransform: "uppercase", marginBottom: 6 }}>
          Snowflake OpenFlow · Apache NiFi Engine
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>
          Supply Chain Data Ingestion Pipeline
        </h1>
        <p style={{ color: COLORS.muted, fontSize: 13, marginTop: 6 }}>
          Real-time multi-source ingestion → transformation → Snowflake
        </p>
      </div>

      {/* Stats Bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Records Ingested", value: stats.records.toLocaleString(), color: COLORS.ice, suffix: "" },
          { label: "Avg Latency", value: running ? stats.latency : "—", color: COLORS.success, suffix: running ? "ms" : "" },
          { label: "Throughput", value: running ? stats.throughput.toLocaleString() : "—", color: COLORS.purple, suffix: running ? "/s" : "" },
          { label: "Errors Caught", value: stats.errors, color: stats.errors > 0 ? COLORS.warning : COLORS.success, suffix: "" },
        ].map(s => (
          <div key={s.label} style={{
            background: COLORS.snowLight, borderRadius: 10, padding: "14px 16px",
            border: `1px solid ${s.color}33`,
            animation: running ? "glow 2s infinite" : "none",
          }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}<span style={{ fontSize: 13 }}>{s.suffix}</span></div>
            <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Main Pipeline */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 32px 1fr 32px 1fr", gap: 0, alignItems: "center", marginBottom: 20 }}>

        {/* Sources */}
        <div style={{ background: COLORS.snowLight, borderRadius: 12, padding: 14, border: "1px solid #ffffff11" }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.muted, textTransform: "uppercase", marginBottom: 10 }}>
            📥 Data Sources
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {SOURCES.map(src => (
              <div key={src.id} className="src-card" style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 10px", borderRadius: 8,
                background: activeSource === src.id ? src.color + "22" : "#ffffff08",
                border: `1px solid ${activeSource === src.id ? src.color : "#ffffff11"}`,
                transition: "all 0.3s",
                boxShadow: activeSource === src.id ? `0 0 12px ${src.color}44` : "none",
              }}>
                <span style={{ fontSize: 16 }}>{src.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: activeSource === src.id ? src.color : COLORS.white }}>{src.label}</div>
                  <div style={{ fontSize: 10, color: COLORS.muted }}>{src.type}</div>
                </div>
                {activeSource === src.id && (
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: src.color, animation: "pulse 0.8s infinite" }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Arrow 1 */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <FlowLine active={!!activeSource} color={srcColor} />
        </div>

        {/* Processors */}
        <div style={{ background: COLORS.snowLight, borderRadius: 12, padding: 14, border: `1px solid ${COLORS.ice}33` }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.muted, textTransform: "uppercase", marginBottom: 10 }}>
            ⚙️ OpenFlow Processors
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {PROCESSORS.map(p => (
              <div key={p.id} className="proc-card" style={{
                padding: "9px 12px", borderRadius: 8,
                background: activeProc === p.id ? COLORS.ice + "22" : "#ffffff08",
                border: `1px solid ${activeProc === p.id ? COLORS.ice : "#ffffff11"}`,
                boxShadow: activeProc === p.id ? `0 0 14px ${COLORS.ice}55` : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 15 }}>{p.icon}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: activeProc === p.id ? COLORS.ice : COLORS.white }}>{p.label}</div>
                    <div style={{ fontSize: 10, color: COLORS.muted }}>{p.desc}</div>
                  </div>
                </div>
                {activeProc === p.id && (
                  <div style={{ marginTop: 6, height: 2, background: `linear-gradient(90deg, ${COLORS.ice}, transparent)`, borderRadius: 1 }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Arrow 2 */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <FlowLine active={!!activeProc} color={COLORS.success} />
        </div>

        {/* Destinations */}
        <div style={{ background: COLORS.snowLight, borderRadius: 12, padding: 14, border: "1px solid #ffffff11" }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.muted, textTransform: "uppercase", marginBottom: 10 }}>
            ❄️ Snowflake Destinations
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {DESTINATIONS.map(d => (
              <div key={d.id} style={{
                padding: "9px 12px", borderRadius: 8,
                background: activeDest === d.id ? d.color + "22" : "#ffffff08",
                border: `1px solid ${activeDest === d.id ? d.color : "#ffffff11"}`,
                boxShadow: activeDest === d.id ? `0 0 14px ${d.color}55` : "none",
                transition: "all 0.3s",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 15 }}>{d.icon}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: activeDest === d.id ? d.color : COLORS.white }}>{d.label}</div>
                    <div style={{ fontSize: 10, color: COLORS.muted }}>{d.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Control */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <button onClick={running ? stopFlow : startFlow} style={{
          padding: "12px 40px", borderRadius: 30, border: "none", cursor: "pointer",
          fontSize: 14, fontWeight: 700, letterSpacing: 0.5,
          background: running ? COLORS.danger : `linear-gradient(135deg, ${COLORS.ice}, ${COLORS.purple})`,
          color: "#fff",
          boxShadow: running ? `0 0 20px ${COLORS.danger}66` : `0 0 20px ${COLORS.ice}66`,
          transition: "all 0.3s",
        }}>
          {running ? "⏹ Stop Pipeline" : "▶ Start OpenFlow Pipeline"}
        </button>
      </div>

      {/* Live Events */}
      <div style={{ background: COLORS.snowLight, borderRadius: 12, padding: 16, border: "1px solid #ffffff11" }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: COLORS.muted, textTransform: "uppercase", marginBottom: 12 }}>
          🔴 Live Supply Chain Event Stream
        </div>
        {events.length === 0 ? (
          <div style={{ color: COLORS.muted, fontSize: 13, textAlign: "center", padding: "20px 0" }}>
            Start the pipeline to see live events...
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {events.map((e, i) => {
              const src = SOURCES.find(s => s.id === e.source);
              const col = e.severity === "danger" ? COLORS.danger : e.severity === "warning" ? COLORS.warning : COLORS.success;
              return (
                <div key={e.id} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 12px", borderRadius: 8,
                  background: col + "11", border: `1px solid ${col}33`,
                  animation: i === 0 ? "fadeIn 0.4s ease" : "none",
                }}>
                  <span style={{ fontSize: 14 }}>{src?.icon}</span>
                  <div style={{ flex: 1, fontSize: 12 }}>{e.msg}</div>
                  <Pill color={col}>{e.severity}</Pill>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: COLORS.muted }}>
        Powered by Snowflake OpenFlow · Apache NiFi Engine · Zero Infrastructure
      </div>
    </div>
  );
}
