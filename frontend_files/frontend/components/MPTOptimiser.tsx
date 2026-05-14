"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, ShieldCheck } from "lucide-react";

interface OptimizationResult {
  weights: Record<string, number>;
  expected_return: number;
  volatility: number;
  sharpe_ratio: number;
}

export default function MPTOptimiser({ selectedFunds }: { selectedFunds: string[] }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);

  const handleOptimize = async () => {
    if (selectedFunds.length < 2) return;
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/analysis/optimize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheme_codes: selectedFunds }),
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Optimization failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full mt-6">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <TrendingUp className="text-blue-600" />
          Modern Portfolio Optimizer
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Uses Mean-Variance Optimization to find the mathematically ideal weight distribution for your 
          {selectedFunds.length} selected funds.
        </p>

        {selectedFunds.length < 2 ? (
          <div className="p-4 bg-slate-50 border rounded-lg text-sm text-slate-600">
            Select at least 2 funds in the screener to run the MPT Optimizer.
          </div>
        ) : (
          <Button 
            onClick={handleOptimize} 
            disabled={loading}
            className="w-full mb-6"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Calculate Efficient Frontier"}
          </Button>
        )}

        {result && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-green-50 border border-green-100 rounded-lg">
                <p className="text-xs text-green-700 font-medium">Exp. Return</p>
                <p className="text-lg font-bold text-green-900">{(result.expected_return * 100).toFixed(2)}%</p>
              </div>
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                <p className="text-xs text-red-700 font-medium">Volatility</p>
                <p className="text-lg font-bold text-red-900">{(result.volatility * 100).toFixed(2)}%</p>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <p className="text-xs text-blue-700 font-medium">Sharpe Ratio</p>
                <p className="text-lg font-bold text-blue-900">{result.sharpe_ratio.toFixed(2)}</p>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-semibold mb-2">Recommended Allocations:</h4>
              {Object.entries(result.weights).map(([code, weight]) => (
                <div key={code} className="flex justify-between items-center py-2 border-b last:border-0">
                  <span className="text-sm font-medium">Fund {code}</span>
                  <span className="text-sm font-bold text-blue-600">{(weight * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}