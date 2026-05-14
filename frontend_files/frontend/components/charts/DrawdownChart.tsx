"use client";
import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Define interfaces to satisfy strict TypeScript checking in Next.js 15
interface DrawdownPoint {
  date: string;
  drawdown: number;
}

interface CrashEpisode {
  start_date: string;
  trough_date: string;
  depth_pct: number;
  recovery_days: number | null;
}

interface DrawdownData {
  series: DrawdownPoint[];
  episodes: CrashEpisode[];
  stats: {
    max_drawdown_pct: number;
    avg_recovery_days: number;
  };
}

interface Props { schemeCode: string }

export default function DrawdownChart({ schemeCode }: Props) {
  const [data, setData] = useState<DrawdownData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schemeCode) return;
    setLoading(true);
    // Path updated to align with Vercel serverless Python configuration
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/py/drawdown?scheme_code=${schemeCode}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [schemeCode]);

  if (loading) return <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground animate-pulse">Analyzing historical drawdowns...</div>;
  if (!data || !data.series) return null;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-4">
            <CardDescription>Max Drawdown</CardDescription>
            <CardTitle className="text-2xl text-destructive">{data.stats?.max_drawdown_pct}%</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-4">
            <CardDescription>Average Recovery</CardDescription>
            <CardTitle className="text-2xl">{data.stats?.avg_recovery_days} Days</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Underwater Chart */}
      <div className="h-[300px] w-full mt-4 bg-card border rounded-xl p-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.series} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorDrawdown" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-destructive)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--color-destructive)" stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-tertiary)" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10, fill: "var(--color-text-secondary)" }} 
              minTickGap={30} 
              tickLine={false} 
              axisLine={false} 
            />
            <YAxis 
              tickFormatter={(v) => `${v}%`} 
              tick={{ fontSize: 10, fill: "var(--color-text-secondary)" }} 
              tickLine={false} 
              axisLine={false} 
              width={36}
            />
            <Tooltip 
              // Fix: (any, any) handles potential 'undefined' names in Recharts
              formatter={(val: any, name: any) => [`${val.toFixed(2)}%`, "Drawdown"]}
              contentStyle={{ 
                borderRadius: '8px', 
                background: 'var(--color-background-primary)',
                border: '1px solid var(--color-border-secondary)', 
                fontSize: '12px' 
              }}
            />
            <ReferenceLine y={0} stroke="var(--color-border-secondary)" />
            <Area 
              type="monotone" 
              dataKey="drawdown" 
              stroke="var(--color-destructive)" 
              fillOpacity={1} 
              fill="url(#colorDrawdown)" 
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Major Crash Episodes Table */}
      {data.episodes && data.episodes.length > 0 && (
        <div className="rounded-md border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Crash Start</TableHead>
                <TableHead>Bottom Reached</TableHead>
                <TableHead className="text-right">Depth</TableHead>
                <TableHead className="text-right">Days to Recover</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.episodes.slice(0, 5).map((ep, i) => (
                <TableRow key={i}>
                  <TableCell>{ep.start_date}</TableCell>
                  <TableCell>{ep.trough_date}</TableCell>
                  <TableCell className="text-right font-medium text-destructive">{ep.depth_pct}%</TableCell>
                  <TableCell className="text-right">{ep.recovery_days ? `${ep.recovery_days} days` : "Not recovered"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}