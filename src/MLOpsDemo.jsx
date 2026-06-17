import { useState, useEffect, useRef } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from "recharts";

const C = {
  frost: "#0A0E24",
  snow: "#1A1F3C",
  snowLight: "#232849",
  ice: "#29B5E8",
  glow: "#00D4FF",
  white: "#F0F4FF",
  muted: "#8892B0",
  success: "#00E5A0",
  warning: "#FFB347",
  danger: "#FF4D6A",
  purple: "#9B6DFF",
  orange: "#FF6B35",
};

// Simulated supply chain SKUs
const SKUS = [
  { id: "SKU-7821", name: "Industrial Bearings", category: "MRO", baseStock: 480, reorderPoint: 150 },
  { id: "SKU-3344", name: "Circuit Boards", category: "Electronics", baseStock: 220, reorderPoint: 80 },
  { id: "SKU-9901", name: "Hydraulic Seals", category: "MRO", baseStock: 640, reorderPoint: 200 },
  { id: "SKU-2210", name: "Steel Fasteners", category: "Raw Material", baseStock: 1200, reorderPoint: 400 },
];

const ML_STAGES = [
  { id: "feature", label: "Feature Engineering", icon: "🔧", desc: "Lag features, rolling averages, seasonality", color: C.orange },
  { id: "train", label: "Model Training", icon: "🧠", desc: "XGBoost + LSTM ensemble via Snowpark ML", color: C.purple },
  { id: "eval", label: "Evaluation", icon: "📊", desc: "MAPE, RMSE, drift detection", color: C.ice },
  { id: "registry", label: "Model Registry", icon: "📦", desc: "Versioned, tagged, governance logged", color: C.success },
  { id: "serve", label: "Inference Serving", icon: "⚡", desc: "SPCS endpoint · <80ms p99 latency", color: C.warning },
  { id: "monitor", label: "MLOps Monitor", icon: "🔍", desc: "Data drift + performance alerts", color: C.danger },
];

function generateDemandHistory(base) {
  return Array.from({ length: 24 }, (_, i) => {
    const trend = 1 + i * 0.01;
    const seasonal = 1 + 0.2 * Math.sin((i / 12) * Math.PI * 2);
    const noise = 0.85 + Math.random() * 0.3;
    return {
      week: `W${i + 1}`,
      actual: Math.round(base * trend * seasonal * noise),
      predicted: Math.round(base * trend * seasonal * (0.92 + Math.random() * 0.12)),
    };
  });
}

function generateForecast(lastActual) {
  return Array.from({ length: 8 }, (_, i) => ({
    week: `F+${i + 1}`,
    forecast: Math.round(lastActual * (1 + i * 0.015) * (0.9 + Math.random() * 0.2)),
    upper: Math.round(lastActual * (1 + i * 0.015) * 1.18),
    lower: Math.round(lastActual * (1 + i * 0.015) * 0.82),
  }));
}

function Badge({ color, children }) {
  return (
    <span style={{
      background: color + "22", color, border: `1px solid ${color}44`,
      borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700,
    }}>{children}</span>
  );
}

function StageCard({ stage, active, done }) {
  return (
    <div style={{
      padding: "10px 12px", borderRadius: 10,
      background: done ? stage.color + "18" : active ? stage.color + "22" : C.snowLight,
      border: `1px solid ${active || done ? stage.color : "#ffffff11"}`,
      boxShadow: active ? `0 0 16px ${stage.color}55` : "none",
      transition: "all 0.4s",
      position: "relative", overflow: "hidden",
    }}>
      {active && (
        <div style={{
          position: "absolute", bottom: 0, left: 0, height: 2,
          width: "100%",
          background: `linear-gradient(90deg, ${stage.color}, transparent)`,
          animation: "scan 1.2s linear infinite",
        }} />
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 18 }}>{done ? "✅" : stage.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: active || done ? stage.color : C.white }}>{stage.label}</div>
          <div style={{ fontSize: 10, color: C.muted }}>{stage.desc}</div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, color, delta }) {
  return (
    <div style={{
      background: C.snowLight, borderRadius: 10, padding: "14px 16px",
      border: `1px solid ${color}33`,
    }}>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
      {delta && <div style={{ fontSize: 11, color: delta > 0 ? C.success : C.danger, fontWeight: 600 }}>
        {delta > 0 ? "▲" : "▼"} {Math.abs(delta)}%
      </div>}
      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: C.muted }}>{sub}</div>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.snow, border: `1px solid ${C.ice}33`, borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
      <div style={{ color: C.muted, marginBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color }}>{p.name}: <b>{p.value?.toLocaleString()}</b></div>
      ))}
    </div>
  );
};

export default function MLOpsDemo() {
  const [selectedSku, setSelectedSku] = useState(SKUS[0]);
  const [running, setRunning] = useState(false);
  const [activeStage, setActiveStage] = useState(-1);
  const [doneStages, setDoneStages] = useState([]);
  const [demandData, setDemandData] = useState([]);
  const [forecast, setForecast] = useState([]);
  const [modelMetrics, setModelMetrics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [inferenceResult, setInferenceResult] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    setDemandData(generateDemandHistory(selectedSku.baseStock));
    setForecast([]);
    setDoneStages([]);
    setActiveStage(-1);
    setModelMetrics(null);
    setAlerts([]);
    setInferenceResult(null);
    setRunning(false);
  }, [selectedSku]);

  const runPipeline = () => {
    setRunning(true);
    setDoneStages([]);
    setActiveStage(0);
    setAlerts([]);
    setForecast([]);
    setInferenceResult(null);

    ML_STAGES.forEach((stage, i) => {
      setTimeout(() => {
        setActiveStage(i);
        setDoneStages(d => [...d, i - 1].filter(x => x >= 0));

        if (i === 2) {
          setModelMetrics({
            mape: (3.2 + Math.random() * 1.8).toFixed(1),
            rmse: Math.floor(18 + Math.random() * 12),
            r2: (0.91 + Math.random() * 0.07).toFixed(3),
            drift: (Math.random() * 0.04).toFixed(3),
          });
        }
        if (i === 4) {
          const history = generateDemandHistory(selectedSku.baseStock);
          const last = history[history.length - 1].actual;
          setForecast(generateForecast(last));
        }
        if (i === 5) {
          setDoneStages(d => [...d, 5]);
          setActiveStage(-1);
          setRunning(false);

          const avgForecast = Math.round(selectedSku.baseStock * 1.12);
          const stockGap = avgForecast - selectedSku.reorderPoint;
          setInferenceResult({
            sku: selectedSku.id,
            forecastQty: avgForecast,
            confidence: (88 + Math.random() * 8).toFixed(1),
            action: stockGap > 200 ? "RAISE_PO" : "MONITOR",
            suggestedPO: stockGap > 200 ? Math.round(stockGap * 1.3) : 0,
            riskScore: (Math.random() * 40 + 20).toFixed(0),
          });
          setAlerts([
            { msg: `Demand forecast exceeds safety stock by ${Math.floor(Math.random() * 200 + 100)} units`, sev: "warning" },
            { msg: `Supplier lead time risk: +2.1 days avg (last 30d)`, sev: "warning" },
            { msg: `Model retrain triggered: drift score 0.031 > threshold`, sev: "info" },
          ]);
        }
      }, i * 1400);
    });
  };

  const combinedChart = [
    ...demandData.slice(-12).map(d => ({ ...d, type: "history" })),
    ...forecast.map(f => ({ week: f.week, forecast: f.forecast, upper: f.upper, lower: f.lower, type: "forecast" })),
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.frost, fontFamily: "'Inter','SF Pro',sans-serif", color: C.white, padding: "24px 20px" }}>
      <style>{`
        @keyframes scan { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        .sku-btn:hover { opacity: 0.85; transform: translateY(-1px); transition: all 0.2s; }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: C.purple, textTransform: "uppercase", marginBottom: 6 }}>
          Snowflake ML · Snowpark ML · MLflow · SPCS Serving
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>
          Supply Chain Demand Forecasting
        </h1>
        <p style={{ color: C.muted, fontSize: 13, marginTop: 6 }}>
          End-to-end MLOps pipeline · Feature store → Train → Registry → Serve → Monitor
        </p>
      </div>

      {/* SKU Selector */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>Select SKU</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {SKUS.map(sku => (
            <button key={sku.id} className="sku-btn" onClick={() => setSelectedSku(sku)} style={{
              padding: "8px 16px", borderRadius: 20, border: "none", cursor: "pointer",
              background: selectedSku.id === sku.id ? C.purple : C.snowLight,
              color: selectedSku.id === sku.id ? "#fff" : C.muted,
              fontSize: 12, fontWeight: 600,
              boxShadow: selectedSku.id === sku.id ? `0 0 14px ${C.purple}55` : "none",
              transition: "all 0.3s",
            }}>
              {sku.id} · {sku.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 16, marginBottom: 16 }}>

        {/* MLOps Pipeline Stages */}
        <div style={{ background: C.snowLight, borderRadius: 12, padding: 14, border: "1px solid #ffffff11" }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: C.muted, textTransform: "uppercase", marginBottom: 10 }}>
            🔄 MLOps Pipeline
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {ML_STAGES.map((stage, i) => (
              <StageCard key={stage.id} stage={stage} active={activeStage === i} done={doneStages.includes(i)} />
            ))}
          </div>
          <button onClick={runPipeline} disabled={running} style={{
            marginTop: 14, width: "100%", padding: "11px 0", borderRadius: 8, border: "none",
            cursor: running ? "not-allowed" : "pointer",
            background: running ? C.muted : `linear-gradient(135deg, ${C.purple}, ${C.ice})`,
            color: "#fff", fontSize: 13, fontWeight: 700,
            boxShadow: running ? "none" : `0 0 16px ${C.purple}55`,
            transition: "all 0.3s",
          }}>
            {running ? "⏳ Training..." : doneStages.length === 6 ? "🔄 Retrain Model" : "▶ Run ML Pipeline"}
          </button>
        </div>

        {/* Right Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Model Metrics */}
          {modelMetrics && (
            <div style={{ animation: "fadeIn 0.5s ease" }}>
              <div style={{ fontSize: 10, letterSpacing: 2, color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>
                📊 Model Performance · {selectedSku.id}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
                <MetricCard label="MAPE" value={`${modelMetrics.mape}%`} color={C.success} sub="Mean Abs % Error" />
                <MetricCard label="RMSE" value={modelMetrics.rmse} color={C.ice} sub="Root Mean Sq Error" />
                <MetricCard label="R² Score" value={modelMetrics.r2} color={C.purple} sub="Explained variance" />
                <MetricCard label="Drift Score" value={modelMetrics.drift} color={parseFloat(modelMetrics.drift) > 0.03 ? C.warning : C.success} sub="PSI threshold: 0.03" />
              </div>
            </div>
          )}

          {/* Demand Chart */}
          <div style={{ background: C.snowLight, borderRadius: 12, padding: 16, border: "1px solid #ffffff11" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>📈 Demand History + ML Forecast · {selectedSku.name}</div>
              <div style={{ display: "flex", gap: 12, fontSize: 11, color: C.muted }}>
                <span>— <span style={{ color: C.ice }}>Actual</span></span>
                <span>— <span style={{ color: C.purple }}>Predicted</span></span>
                {forecast.length > 0 && <span>— <span style={{ color: C.warning }}>Forecast</span></span>}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={combinedChart} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <XAxis dataKey="week" tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine x="W24" stroke={C.muted} strokeDasharray="3 3" />
                <Line type="monotone" dataKey="actual" stroke={C.ice} strokeWidth={2} dot={false} name="Actual" />
                <Line type="monotone" dataKey="predicted" stroke={C.purple} strokeWidth={1.5} strokeDasharray="4 2" dot={false} name="Predicted" />
                <Line type="monotone" dataKey="forecast" stroke={C.warning} strokeWidth={2} dot={false} name="Forecast" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Inference Result */}
          {inferenceResult && (
            <div style={{
              background: C.snowLight, borderRadius: 12, padding: 16,
              border: `1px solid ${C.success}33`,
              animation: "fadeIn 0.5s ease",
            }}>
              <div style={{ fontSize: 10, letterSpacing: 2, color: C.muted, textTransform: "uppercase", marginBottom: 12 }}>
                ⚡ Live Inference Result · SPCS Endpoint
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 12 }}>
                <MetricCard label="8-Week Forecast" value={inferenceResult.forecastQty.toLocaleString()} color={C.ice} sub="units demand" />
                <MetricCard label="Confidence" value={`${inferenceResult.confidence}%`} color={C.success} sub="model certainty" />
                <MetricCard label="Risk Score" value={inferenceResult.riskScore} color={inferenceResult.riskScore > 50 ? C.danger : C.warning} sub="supply risk index" />
                <div style={{ background: inferenceResult.action === "RAISE_PO" ? C.success + "18" : C.warning + "18", borderRadius: 10, padding: "14px 16px", border: `1px solid ${inferenceResult.action === "RAISE_PO" ? C.success : C.warning}33`, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: inferenceResult.action === "RAISE_PO" ? C.success : C.warning }}>
                    {inferenceResult.action === "RAISE_PO" ? "🛒 AUTO PO" : "👁 MONITOR"}
                  </div>
                  {inferenceResult.suggestedPO > 0 && (
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>Qty: {inferenceResult.suggestedPO.toLocaleString()} units</div>
                  )}
                </div>
              </div>

              {/* Alerts */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {alerts.map((a, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "7px 12px", borderRadius: 8,
                    background: (a.sev === "warning" ? C.warning : C.ice) + "11",
                    border: `1px solid ${(a.sev === "warning" ? C.warning : C.ice)}33`,
                    fontSize: 12,
                    animation: "fadeIn 0.4s ease",
                  }}>
                    <span>{a.sev === "warning" ? "⚠️" : "ℹ️"}</span>
                    <span>{a.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Architecture Footer */}
      <div style={{ background: C.snowLight, borderRadius: 12, padding: 14, border: "1px solid #ffffff0a" }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: C.muted, textTransform: "uppercase", marginBottom: 10 }}>
          🏗 Snowflake ML Architecture
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            ["Feature Store", C.orange, "Snowpark DataFrames"],
            ["Snowpark ML", C.purple, "XGBoost + LSTM"],
            ["MLflow Registry", C.ice, "Version + governance"],
            ["Model Monitor", C.success, "Drift + MAPE alerts"],
            ["SPCS Serving", C.warning, "Docker + K8s endpoint"],
            ["Cortex Analyst", C.danger, "NL → SQL on predictions"],
          ].map(([label, color, sub]) => (
            <div key={label} style={{
              padding: "8px 14px", borderRadius: 8,
              background: color + "15", border: `1px solid ${color}33`,
              flex: "1 1 140px",
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color }}>{label}</div>
              <div style={{ fontSize: 10, color: C.muted }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: 14, fontSize: 11, color: C.muted }}>
        Powered by Snowflake · Snowpark ML · MLflow · SPCS · Cortex AI · Zero Infrastructure MLOps
      </div>
    </div>
  );
}
