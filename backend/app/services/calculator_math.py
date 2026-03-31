"""Fórmulas da calculadora de preço (T5).

Margens interpretadas como % sobre o preço de venda (lucro bruto / receita).
Custo variável unitário implícito: preço_atual × (1 − margem_atual/100).
Preço sugerido para margem desejada: custo / (1 − margem_desejada/100).
"""

from __future__ import annotations


class CalculatorMathError(ValueError):
    pass


def compute_suggested_price(
    current_price: float,
    current_margin_pct: float,
    desired_margin_pct: float,
) -> float:
    if current_price <= 0:
        raise CalculatorMathError("Preço atual deve ser maior que zero.")
    if not (0 <= current_margin_pct < 100):
        raise CalculatorMathError("Margem atual deve estar entre 0 e 100 (exclusivo no 100).")
    if not (0 <= desired_margin_pct < 100):
        raise CalculatorMathError("Margem desejada deve estar entre 0 e 100 (exclusivo no 100).")

    cost = current_price * (1.0 - current_margin_pct / 100.0)
    if cost <= 0:
        raise CalculatorMathError(
            "Custo variável implícito seria zero ou negativo; revise preço ou margem atual."
        )
    suggested = cost / (1.0 - desired_margin_pct / 100.0)
    return round(suggested, 2)


def compute_price_relation_vs_competitor(suggested_price: float, competitor_price: float) -> float:
    """Diferença percentual do preço sugerido em relação ao preço do concorrente."""
    if competitor_price <= 0:
        raise CalculatorMathError("Preço do concorrente deve ser maior que zero.")
    return round((suggested_price / competitor_price - 1.0) * 100.0, 2)
