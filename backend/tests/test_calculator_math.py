import pytest

from app.services.calculator_math import (
    CalculatorMathError,
    compute_price_relation_vs_competitor,
    compute_suggested_price,
)


def test_suggested_price_simple() -> None:
    # custo = 100 * (1 - 0.2) = 80; margem desejada 30% => 80 / 0.7 ≈ 114.29
    s = compute_suggested_price(100, 20, 30)
    assert s == 114.29


def test_suggested_price_invalid_margin() -> None:
    with pytest.raises(CalculatorMathError):
        compute_suggested_price(100, 20, 100)


def test_price_relation() -> None:
    r = compute_price_relation_vs_competitor(110, 100)
    assert r == 10.0
