"""Agregações para diagnóstico financeiro por BasicData (T5)."""

from __future__ import annotations

from typing import Any


def _gv(row: Any, key: str, default: float | None = 0.0) -> float:
    if isinstance(row, dict):
        v = row.get(key, default)
    else:
        v = getattr(row, key, default)
    if v is None:
        return 0.0
    return float(v)


def _gi(row: Any, key: str) -> int | None:
    if isinstance(row, dict):
        v = row.get(key)
    else:
        v = getattr(row, key, None)
    return int(v) if v is not None else None


def _go(row: Any, key: str) -> Any:
    if isinstance(row, dict):
        return row.get(key)
    return getattr(row, key, None)


def build_diagnostico(row: Any) -> dict[str, Any]:
    """Monta payload de diagnóstico a partir de um registro BasicData (ORM)."""

    revenue = _gv(row, "sales_revenue", 0.0)
    sales_exp = _gv(row, "sales_expenses", 0.0)
    input_exp = _gv(row, "input_product_expenses", 0.0)
    fc = _gv(row, "fixed_costs", 0.0)
    pl = _gv(row, "pro_labore", 0.0)
    ofc = _gv(row, "other_fixed_costs", 0.0)

    ideal_svc = _go(row, "ideal_service_profit_margin")
    ideal_gen = _go(row, "ideal_profit_margin")
    ideal_margin = float(ideal_svc) if ideal_svc is not None else (
        float(ideal_gen) if ideal_gen is not None else None
    )

    fixed_total = fc + pl + ofc
    variable_total = sales_exp + input_exp

    sales_exp_ratio = (sales_exp / revenue * 100.0) if revenue > 0 else None
    input_exp_ratio = (input_exp / revenue * 100.0) if revenue > 0 else None
    variable_margin_pct = ((revenue - variable_total) / revenue * 100.0) if revenue > 0 else None
    operating_margin_pct = (
        ((revenue - variable_total - fixed_total) / revenue * 100.0) if revenue > 0 else None
    )

    margin_gap = None
    if ideal_margin is not None and operating_margin_pct is not None:
        margin_gap = round(operating_margin_pct - ideal_margin, 2)

    health = "sem_dados"
    insights: list[str] = []
    if revenue <= 0:
        insights.append("Faturamento do período é zero ou ausente.")
    elif operating_margin_pct is None:
        insights.append("Não foi possível calcular margem operacional.")
    else:
        if operating_margin_pct < 0:
            health = "critico"
            insights.append(
                "Margem operacional negativa: despesas fixas e variáveis superam o faturamento."
            )
        elif ideal_margin is not None and operating_margin_pct < ideal_margin * 0.5:
            health = "atencao"
            insights.append("Margem operacional bem abaixo da meta informada no cadastro.")
        elif ideal_margin is not None and operating_margin_pct < ideal_margin:
            health = "atencao"
            insights.append("Margem operacional abaixo da meta; revise custos ou preços.")
        else:
            health = "bom"
            insights.append("Indicadores operacionais alinhados ou superiores à meta de margem.")

        if variable_margin_pct is not None and variable_margin_pct < 15:
            insights.append(
                "Pouco espaço entre faturamento e custos variáveis; avalie estrutura de custos."
            )

    bid = _gi(row, "id")
    return {
        "basic_data_id": bid,
        "month": _gi(row, "month") or 0,
        "year": _gi(row, "year") or 0,
        "activity_type": str(_go(row, "activity_type") or ""),
        "revenue": revenue,
        "sales_expenses": sales_exp,
        "input_product_expenses": input_exp,
        "fixed_costs_total": round(fixed_total, 2),
        "sales_expense_ratio_pct": round(sales_exp_ratio, 2) if sales_exp_ratio is not None else None,
        "input_expense_ratio_pct": round(input_exp_ratio, 2) if input_exp_ratio is not None else None,
        "variable_margin_pct": round(variable_margin_pct, 2) if variable_margin_pct is not None else None,
        "operating_margin_pct": round(operating_margin_pct, 2) if operating_margin_pct is not None else None,
        "ideal_margin_pct": ideal_margin,
        "margin_gap_pct": margin_gap,
        "health_label": health,
        "insights": insights,
    }
