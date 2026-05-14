import FundScreener from "@/components/FundScreener";

export default function Home() {
  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 20px" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, margin: "0 0 8px 0" }}>MF Analyzer</h1>
        <p style={{ color: "gray", margin: 0 }}>
          Screen, analyze, and compare over 1,600 Indian mutual funds.
        </p>
      </div>
      
      {/* The Screener component handles all the data fetching and filtering */}
      <FundScreener />
    </main>
  );
}