"use client";
import { useState, useEffect } from "react";

interface Props {
  schemeCode: string;
}

export default function RiskMetricsPanel({ schemeCode }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a production app, you might pass a dynamic benchmark code. 
    // Here we just fetch the fund's absolute risk metrics.
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/metrics/risk/${schemeCode}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [schemeCode]);

  if (loading) {
    return <div style={{ padding: "20px", color: "gray", fontSize: 13 }}>Loading risk metrics...</div>;
  }

  if (!data || data.error) return null;

  const metrics = [
    { label: "Sharpe Ratio", value: data.sharpe_ratio?.toFixed(2) ?? "-", desc: "Risk-adjusted return (higher is better)" },
    { label: "Volatility (Std Dev)", value: `${data.std_dev_annual_pct?.toFixed(2) ?? "-"}%`, desc: "Annualized price fluctuation" },
    { label: "Max Drawdown", value: `${data.max_drawdown_pct?.toFixed(2) ?? "-"}%`, desc: "Worst historical drop", color: "#D85A30" },
    { label: "Sortino Ratio", value: data.sortino_ratio?.toFixed(2) ?? "-", desc: "Downside risk-adjusted return" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
      {metrics.map((m, i) => (
        <div key={i} style={{ padding: 16, border: "1px solid #eaeaea", borderRadius: 8, background: "#fff" }}>
          <div style={{ fontSize: 12, color: "gray", marginBottom: 4 }}>{m.label}</div>
          <div style={{ fontSize: 24, fontWeight: 600, color: m.color || "#111" }}>{m.value}</div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>{m.desc}</div>
        </div>
      ))}
    </div>
  );
}