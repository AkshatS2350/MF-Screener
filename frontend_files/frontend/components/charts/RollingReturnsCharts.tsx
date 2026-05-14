"use client";
import { useState, useEffect } from "react";
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Brush } from "recharts";
import { Button } from "@/components/ui/button";

type Window = "1y" | "3y" | "5y";

interface RollingPoint {
  date: string;
  return_pct: number;
  category_avg?: number | null;
}

interface RollingReturnsData {
  window: string;
  data: RollingPoint[];
  current: number;
  median: number;
  percentile_25: number;
  percentile_75: number;
  best: number;
  worst: number;
  pct_positive: number;
}

interface Props {
  schemeCode: string;
  fundName: string;
  categoryAvg?: RollingPoint[]; 
}

const WINDOW_LABELS: Record<Window, string> = {
  "1y": "1-year",
  "3y": "3-year",
  "5y": "5-year",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border rounded-lg p-3 shadow-md text-xs">
      <p className="mb-2 text-muted-foreground font-medium">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="my-1" style={{ color: p.color }}>
          {p.name}: <span className="font-semibold">{p.value?.toFixed(2)}%</span>
        </p>
      ))}
    </div>
  );
};

export default function RollingReturnsChart({ schemeCode, fundName, categoryAvg }: Props) {
  const [window, setWindow] = useState<Window>("3y");
  const [data, setData] = useState<RollingReturnsData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!schemeCode) return;
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/metrics/rolling-returns/${schemeCode}?window=${window}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [schemeCode, window]);

  const chartData = data?.data.map((pt, i) => ({
    ...pt,
    category_avg: categoryAvg?.[i]?.return_pct ?? null,
  })) ?? [];

  const aboveMedian = data ? (data.data.filter(d => d.return_pct >= data.median).length / data.data.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Window selector */}
      <div className="flex gap-2">
        {(["1y", "3y", "5y"] as Window[]).map(w => (
          <Button
            key={w}
            variant={window === w ? "default" : "outline"}
            size="sm"
            onClick={() => setWindow(w)}
            className="rounded-full"
          >
            {WINDOW_LABELS[w]}
          </Button>
        ))}
      </div>

      {/* Stat pills */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Current", value: `${data.current.toFixed(1)}%`, colorClass: "text-blue-600" },
            { label: "Median", value: `${data.median.toFixed(1)}%`, colorClass: "text-emerald-600" },
            { label: "Best", value: `${data.best.toFixed(1)}%`, colorClass: "text-emerald-600" },
            { label: "Worst", value: `${data.worst.toFixed(1)}%`, colorClass: "text-destructive" },
            { label: "% Positive", value: `${data.pct_positive.toFixed(0)}%`, colorClass: "text-emerald-600" },
          ].map(({ label, value, colorClass }) => (
            <div key={label} className="bg-muted/30 border rounded-lg p-3 text-sm">
              <span className="text-muted-foreground block text-xs mb-1">{label}</span>
              <span className={`font-semibold ${colorClass}`}>{value}</span>
            </div>
          ))}
        </div>
      )}

      {loading && <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground animate-pulse">Loading chart data...</div>}

      {data && !loading && (
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
              <defs>
                <linearGradient id="ret-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 3" className="stroke-muted" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={Math.floor(chartData.length / 6)} tickLine={false} axisLine={false} className="fill-muted-foreground" />
              <YAxis tickFormatter={v => `${v.toFixed(0)}%`} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={40} className="fill-muted-foreground" />
              <Tooltip content={<CustomTooltip/>}/>
              
              <ReferenceLine y={data.percentile_75} stroke="#3b82f6" strokeDasharray="3 3" strokeOpacity={0.4} label={{ value: "P75", position: "right", fontSize: 10, fill: "#3b82f6" }}/>
              <ReferenceLine y={data.percentile_25} stroke="#3b82f6" strokeDasharray="3 3" strokeOpacity={0.4} label={{ value: "P25", position: "right", fontSize: 10, fill: "#3b82f6" }}/>
              <ReferenceLine y={0} stroke="#ef4444" strokeWidth={1} strokeOpacity={0.6}/>
              <ReferenceLine y={data.median} stroke="#10b981" strokeDasharray="4 2" label={{ value: `Median ${data.median.toFixed(1)}%`, position: "insideTopLeft", fontSize: 10, fill: "#10b981" }}/>

              <Area type="monotone" dataKey="return_pct" name={fundName} stroke="#3b82f6" strokeWidth={1.5} fill="url(#ret-fill)" dot={false}/>
              
              <Brush dataKey="date" height={20} travellerWidth={8} stroke="#e2e8f0" fill="#f8fafc" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {data && (
        <p className="text-xs text-muted-foreground text-center">
          {aboveMedian.toFixed(0)}% of rolling periods delivered above-median returns. Brush the timeline to zoom.
        </p>
      )}
    </div>
  );
}