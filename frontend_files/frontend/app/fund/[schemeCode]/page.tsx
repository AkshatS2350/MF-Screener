"use client";
import { useState, useEffect } from "react";
import RollingReturnsChart from "@/components/charts/RollingReturnsCharts";
import SipVsLumpsumChart from "@/components/charts/SipVsLumpsumChart";
import DrawdownChart from "@/components/charts/DrawdownChart";
import RiskMetricsPanel from "@/components/RiskMetricsPanel";

interface PageProps {
    params: { schemeCode: string };
}

export default function FundDetailPage({ params }: PageProps) {
    const [meta, setMeta] = useState<any>(null);

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/funds/${params.schemeCode}`)
            .then(r => r.json())
            .then(d => setMeta(d));
    }, [params.schemeCode]);

    return (
        <main className="container max-w-4xl mx-auto py-10 px-4 space-y-12">
            {/* Header Area */}
            <div className="border-b pb-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">
                        {meta?.scheme_name ?? "Loading Fund Metadata..."}
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        {meta?.amc} <span className="mx-2">•</span> {meta?.category}
                    </p>
                </div>
            </div>

            {/* Rolling Returns Chart */}
            <section className="space-y-6">
                <h2 className="text-2xl font-semibold tracking-tight">Historical Rolling Returns</h2>
                <RollingReturnsChart 
                    schemeCode={params.schemeCode} 
                    fundName={meta?.scheme_name ?? "Selected Fund"} 
                />
            </section>

            {/* Risk Panel */}
            <section className="space-y-6">
                <h2 className="text-2xl font-semibold tracking-tight">Risk & Volatility Profile</h2>
                <RiskMetricsPanel schemeCode={params.schemeCode} />
            </section>

            {/* Drawdown Anatomy (NEW) */}
            <section className="space-y-6">
                <div className="space-y-1">
                    <h2 className="text-2xl font-semibold tracking-tight">Drawdown Anatomy</h2>
                    <p className="text-muted-foreground">Analyze historical crash episodes, depth of loss, and days taken to recover.</p>
                </div>
                <DrawdownChart schemeCode={params.schemeCode} />
            </section>

            {/* SIP vs Lumpsum Simulator */}
            <section className="space-y-6">
                <div className="space-y-1">
                    <h2 className="text-2xl font-semibold tracking-tight">SIP vs Lump-sum Simulator</h2>
                    <p className="text-muted-foreground">Replay historical investments on real NAV dates to see the Rupee Cost Averaging effect.</p>
                </div>
                <div className="bg-card border rounded-xl p-6">
                    <SipVsLumpsumChart schemeCode={params.schemeCode} />
                </div>
            </section>
        </main>
    );
}