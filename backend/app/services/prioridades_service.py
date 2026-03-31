"""Heurística de prioridades estratégicas a partir de diagnóstico + importância do mês (T8).

Documentação: scores 0–100; itens ordenados do maior para o menor score.
Não substitui decisão humana — explicita focos sugeridos com base nos dados do período.
"""

from __future__ import annotations

from typing import Any


def _f(x: Any) -> float:
    if x is None:
        return 0.0
    try:
        return float(x)
    except (TypeError, ValueError):
        return 0.0


def build_prioridades(
    diagnostico: dict[str, Any],
    importancia: dict[str, Any] | None,
) -> list[dict[str, Any]]:
    """Monta lista ranqueada de prioridades.

    `diagnostico`: payload compatível com `build_di diagnostico` / `DiagnosticoOut`.
    `importancia`: opcional, campos month/year/nota_atribuida/peso_mes ou None.
    """
    items: list[dict[str, Any]] = []

    revenue = _f(diagnostico.get("revenue"))
    health = str(diagnostico.get("health_label") or "sem_dados")
    sales_ratio = diagnostico.get("sales_expense_ratio_pct")
    input_ratio = diagnostico.get("input_expense_ratio_pct")
    var_margin = diagnostico.get("variable_margin_pct")
    op_margin = diagnostico.get("operating_margin_pct")
    margin_gap = diagnostico.get("margin_gap_pct")
    ideal = diagnostico.get("ideal_margin_pct")

    if revenue <= 0:
        items.append(
            {
                "codigo": "dados_incompletos",
                "titulo": "Completar dados do período",
                "descricao": "Sem faturamento informado não é possível priorizar indicadores financeiros.",
                "score": 100.0,
                "eixo": "dados",
            }
        )
        return _sort_and_index(items)

    # Saúde geral
    if health == "critico":
        items.append(
            {
                "codigo": "margem_critica",
                "titulo": "Estabilizar resultado operacional",
                "descricao": "Margem operacional negativa ou cenário crítico; revisar custos fixos, preços e volume com urgência.",
                "score": 95.0,
                "eixo": "financeiro",
            }
        )
    elif health == "atencao":
        items.append(
            {
                "codigo": "abaixo_meta",
                "titulo": "Aproximar da meta de margem",
                "descricao": "Resultado abaixo da meta cadastrada; alinhar despesas variáveis, fixas e política de preços.",
                "score": 78.0,
                "eixo": "financeiro",
            }
        )

    sr = _f(sales_ratio) if sales_ratio is not None else None
    if sr is not None and sr > 22:
        items.append(
            {
                "codigo": "despesas_vendas",
                "titulo": "Otimizar despesas com vendas",
                "descricao": f"Proporção de gastos com vendas sobre o faturamento elevada ({sr:.1f}%); revisar comercial e canais.",
                "score": min(88.0, 55.0 + sr),
                "eixo": "comercial",
            }
        )

    ir = _f(input_ratio) if input_ratio is not None else None
    if ir is not None and ir > 30:
        items.append(
            {
                "codigo": "insumos",
                "titulo": "Rever insumos e compras",
                "descricao": f"Peso de insumos/compras no faturamento alto ({ir:.1f}%); negociar fornecedores ou mix de produtos.",
                "score": min(85.0, 50.0 + ir),
                "eixo": "operacional",
            }
        )

    vm = _f(var_margin) if var_margin is not None else None
    if vm is not None and vm < 18:
        items.append(
            {
                "codigo": "margem_variavel",
                "titulo": "Ampliar margem de contribuição",
                "descricao": "Pouco espaço entre receita e custos variáveis; impacto direto na capacidade de cobrir fixos.",
                "score": 72.0 - max(0.0, 18.0 - vm),
                "eixo": "financeiro",
            }
        )

    mg = _f(margin_gap) if margin_gap is not None else None
    if mg is not None and mg < -3:
        items.append(
            {
                "codigo": "gap_meta",
                "titulo": "Fechar o gap até a margem ideal",
                "descricao": f"Margem operacional está {abs(mg):.1f} p.p. abaixo da meta cadastrada."
                + (f" Meta: { _f(ideal):.1f}%." if ideal is not None else ""),
                "score": min(90.0, 60.0 + abs(mg) * 2),
                "eixo": "estratégico",
            }
        )

    # Importância do mês
    if importancia:
        nota = importancia.get("nota_atribuida")
        if nota is not None:
            nf = _f(nota)
            if nf > 0 and nf < 5:
                items.append(
                    {
                        "codigo": "mes_baixa_intensidade",
                        "titulo": "Planejar o mês de menor intensidade",
                        "descricao": "Nota de importância do mês baixa na escala; antecipar campanhas ou uso de capacidade ociosa.",
                        "score": 55.0 + (5.0 - nf) * 4,
                        "eixo": "estratégico",
                    }
                )

    # Deduplicate by codigo (keep max score)
    by_cod: dict[str, dict[str, Any]] = {}
    for it in items:
        c = str(it["codigo"])
        if c not in by_cod or _f(by_cod[c].get("score")) < _f(it.get("score")):
            by_cod[c] = it

    merged = list(by_cod.values())
    if not merged and health == "bom":
        merged.append(
            {
                "codigo": "manter_evo",
                "titulo": "Manter disciplina e evoluir margem",
                "descricao": "Indicadores alinhados; priorize melhoria contínua, produtividade e novos produtos/serviços.",
                "score": 50.0,
                "eixo": "estratégico",
            }
        )

    return _sort_and_index(merged)


def _sort_and_index(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    items.sort(key=lambda x: (-_f(x.get("score")), str(x.get("codigo"))))
    out: list[dict[str, Any]] = []
    for i, it in enumerate(items, start=1):
        row = {**it, "ordem": i}
        row["score"] = min(100.0, max(0.0, round(_f(row.get("score")), 2)))
        out.append(row)
    return out
