from app.services.importancia_math import (
    ajustar_nao_negativos,
    estimar_vendas_mes,
    impacto_evento_mes,
    pontuacao_bruta_mes,
    ritmo_e_peso_por_mes,
)


def test_impacto_evento() -> None:
    assert impacto_evento_mes(5.0, True, False) == 5.0
    assert impacto_evento_mes(5.0, False, True) == -5.0
    assert impacto_evento_mes(5.0, False, False) == 0.0
    assert impacto_evento_mes(5.0, True, True) == 0.0


def test_pontuacao_com_evento() -> None:
    ev = [(10.0, True, False, [12])]
    assert pontuacao_bruta_mes(12, 2.0, ev) == 12.0
    assert pontuacao_bruta_mes(11, 2.0, ev) == 2.0


def test_ritmo_peso_somam() -> None:
    scores = {m: float(m) for m in range(1, 13)}
    ritmo, peso = ritmo_e_peso_por_mes(scores)
    assert abs(sum(peso[m] for m in range(1, 13)) - 100.0) < 0.1
    assert ritmo[12] == 100.0


def test_ajustar_negativos() -> None:
    adj = ajustar_nao_negativos({1: -1.0, 2: 3.0})
    assert min(adj.values()) > 0


def test_estimar_vendas() -> None:
    assert estimar_vendas_mes(50.0, 10.0) == 60.0
