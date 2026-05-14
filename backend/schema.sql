-- 1. Clean up
DROP MATERIALIZED VIEW IF EXISTS fund_metrics_view;
DROP TABLE IF EXISTS nav_history CASCADE;
DROP TABLE IF EXISTS user_portfolios;
DROP TABLE IF EXISTS mutual_funds CASCADE;

-- 2. Core Mutual Fund Table
CREATE TABLE mutual_funds (
    scheme_code TEXT PRIMARY KEY,
    scheme_name TEXT NOT NULL,
    amc_name TEXT,
    category TEXT,
    launch_date DATE,
    expense_ratio NUMERIC,
    aum_cr NUMERIC
);

-- 3. Daily NAV Tracking Table
CREATE TABLE nav_history (
    scheme_code TEXT REFERENCES mutual_funds(scheme_code),
    date DATE NOT NULL,
    nav_value NUMERIC NOT NULL,
    PRIMARY KEY (scheme_code, date)
);

-- 4. User Portfolios
CREATE TABLE user_portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    portfolio_name TEXT NOT NULL,
    holdings JSONB NOT NULL
);

-- 5. The "Screener" Materialized View with Logic
CREATE MATERIALIZED VIEW fund_metrics_view AS
SELECT 
    mf.scheme_code,
    mf.scheme_name,
    mf.category,
    mf.expense_ratio,
    mf.aum_cr,
    -- 3Y CAGR: (Latest NAV / NAV from 3y ago) ^ (1/3) - 1
    round(
        (power(latest.nav / nullif(nav_3y.nav, 0), 1.0/3.0) - 1) * 100, 2
    ) as cagr_3y,
    -- Volatility (Standard Deviation of daily NAVs)
    (SELECT round(stddev(nav_value), 2) 
     FROM nav_history 
     WHERE scheme_code = mf.scheme_code) as volatility
FROM mutual_funds mf
-- Fetch the latest available NAV for each fund
JOIN LATERAL (
    SELECT nav_value as nav FROM nav_history
    WHERE scheme_code = mf.scheme_code
    ORDER BY date DESC LIMIT 1
) latest ON true
-- Fetch NAV from ~3 years ago
LEFT JOIN LATERAL (
    SELECT nav_value as nav FROM nav_history
    WHERE scheme_code = mf.scheme_code
    AND date <= CURRENT_DATE - INTERVAL '3 years'
    ORDER BY date DESC LIMIT 1
) nav_3y ON true;

-- 6. High-speed Index
CREATE UNIQUE INDEX ON fund_metrics_view (scheme_code);