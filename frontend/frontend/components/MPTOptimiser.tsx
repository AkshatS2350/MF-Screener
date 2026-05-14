"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

// Define interfaces to satisfy strict Next.js 15 type checking
interface FrontierPoint {
  return_pct: number;
  volatility_pct: number;
  sharpe: number;
  is_max_sharpe: boolean;
  is_min_vol: boolean;
}

interface PortfolioResult {
  weights: Record<string, number>;
  return_pct: number;
  volatility_pct: number;
  sharpe: number;
}

interface MPTData {
  frontier: FrontierPoint[];
  max_sharpe: PortfolioResult;
  min_variance: PortfolioResult;
  fund_names: string[];
}

interface Props {
  schemeCodes: string[];
}

export default function MPTOptimizer({ schemeCodes }: Props) {
  const [data, setData] = useState<MPTData | null>(null);
  const [loading, setLoading] = useState(false);

  const runOptimization = async () => {
    if (!schemeCodes.length) return;
    setLoading(true);
    try {
      // Updated path to match Vercel Python serverless route from vercel.json
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/py/efficient_frontier`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // The backend expects an array of objects to fetch NAV history
        body: JSON.stringify({ 
          funds: schemeCodes.map(code => ({ scheme_code: code })) 
        }) 
      });
      
      if (!res.ok) throw new Error("Optimization failed");
      setData(await res.json());
    } catch (e) {
      console.error("Optimization Error:", e);
    } finally {
      setLoading(false);
    }
  };

  if (!schemeCodes || schemeCodes.length < 2) {
    return (
      <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg border border-dashed mt-12">
        Select at least 2 funds in the portfolio tool to run the Efficient Frontier optimizer.
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-12 pt-12 border-t border-border">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold tracking-tight mb-1">Efficient Frontier Optimization</h3>
          <p className="text-sm text-muted-foreground">
            Simulates {data ? "1,000" : "potential"} portfolios to find the optimal risk-return balance[cite: 1640, 1647].
          </p>
        </div>
        <Button onClick={runOptimization} disabled={loading} className="bg-[#378ADD] hover:bg-[#378ADD]/90">
          {loading ? "Simulating Portfolios..." : "Run MPT Optimizer"}
        </Button>
      </div>

      {data && data.max_sharpe && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Optimal Weights Card */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-[#1D9E75]">Max Sharpe Portfolio</CardTitle>
              <CardDescription>
                Return: <span className="font-bold text-foreground">{data.max_sharpe.return_pct?.toFixed(1)}%</span> | 
                Risk: <span className="font-bold text-foreground">{data.max_sharpe.volatility_pct?.toFixed(1)}%</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(data.max_sharpe.weights).map(([fundName, weight]) => (
                  <div key={fundName}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium truncate pr-4 text-card-foreground">{fundName}</span>
                      <span className="font-bold">{weight.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#1D9E75]" 
                        style={{ width: `${weight}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Frontier Chart Card */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Risk vs Return Curve</CardTitle>
              <CardDescription>Max Sharpe (Green) vs Min Variance (Purple)</CardDescription>
            </CardHeader>
            <CardContent className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-tertiary)" vertical={false} />
                  <XAxis 
                    dataKey="volatility_pct" 
                    type="number" 
                    name="Risk" 
                    unit="%"
                    tick={{fontSize: 10, fill: "var(--color-text-secondary)"}} 
                    domain={['dataMin - 0.5', 'dataMax + 0.5']} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    dataKey="return_pct" 
                    type="number" 
                    name="Return" 
                    unit="%"
                    tick={{fontSize: 10, fill: "var(--color-text-secondary)"}} 
                    domain={['dataMin - 0.5', 'dataMax + 0.5']} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }} 
                    contentStyle={{ 
                      background: "var(--color-background-primary)",
                      border: "1px solid var(--color-border-secondary)",
                      borderRadius: '8px', 
                      fontSize: '12px' 
                    }} 
                  />
                  <Scatter data={data.frontier}>
                    {data.frontier.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.is_max_sharpe ? "#10b981" : entry.is_min_vol ? "#8b5cf6" : "var(--color-border-tertiary)"} 
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}