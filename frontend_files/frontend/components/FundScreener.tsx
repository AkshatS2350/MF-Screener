"use client";
import { useState, useCallback } from "react";

const CATEGORIES = [
    "Large Cap Fund", "Mid Cap Fund", "Small Cap Fund",
    "Flexi Cap Fund", "ELSS", "Debt - Short Duration",
    "Debt - Liquid", "Hybrid - Aggressive", "Index Fund",
]; 

const SORT_OPTIONS = [
    { value: "return_3y", label: "3Y Return" },
    { value: "sharpe_ratio", label: "Sharpe Ratio" },
    { value: "std_dev", label: "Std Dev ↑" },
    { value: "max_drawdown_pct", label: "Min Drawdown" },
    { value: "aum_cr", label: "AUM" },
    { value: "expense_ratio", label: "Exp. Ratio ↑" },
]; 

export default function FundScreener() {
    const [filters, setFilters] = useState<any>({
        sortBy: "return_3y", sortDir: "desc", limit: 30,
    }); 
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const run = useCallback(async () => {
        setLoading(true);
        // Note: In Stage 1, we point this to the basic search API.
        // In Stage 2, this points to your advanced Supabase /screen endpoint.
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/funds/search?q=Index`); 
        setResults(await res.json());
        setLoading(false);
    }, [filters]); 

    const set = (key: string, val: any) => setFilters((prev: any) => ({ ...prev, [key]: val })); 

    return (
        <div>
            {/* Filters Section */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 16 }}>
                <div>
                    <label style={{ fontSize: 11, color: "gray", display: "block", marginBottom: 4 }}>Category</label>
                    <select style={{ padding: "6px 10px", width: "100%", borderRadius: 7 }} onChange={e => set("category", [e.target.value])}>
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                </div> 
                
                <div>
                    <label style={{ fontSize: 11, color: "gray", display: "block", marginBottom: 4 }}>Sort by</label>
                    <select style={{ padding: "6px 10px", width: "100%", borderRadius: 7 }} onChange={e => set("sortBy", e.target.value)}>
                        {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </div> 

                <div style={{ display: "flex", alignItems: "flex-end" }}>
                    <button onClick={run} disabled={loading} style={{ background: loading ? "gray" : "#378ADD", color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", cursor: loading ? "default" : "pointer", width: "100%" }}>
                        {loading ? "Scanning..." : "Screen funds"}
                    </button>
                </div> 
            </div>

            {/* Results Table */}
            <div style={{ overflowX: "auto", marginTop: 24 }}>
                <table style={{ width: "100%", fontSize: 14, borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                        <tr style={{ borderBottom: "1px solid #eaeaea" }}>
                            <th style={{ padding: 8 }}>Fund Name</th>
                            <th style={{ padding: 8 }}>AMC</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.map((f: any) => (
                            <tr key={f.schemeCode} style={{ borderBottom: "1px solid #eaeaea" }}>
                                <td style={{ padding: 8 }}>
                                    <a href={`/fund/${f.schemeCode}`} style={{ color: "#378ADD", textDecoration: "none", fontWeight: 500 }}>
                                        {f.schemeName}
                                    </a>
                                </td>
                                <td style={{ padding: 8, color: "gray" }}>{f.schemeCategory}</td>
                            </tr>
                        ))}
                    </tbody>
                </table> 
            </div>
        </div>
    );
}