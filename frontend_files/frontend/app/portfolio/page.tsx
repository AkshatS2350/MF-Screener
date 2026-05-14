"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import MPTOptimizer from "@/components/MPTOptimiser";

function PortfolioAnalyzer() {
    const searchParams = useSearchParams();
    const prefill = searchParams.get("prefill"); 
    
    const [schemeCodes, setSchemeCodes] = useState<string>(prefill ?? "");
    const [overlapData, setOverlapData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const runAnalysis = async () => {
        if (!schemeCodes) return;
        setLoading(true);
        
        const codes = schemeCodes.split(",").map(c => c.trim());
        const payload = codes.map(code => ({
            scheme_code: code,
            fund_name: `Fund ${code}`,
            weight: 1.0 / codes.length, 
            holdings: { "INE002A01018": 0.05, "INE062A01020": 0.04 } 
        }));

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/portfolio/overlap`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            setOverlapData(data);
        } catch (error) {
            console.error("Failed to fetch overlap data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (prefill) runAnalysis();
    }, [prefill]);

    // Extract cleaned array of codes for the Optimizer
    const codesArray = schemeCodes ? schemeCodes.split(",").map(c => c.trim()).filter(Boolean) : [];

    return (
        <main className="container max-w-5xl mx-auto py-10 px-4 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Portfolio Intelligence</h1>
                <p className="text-muted-foreground">
                    Analyze stock overlap and concentration risk across multiple funds.
                </p>
            </div>

            {/* Input Section */}
            <div className="flex flex-col sm:flex-row gap-4">
                <Input 
                    type="text" 
                    placeholder="Enter Scheme Codes (comma separated) e.g., 120716, 118989"
                    value={schemeCodes}
                    onChange={(e) => setSchemeCodes(e.target.value)}
                    className="flex-1"
                />
                <Button onClick={runAnalysis} disabled={loading || !schemeCodes} className="sm:w-auto w-full">
                    {loading ? "Analyzing..." : "Analyze Overlap"}
                </Button>
            </div>

            {/* Overlap Results Section */}
            {overlapData && (
                <div className="space-y-8 animate-in fade-in duration-500">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle>Concentration Risk</CardTitle>
                            <CardDescription>Maximum exposure to a single underlying stock.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <span className={`text-4xl font-bold ${overlapData.concentration_risk_pct > 10 ? "text-destructive" : "text-emerald-600"}`}>
                                {overlapData.concentration_risk_pct}%
                            </span>
                        </CardContent>
                    </Card>

                    <div>
                        <h3 className="text-xl font-semibold mb-4">Pairwise Overlap Matrix</h3>
                        <div className="rounded-md border bg-card">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fund Pair</TableHead>
                                        <TableHead>Weighted Overlap</TableHead>
                                        <TableHead>Common Stocks</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {Object.entries(overlapData.overlap_matrix || {}).map(([pair, metrics]: [string, any]) => (
                                        <TableRow key={pair}>
                                            <TableCell className="font-medium">{pair.replace(":", " & ")}</TableCell>
                                            <TableCell>{metrics.weighted_overlap_pct}%</TableCell>
                                            <TableCell>{metrics.common_stocks_count ?? metrics.common_stocks?.length ?? 0}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            )}

            {/* MPT Optimizer Section */}
            <MPTOptimizer schemeCodes={codesArray} />
        </main>
    );
}

export default function PortfolioPage() {
    return (
        <Suspense fallback={<div className="container py-20 text-center text-muted-foreground">Loading Analyzer...</div>}>
            <PortfolioAnalyzer />
        </Suspense>
    );
}