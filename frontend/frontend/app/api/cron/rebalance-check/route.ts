import { NextRequest, NextResponse } from "next/server";
// import { supabase } from "@/lib/supabase"; // Uncomment when DB is ready
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
export const maxDuration = 60;

export async function GET(req: NextRequest) {
    // 1. Security check: Ensure only Vercel Cron can trigger this
    if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Note: In production, you would fetch saved portfolios from Supabase here.
    // We are mocking the data structure expected by the PDF architecture.
    const mockPortfolio = {
        name: "Core Retirement Portfolio",
        user_email: "test@example.com",
        funds: [
            { scheme_code: "120716", name: "HDFC Index", target_weight: 50, drift_band: 5, latestNav: 150 },
            { scheme_code: "118989", name: "SBI Small Cap", target_weight: 50, drift_band: 5, latestNav: 200 }
        ]
    };

    const alerts = await checkDrift(mockPortfolio);

    if (alerts.length > 0) {
        await resend.emails.send({
            from: "MF Analyzer <alerts@yourdomain.com>",
            to: mockPortfolio.user_email,
            subject: `Rebalancing needed: ${mockPortfolio.name}`,
            html: buildEmailHtml(mockPortfolio.name, alerts),
        });
    }

    return NextResponse.json({ status: "Check complete", alerts_sent: alerts.length });
}

async function checkDrift(portfolio: any) {
    // Simplified logic: calculates current weight based on latest NAV vs Target Weight
    const totalValue = portfolio.funds.reduce((sum: number, f: any) => sum + f.latestNav, 0);
    
    return portfolio.funds
        .map((f: any) => ({
            name: f.name,
            target: f.target_weight,
            current: Math.round((f.latestNav / totalValue) * 100 * 10) / 10,
            drift: Math.abs((f.latestNav / totalValue) * 100 - f.target_weight),
            driftBand: f.drift_band,
        }))
        .filter((f: any) => f.drift > f.driftBand);
}

function buildEmailHtml(portfolioName: string, alerts: any[]) {
    const rows = alerts.map(a => `
        <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #eee">${a.name}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">${a.target}%</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;color:${a.current > a.target ? "#D85A30" : "#1D9E75"}">${a.current}%</td>
            <td style="padding:8px 12px; border-bottom:1px solid #eee;text-align:right;color:#D85A30">+${a.drift.toFixed(1)}%</td>
        </tr>
    `).join("");

    return `
        <div style="font-family:sans-serif; max-width: 560px;margin:0 auto">
            <h2 style="font-size:18px;font-weight:500;color:#111">Portfolio rebalancing needed</h2>
            <p style="color:#555;font-size:14px">One or more funds in <strong>${portfolioName}</strong> have drifted beyond your target bands.</p>
            <table style="width:100%;border-collapse:collapse;font-size:13px">
                <thead>
                    <tr style="background:#f5f5f5">
                        <th style="padding:8px 12px;text-align:left">Fund</th>
                        <th style="padding:8px 12px;text-align:right">Target</th>
                        <th style="padding:8px 12px;text-align:right">Current</th>
                        <th style="padding:8px 12px;text-align:right">Drift</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;
}