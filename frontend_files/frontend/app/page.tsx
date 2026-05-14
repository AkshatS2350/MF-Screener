"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import MPTOptimiser from "@/components/MPTOptimiser";

function PortfolioContent() {
    const searchParams = useSearchParams();
    
    // Grabbing the selected funds from the URL (e.g., ?codes=100822,102341)
    const codesStr = searchParams.get("codes") || "";
    const codesArray = codesStr ? codesStr.split(",") : [];

    return (
        <main style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 20px" }}>
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 28, fontWeight: 600, margin: "0 0 8px 0" }}>Portfolio Intelligence</h1>
                <p style={{ color: "gray", margin: 0 }}>
                    Quantitative analysis and Modern Portfolio Theory optimization.
                </p>
            </div>

            {/* FIXED: We use 'selectedFunds' to match the prop name 
               in our MPTOptimiser component 
            */}
            <MPTOptimiser selectedFunds={codesArray} />
        </main>
    );
}

// Next.js requires Suspense when using useSearchParams in a client component
export default function PortfolioPage() {
    return (
        <Suspense fallback={<div>Loading Portfolio Intelligence...</div>}>
            <PortfolioContent />
        </Suspense>
    );
}