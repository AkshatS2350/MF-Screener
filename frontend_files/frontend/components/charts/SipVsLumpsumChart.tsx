"use client";
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"; 

interface Props { schemeCode: string }

const fmtL = (v: number) =>
  v >= 1e7 ? `₹${(v/1e7).toFixed(2)}Cr`
  : v >= 1e5 ? `₹${(v/1e5).toFixed(1)}L`
  : `₹${v.toLocaleString("en-IN")}`; 

export default function SipVsLumpsumChart({ schemeCode }: Props) {
  const [sip, setSip] = useState(10000);
  const [startDate, setStartDate] = useState("2015-01-01");
  const [endDate, setEndDate] = useState("2024-12-31");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false); 

  const run = async () => {
    setLoading(true);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/analysis/sip-replay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheme_code: schemeCode, monthly_sip: sip, start_date: startDate, end_date: endDate }),
    });
    setData(await res.json());
    setLoading(false);
  }; 

  const chartData = data?.sip_curve.map((pt: any, i: number) => ({
    date: pt.date,
    sip: pt.value,
    invested: pt.invested,
    lumpsum: data.lumpsum_curve[i]?.value ?? null,
  })) ?? []; 

  const { summary } = data ?? {}; 

  return (
    <div>
      {/* Controls */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        {([
          ["Monthly SIP (₹)", sip, setSip, 1000, 100000, 1000],
          ["From", startDate, setStartDate],
          ["To", endDate, setEndDate],
        ] as any[]).map(([label, val, setter, min, max, step], i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, color: "gray", fontWeight: 500 }}>{label}</label>
            <input
              type={typeof val === "number" ? "number" : "date"}
              value={val} min={min} max={max} step={step}
              onChange={e => setter(typeof val === "number" ? +e.target.value : e.target.value)}
              style={{ padding: "6px 10px", borderRadius: 7, fontSize: 12, border: "1px solid #eaeaea", background: "#fff" }}
            />
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <button onClick={run} disabled={loading} style={{ background: loading ? "gray" : "#378ADD", color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
            {loading ? "Calculating..." : "Compare"}
          </button>
        </div>
      </div> 

      {/* Summary KPIs */}
      {summary && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
          {[
            { label: "Total invested", value: fmtL(data.total_invested), color: "gray" },
            { label: "SIP corpus", value: fmtL(summary.sip_final_value), color: "#1D9E75" },
            { label: "SIP XIRR", value: `${summary.sip_xirr}%`, color: "#1D9E75" },
            { label: "Lumpsum corpus", value: fmtL(summary.lumpsum_final_value), color: "#378ADD" },
            { label: "Lumpsum XIRR", value: `${summary.lumpsum_xirr}%`, color: "#378ADD" },
            { label: "Winner", value: summary.winner === "sip" ? "SIP" : "Lumpsum", color: summary.winner === "sip" ? "#1D9E75" : "#378ADD" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: "#f9f9f9", border: "1px solid #eaeaea", borderRadius: 8, padding: "8px 14px", flex: "1 1 100px" }}>
              <div style={{ fontSize: 11, color: "gray", marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 18, fontWeight: 500, color }}>{value}</div>
            </div>
          ))}
        </div>
      )} 

      {/* Chart */}
      {chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
            <CartesianGrid strokeDasharray="2 3" stroke="#eaeaea" strokeOpacity={0.5}/>
            <XAxis dataKey="date" tick={{ fill: "gray", fontSize: 10 }} interval={Math.floor(chartData.length / 6)} tickLine={false} axisLine={false}/>
            <YAxis tickFormatter={fmtL} tick={{ fill: "gray", fontSize: 10 }} tickLine={false} axisLine={false} width={60}/>
            <Tooltip
  // Using 'any' for the name 'n' bypasses the strict string/undefined mismatch
  formatter={(v: any, n: any) => [fmtL(v), n]}
  contentStyle={{
    background: "var(--color-background-primary)",
    border: "0.5px solid var(--color-border-secondary)",
    borderRadius: 8, 
    fontSize: 11,
  }}
/>
            <Legend wrapperStyle={{ fontSize: 12 }}/>
            <Line type="monotone" dataKey="sip" name="SIP" stroke="#1D9E75" strokeWidth={2} dot={false}/>
            <Line type="monotone" dataKey="lumpsum" name="Lumpsum" stroke="#378ADD" strokeWidth={2} dot={false} strokeDasharray="4 3"/>
            <Line type="monotone" dataKey="invested" name="Amount invested" stroke="gray" strokeWidth={1} dot={false} strokeDasharray="2 4"/>
          </LineChart>
        </ResponsiveContainer>
      )} 
    </div>
  );
}