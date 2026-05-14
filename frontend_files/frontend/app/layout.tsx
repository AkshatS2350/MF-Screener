import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "MF Analyzer | Quantitative Fund Research",
  description: "Screen, analyze, and optimize your Indian mutual fund portfolio.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* ADDED: suppressHydrationWarning to stop Grammarly/extensions from crashing the dev server */}
      <body suppressHydrationWarning>
        {/* Global Navigation Bar */}
        <nav style={{ 
            padding: "16px 32px", 
            borderBottom: "1px solid var(--color-border-secondary)", 
            display: "flex", 
            gap: "32px", 
            alignItems: "center",
            background: "var(--color-background-primary)",
            position: "sticky",
            top: 0,
            zIndex: 100
        }}>
          <Link href="/" style={{ fontWeight: 600, color: "var(--color-text-primary)", fontSize: "18px" }}>
            📈 MF Analyzer
          </Link>
          <div style={{ display: "flex", gap: "24px" }}>
            <Link href="/" style={{ color: "var(--color-text-secondary)", fontSize: "14px", fontWeight: 500 }}>
              Screener
            </Link>
            <Link href="/portfolio" style={{ color: "var(--color-text-secondary)", fontSize: "14px", fontWeight: 500 }}>
              Portfolio Intelligence
            </Link>
          </div>
        </nav>

        {/* Page Content Renders Here */}
        {children}
      </body>
    </html>
  );
}