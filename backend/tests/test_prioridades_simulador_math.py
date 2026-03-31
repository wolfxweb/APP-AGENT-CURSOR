"""Testes unitários — prioridades e simulador (T8)."""

from app.services.prioridades_service import build_prioridades
from app.services.simulador_service import simulate_scenario


def test_prioridades_sem_faturamento() -> None:
    d = {
        "revenue": 0.0,
        "health_label": "sem_dados",
        "sales_expense_ratio_pct": None,
        "input_expense_ratio_pct": None,
        "variable_margin_pct": None,
        "operating_margin_pct": None,
        "margin_gap_pct": None,
        "ideal_margin_pct": None,
    }
    out = build_prioridades(d, None)
    assert len(out) == 1
    assert out[0]["codigo"] == "dados_incompletos"


def test_prioridades_com_diagnostico() -> None:
    d = {
        "revenue": 50000.0,
        "health_label": "atencao",
        "sales_expense_ratio_pct": 28.0,
        "input_expense_ratio_pct": 15.0,
        "variable_margin_pct": 12.0,
        "operating_margin_pct": 8.0,
        "margin_gap_pct": -12.0,
        "ideal_margin_pct": 25.0,
    }
    out = build_prioridades(d, None)
    codes = {x["codigo"] for x in out}
    assert "abaixo_meta" in codes or "gap_meta" in codes
    assert all(0 <= x["score"] <= 100 for x in out)
    assert out[0]["ordem"] == 1


def test_simulador_reproduzivel() -> None:
    row = {
        "id": 1,
        "month": 3,
        "year": 2026,
        "sales_revenue": 10000.0,
        "sales_expenses": 1000.0,
        "input_product_expenses": 2000.0,
        "fixed_costs": 3000.0,
        "pro_labore": 0.0,
        "other_fixed_costs": 0.0,
        "ideal_profit_margin": 30.0,
        "ideal_service_profit_margin": None,
    }
    a = simulate_scenario(row, delta_revenue_pct=10.0)
    b = simulate_scenario(row, delta_revenue_pct=10.0)
    assert a["simulated"]["revenue"] == b["simulated"]["revenue"] == 11000.0
    assert a["delta_operating_margin_pp"] == b["delta_operating_margin_pp"]
    assert a["baseline"]["operating_margin_pct"] is not None
