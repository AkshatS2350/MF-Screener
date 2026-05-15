"use client";
import { useState, useCallback } from "react";
import { Check, Plus, ArrowRight, Search, Filter } from "lucide-react";

const CATEGORIES = ["Large Cap Fund", "Mid Cap Fund", "Small Cap Fund", "Flexi Cap Fund", "Index Fund"];

export default function FundScreener() {
    const [filters, setFilters] = useState<any>({ sortBy: "return_3y", category: ["Large Cap Fund"] });
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Selection State
    const [selectedCodes, setSelectedCodes] = useState<string[]>([]);

    const toggleFund = (code: string) => {
        setSelectedCodes(prev => 
            prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
        );
    };

    const run = useCallback(async () => {
        setLoading(true);
        try {
            const categoryQuery = filters.category[0];
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/funds/search?q=${categoryQuery}`);
            const data = await res.json();
            setResults(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    const set = (key: string, val: any) => setFilters((prev: any) => ({ ...prev, [key]: val }));

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Dark Mode Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 rounded-2xl bg-card/50 border border-border electric-glow">
                <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Market Segment</label>
                    <select 
                        className="w-full bg-background border border-border rounded-lg p-2 text-sm focus:ring-2 ring-primary/50 outline-none transition-all"
                        onChange={e => set("category", [e.target.value])}
                    >
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                <div className="flex items-end">
                    <button 
                        onClick={run} 
                        disabled={loading}
                        className="w-full h-10 bg-primary text-primary-foreground font-bold rounded-lg hover:brightness-110 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? <span className="animate-pulse">Analyzing...</span> : <><Search size={16}/> Screen Market</>}
                    </button>
                </div>
            </div>

            {/* Electric Table */}
            <div className="rounded-2xl border border-border bg-card/30 backdrop-blur-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/30 text-muted-foreground">
                        <tr>
                            <th className="p-4 w-16 text-center">Pick</th>
                            <th className="p-4">Fund Name</th>
                            <th className="p-4">AMC</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {results.map((f: any) => (
                            <tr key={f.scheme_code} className="group hover:bg-primary/5 transition-colors">
                                <td className="p-4 text-center">
                                    <button 
                                        onClick={() => toggleFund(f.scheme_code)}
                                        className={`w-5 h-5 mx-auto rounded border transition-all flex items-center justify-center ${
                                            selectedCodes.includes(f.scheme_code) 
                                            ? "bg-primary border-primary shadow-[0_0_10px_rgba(56,189,248,0.5)]" 
                                            : "border-muted group-hover:border-primary/50"
                                        }`}
                                    >
                                        {selectedCodes.includes(f.scheme_code) && <Check size={12} className="text-background stroke-[4px]" />}
                                    </button>
                                </td>
                                <td className="p-4 font-semibold text-primary/90 group-hover:text-primary transition-colors">
                                    {f.scheme_name}
                                </td>
                                <td className="p-4 text-muted-foreground">{f.amc_name || "N/A"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Floating Action Button */}
            {selectedCodes.length > 0 && (
                <div className="fixed bottom-12 right-12 animate-in slide-in-from-bottom-10 duration-500">
                    <button 
                        onClick={() => window.location.href = `/portfolio?codes=${selectedCodes.join(',')}`}
                        className="group flex items-center gap-3 bg-primary text-primary-foreground px-8 py-4 rounded-full font-black text-sm tracking-tighter uppercase shadow-2xl shadow-primary/40 hover:scale-105 transition-all"
                    >
                        Optimize {selectedCodes.length} Funds <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            )}
        </div>
    );
}