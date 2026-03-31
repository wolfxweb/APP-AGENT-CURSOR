"""Cálculos de importância mensal (ritmo, peso, vendas estimadas)."""


def impacto_evento_mes(nota: float, aumenta_vendas: bool, diminui_vendas: bool) -> float:
    if aumenta_vendas and not diminui_vendas:
        return nota
    if diminui_vendas and not aumenta_vendas:
        return -nota
    return 0.0


def pontuacao_bruta_mes(
    month: int,
    nota_atribuida: float | None,
    eventos: list[tuple[float, bool, bool, list[int] | None]],
) -> float:
    """eventos: (nota, aumenta, diminui, meses_afetados)."""
    total = float(nota_atribuida or 0.0)
    for nota, aumenta, diminui, meses in eventos:
        meses_list = meses or []
        if month not in meses_list:
            continue
        total += impacto_evento_mes(nota, aumenta, diminui)
    return total


def ajustar_nao_negativos(scores: dict[int, float]) -> dict[int, float]:
    """Desloca para que o menor mês seja epsilon > 0, preservando diferenças relativas."""
    if not scores:
        return {}
    m = min(scores.values())
    eps = 1e-6
    if m >= eps:
        return dict(scores)
    shift = eps - m
    return {k: v + shift for k, v in scores.items()}


def ritmo_e_peso_por_mes(
    scores: dict[int, float],
) -> tuple[dict[int, float], dict[int, float]]:
    """
    ritmo: % em relação ao mês mais forte (0–100).
    peso: participação no ano (soma 100).
    """
    adj = ajustar_nao_negativos(scores)
    total = sum(adj.values())
    mx = max(adj.values()) if adj else 0.0

    peso: dict[int, float] = {}
    ritmo: dict[int, float] = {}
    for m in range(1, 13):
        s = adj.get(m, 0.0)
        peso[m] = round((s / total * 100.0), 4) if total > 0 else round(100.0 / 12, 4)
        ritmo[m] = round((s / mx * 100.0), 4) if mx > 0 else 0.0
    return ritmo, peso


def estimar_vendas_mes(peso_mes_pct: float, media_mensal_clientes: float) -> float:
    """Projeção: média anual implícita * participação do mês."""
    if media_mensal_clientes <= 0:
        return 0.0
    ano_ref = media_mensal_clientes * 12.0
    return round(ano_ref * (peso_mes_pct / 100.0), 4)
