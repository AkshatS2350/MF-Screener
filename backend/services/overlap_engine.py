from dataclasses import dataclass

@dataclass
class FundHolding:
    scheme_code: str
    fund_name: str
    weight: float # fund's weight in the user's portfolio (0-1)
    holdings: dict[str, float] # {ISIN: weight_in_fund} [cite: 198-203]

def detect_stock_overlap(funds: list[FundHolding]) -> dict:
    """Pairwise stock overlap detection using weighted Jaccard and overlap coefficient.""" 
    overlap_matrix = {}
    all_stocks: dict[str, dict] = {}
    
    # 1. Pairwise comparisons
    for i in range(len(funds)):
        for j in range(i + 1, len(funds)):
            a, b = funds[i], funds[j]
            key = f"{a.scheme_code}:{b.scheme_code}"
            overlap_matrix[key] = _pairwise_overlap(a, b) 
            
    # 2. Aggregate portfolio exposure [cite: 220]
    for fund in funds:
        for isin, fund_weight in fund.holdings.items():
            effective = fund_weight * fund.weight 
            if isin not in all_stocks:
                all_stocks[isin] = {"isin": isin, "funds": [], "combined_weight": 0.0}
            all_stocks[isin]["funds"].append(fund.fund_name)
            all_stocks[isin]["combined_weight"] += effective 
            
    common = [s for s in all_stocks.values() if len(s["funds"]) > 1]
    common.sort(key=lambda x: x["combined_weight"], reverse=True) 
    concentration = max((s["combined_weight"] for s in all_stocks.values()), default=0.0) 
    
    return {
        "overlap_matrix": overlap_matrix,
        "common_stocks": common[:20],
        "concentration_risk_pct": round(concentration * 100, 2),
    } 

def _pairwise_overlap(a: FundHolding, b: FundHolding) -> dict:
    set_a, set_b = set(a.holdings.keys()), set(b.holdings.keys())
    common = set_a & set_b 
    
    oc = len(common) / min(len(set_a), len(set_b)) if common else 0.0 # Overlap coefficient [cite: 251-252]
    weighted = sum(min(a.holdings[s], b.holdings[s]) for s in common) 
    
    return {
        "overlap_coefficient": round(oc, 4),
        "weighted_overlap_pct": round(weighted * 100, 2),
        "common_stocks_count": len(common)
    } 