import type { Produto } from "../api/types";

export type AbcClasse = "A" | "B" | "C";

export type AbcItem = {
  id: number;
  nome: string;
  faturamento: number;
  percentual_produto: number;
  percentual_acumulado: number;
  classe: AbcClasse;
  quantidade_vendas: number | null;
};

export type AbcResumoClasse = { quantidade: number; faturamento: number; percentual: number };

export type CurvaAbcResult = {
  curva_abc: AbcItem[];
  resumo: { classe_a: AbcResumoClasse; classe_b: AbcResumoClasse; classe_c: AbcResumoClasse };
  faturamento_total: number;
  quantidade_total: number;
};

/** Curva ABC por faturamento por mercadoria (Pareto 80 / 95). */
export function computeCurvaAbc(produtos: Produto[]): CurvaAbcResult | null {
  const rows = produtos
    .map((p) => ({
      p,
      fat: Math.max(0, p.faturamento_por_mercadoria ?? 0),
    }))
    .filter((x) => x.fat > 0)
    .sort((a, b) => b.fat - a.fat);

  if (rows.length === 0) return null;

  const faturamento_total = rows.reduce((s, x) => s + x.fat, 0);
  const quantidade_total = produtos.reduce((s, p) => s + (p.quantidade_vendas ?? 0), 0);

  let cumBefore = 0;
  const curva_abc: AbcItem[] = rows.map(({ p, fat }) => {
    const pct = faturamento_total > 0 ? (fat / faturamento_total) * 100 : 0;
    let classe: AbcClasse = "C";
    if (cumBefore < 80) classe = "A";
    else if (cumBefore < 95) classe = "B";
    const cumAfter = cumBefore + pct;
    cumBefore = cumAfter;

    return {
      id: p.id,
      nome: p.nome,
      faturamento: fat,
      percentual_produto: pct,
      percentual_acumulado: cumAfter,
      classe,
      quantidade_vendas: p.quantidade_vendas,
    };
  });

  const byClass = (c: AbcClasse) => curva_abc.filter((i) => i.classe === c);
  const sumFat = (items: AbcItem[]) => items.reduce((s, i) => s + i.faturamento, 0);

  const fa = byClass("A");
  const fb = byClass("B");
  const fc = byClass("C");

  const mk = (items: AbcItem[]): AbcResumoClasse => ({
    quantidade: items.length,
    faturamento: sumFat(items),
    percentual: faturamento_total > 0 ? (sumFat(items) / faturamento_total) * 100 : 0,
  });

  return {
    curva_abc,
    resumo: {
      classe_a: mk(fa),
      classe_b: mk(fb),
      classe_c: mk(fc),
    },
    faturamento_total,
    quantidade_total,
  };
}

export function produtosNaClasse(data: CurvaAbcResult, classe: AbcClasse): AbcItem[] {
  return data.curva_abc.filter((i) => i.classe === classe);
}
