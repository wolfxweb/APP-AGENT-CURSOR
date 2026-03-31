"""Simulação simples de cenário sobre um BasicData (T8).

Aplica percentuais de variação sobre receita e despesas e recalcula margens.
Resultado reproduzível a partir dos mesmos inputs.
"""

from __future__ import annotations

from typing import Any


def _gv(row: Any, key: str, default: float = 0.0) -> float:
    if isinstance(row, dict):
        v = row.get(key, default)
    else:
        v = getattr(row, key, default)
    if v is None:
        return 0.0
    return float(v)


def _ideal_margin(row: Any) -> float | None:
    if isinstance(row, dict):
        s = row.get("ideal_service_profit_margin")
        g = row.get("ideal_profit_margin")
    else:
        s = getattr(row, "ideal_service_profit_margin", None)
        g = getattr(row, "ideal_profit_margin", None)
    if s is not None:
        return float(s)
    if g is not None:
        return float(g)
    return None


def simulate_scenario(
    row: Any,
    *,
    delta_revenue_pct: float = 0.0,
    delta_sales_expenses_pct: float = 0.0,
    delta_input_expenses_pct: float = 0.0,
    delta_fixed_costs_pct: float = 0.0,
) -> dict[str, Any]:
    """Aplica deltas percentuais e devolve baseline + simulado + deltas em p.p. quando aplicável."""

    def margins_for(
        revenue: float,
        sales_exp: float,
        input_exp: float,
        fixed_total: float,
    ) -> dict[str, float | None]:
        variable_total = sales_exp + input_exp
        op = (
            ((revenue - variable_total - fixed_total) / revenue * 100.0) if revenue > 0 else None
        )
        var_m = (
            ((revenue - variable_total) / revenue * 100.0) if revenue > 0 else None
        )
        return {
            "operating_margin_pct": round(op, 2) if op is not None else None,
            "variable_margin_pct": round(var_m, 2) if var_m is not None else None,
        }

    revenue = _gv(row, "sales_revenue")
    sales_exp = _gv(row, "sales_expenses")
    input_exp = _gv(row, "input_product_expenses")
    fc = _gv(row, "fixed_costs")
    pl = _gv(row, "pro_labore")
    ofc = _gv(row, "other_fixed_costs")
    fixed_total = fc + pl + ofc

    base = margins_for(revenue, sales_exp, input_exp, fixed_total)
    ideal = _ideal_margin(row)

    dr = 1.0 + delta_revenue_pct / 100.0
    dse = 1.0 + delta_sales_expenses_pct / 100.0
    die = 1.0 + delta_input_expenses_pct / 100.0
    dfx = 1.0 + delta_fixed_costs_pct / 100.0

    rev_s = max(0.0, revenue * dr)
    se_s = max(0.0, sales_exp * dse)
    ie_s = max(0.0, input_exp * die)
    fix_s = max(0.0, fixed_total * dfx)

    sim = margins_for(rev_s, se_s, ie_s, fix_s)

    def dpp(a: float | None, b: float | None) -> float | None:
        if a is None or b is None:
            return None
        return round(b - a, 2)

    if isinstance(row, dict):
        bid = int(row["id"]) if row.get("id") is not None else 0
        mo = int(row.get("month") or 0)
        yr = int(row.get("year") or 0)
    else:
        bid = int(row.id) if getattr(row, "id", None) is not None else 0
        mo = int(row.month) if getattr(row, "month", None) is not None else 0
        yr = int(row.year) if getattr(row, "year", None) is not None else 0

    return {
        "basic_data_id": bid,
        "month": mo,
        "year": yr,
        "inputs": {
            "delta_revenue_pct": round(delta_revenue_pct, 2),
            "delta_sales_expenses_pct": round(delta_sales_expenses_pct, 2),
            "delta_input_expenses_pct": round(delta_input_expenses_pct, 2),
            "delta_fixed_costs_pct": round(delta_fixed_costs_pct, 2),
        },
        "baseline": {
            "revenue": round(revenue, 2),
            "sales_expenses": round(sales_exp, 2),
            "input_product_expenses": round(input_exp, 2),
            "fixed_costs_total": round(fixed_total, 2),
            "operating_margin_pct": base["operating_margin_pct"],
            "variable_margin_pct": base["variable_margin_pct"],
            "ideal_margin_pct": ideal,
        },
        "simulated": {
            "revenue": round(rev_s, 2),
            "sales_expenses": round(se_s, 2),
            "input_product_expenses": round(ie_s, 2),
            "fixed_costs_total": round(fix_s, 2),
            "operating_margin_pct": sim["operating_margin_pct"],
            "variable_margin_pct": sim["variable_margin_pct"],
            "ideal_margin_pct": ideal,
        },
        "delta_operating_margin_pp": dpp(base["operating_margin_pct"], sim["operating_margin_pct"]),
        "delta_variable_margin_pp": dpp(base["variable_margin_pct"], sim["variable_margin_pct"]),
    }
