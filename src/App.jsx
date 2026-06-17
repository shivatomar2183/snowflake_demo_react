import { useState } from "react";
import OpenFlowDemo from "./OpenFlowDemo";
import MLOpsDemo from "./MLOpsDemo";

function BackButton({ onClick, color }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "fixed", top: 16, left: 16, zIndex: 9999,
        padding: "8px 18px", background: color, color: "#fff",
        border: "none", borderRadius: 20, cursor: "pointer",
        fontWeight: 700, fontSize: 13, fontFamily: "Arial, sans-serif",
        boxShadow: `0 0 16px ${color}88`,
      }}
    >
      ← Back to Menu
    </button>
  );
}

export default function App() {
  const [view, setView] = useState("home");

  if (view === "openflow") return (
    <>
      <BackButton onClick={() => setView("home")} color="#29B5E8" />
      <OpenFlowDemo />
    </>
  );

  if (view === "mlops") return (
    <>
      <BackButton onClick={() => setView("home")} color="#9B6DFF" />
      <MLOpsDemo />
    </>
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0A0E24 0%, #0D1B4B 60%, #0A0E24 100%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: "Arial, sans-serif", padding: 24,
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{
          fontSize: 10, letterSpacing: 4, color: "#29B5E8",
          textTransform: "uppercase", marginBottom: 12, fontWeight: 700,
        }}>
          Snowflake · Live Platform Demos
        </div>
        <h1 style={{
          fontSize: 42, fontWeight: 900, color: "#F0F4FF",
          margin: 0, letterSpacing: -1, lineHeight: 1.1,
        }}>
          Supply Chain Intelligence
        </h1>
        <p style={{ color: "#8892B0", marginTop: 12, fontSize: 14 }}>
          Powered by Snowflake OpenFlow · Snowpark ML · SPCS · Cortex AI
        </p>
      </div>

      {/* Demo Cards */}
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center" }}>

        {/* OpenFlow Card */}
        <div
          onClick={() => setView("openflow")}
          style={{
            width: 320, padding: "28px 24px", borderRadius: 16, cursor: "pointer",
            background: "linear-gradient(145deg, #1A2744, #0D1B3E)",
            border: "1px solid #29B5E844",
            boxShadow: "0 0 32px #29B5E822",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 40px #29B5E844"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 0 32px #29B5E822"; }}
        >
          <div style={{
            width: 48, height: 48, borderRadius: 12, marginBottom: 16,
            background: "linear-gradient(135deg, #29B5E8, #1565C0)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22,
          }}>🔵</div>
          <div style={{ fontSize: 10, letterSpacing: 3, color: "#29B5E8", textTransform: "uppercase", marginBottom: 6, fontWeight: 700 }}>
            Demo 1
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#F0F4FF", margin: "0 0 10px 0" }}>
            OpenFlow Pipeline
          </h2>
          <p style={{ fontSize: 13, color: "#8892B0", lineHeight: 1.6, margin: 0 }}>
            Live Apache NiFi ingestion from SAP ERP, IoT sensors, supplier APIs and WMS — watch data flow into Snowflake in real-time with CDC capture and dynamic tables.
          </p>
          <div style={{ marginTop: 20, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["OpenFlow", "NiFi", "CDC", "Streams"].map(t => (
              <span key={t} style={{
                background: "#29B5E822", color: "#29B5E8",
                border: "1px solid #29B5E844", borderRadius: 20,
                padding: "3px 10px", fontSize: 11, fontWeight: 600,
              }}>{t}</span>
            ))}
          </div>
          <div style={{
            marginTop: 20, padding: "10px 0 0 0",
            borderTop: "1px solid #29B5E833",
            fontSize: 12, color: "#29B5E8", fontWeight: 700,
          }}>
            Launch Demo →
          </div>
        </div>

        {/* MLOps Card */}
        <div
          onClick={() => setView("mlops")}
          style={{
            width: 320, padding: "28px 24px", borderRadius: 16, cursor: "pointer",
            background: "linear-gradient(145deg, #1A1535, #0D0B2E)",
            border: "1px solid #9B6DFF44",
            boxShadow: "0 0 32px #9B6DFF22",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 40px #9B6DFF44"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 0 32px #9B6DFF22"; }}
        >
          <div style={{
            width: 48, height: 48, borderRadius: 12, marginBottom: 16,
            background: "linear-gradient(135deg, #9B6DFF, #6A1B9A)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22,
          }}>🟣</div>
          <div style={{ fontSize: 10, letterSpacing: 3, color: "#9B6DFF", textTransform: "uppercase", marginBottom: 6, fontWeight: 700 }}>
            Demo 2
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#F0F4FF", margin: "0 0 10px 0" }}>
            ML/MLOps Forecasting
          </h2>
          <p style={{ fontSize: 13, color: "#8892B0", lineHeight: 1.6, margin: 0 }}>
            End-to-end demand forecasting pipeline — Feature Store → Snowpark ML training → Model Registry → SPCS serving → drift monitoring. Live 8-week supply chain forecast.
          </p>
          <div style={{ marginTop: 20, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["Snowpark ML", "MLflow", "SPCS", "Cortex AI"].map(t => (
              <span key={t} style={{
                background: "#9B6DFF22", color: "#9B6DFF",
                border: "1px solid #9B6DFF44", borderRadius: 20,
                padding: "3px 10px", fontSize: 11, fontWeight: 600,
              }}>{t}</span>
            ))}
          </div>
          <div style={{
            marginTop: 20, padding: "10px 0 0 0",
            borderTop: "1px solid #9B6DFF33",
            fontSize: 12, color: "#9B6DFF", fontWeight: 700,
          }}>
            Launch Demo →
          </div>
        </div>
      </div>

      <div style={{ marginTop: 48, fontSize: 11, color: "#3D4E6B", textAlign: "center" }}>
        Hosted on Snowpark Container Services · Governed by Snowflake Horizon
      </div>
    </div>
  );
}
