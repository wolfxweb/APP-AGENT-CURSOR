/**
 * Narrativa detalhada alinhada ao legado (planilha) por tipo de atividade do perfil.
 */
import type { BasicData } from "../api/types";

export type NarrativeBlock = {
  title: string;
  tone?: "info" | "success" | "warning" | "danger";
  paragraphs: string[];
};

export type LegacyDiagnosticResult =
  | { ok: true; commerceInfo: boolean; blocks: NarrativeBlock[] }
  | { ok: false; message: string };

function brl(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function mesAno(bd: BasicData): string {
  return `${bd.month}/${bd.year}`;
}

function isComercio(at: string): boolean {
  const a = at.trim();
  return (
    a === "Comércio varejista" ||
    a === "Comércio atacadista" ||
    a === "Comércio Varejista" ||
    a === "Comércio Atacadista"
  );
}

function isAlimentacao(at: string): boolean {
  return at.trim().toLowerCase() === "alimentação fora do lar";
}

function isIndustria(at: string): boolean {
  const x = at.trim().toLowerCase();
  return x === "indústria" || x === "industria";
}

function isServicos(at: string): boolean {
  const x = at.trim().toLowerCase();
  return x === "prestação de serviços" || x === "prestador de serviços";
}

function distanciaObjetivoLegacy(
  margemValor: number,
  margemIdeal: number,
  faturamento: number,
): number {
  if (margemValor < 0) return Math.abs(margemValor) + margemIdeal * faturamento;
  if (margemValor === 0) return margemIdeal * faturamento;
  const objetivoValor = margemIdeal * faturamento;
  if (objetivoValor <= margemValor) return margemValor - objetivoValor;
  return objetivoValor - margemValor;
}

function buildComercio(bd: BasicData, userName: string): NarrativeBlock[] {
  const label = mesAno(bd);
  const faturamento = bd.sales_revenue || 0;
  const gastosVendas = bd.sales_expenses || 0;
  const gastosCompras = bd.input_product_expenses || 0;
  const custosFixos = Number(bd.fixed_costs || bd.other_fixed_costs || 0);
  const vendas = bd.clients_served || 0;
  const capacidadeAtendimento = Number.parseInt(String(bd.service_capacity ?? ""), 10) || 0;
  const margemIdeal = (bd.ideal_profit_margin ?? bd.ideal_service_profit_margin ?? 0) / 100;

  const totalGastos = gastosVendas + gastosCompras + custosFixos;
  const margemValor = faturamento - totalGastos;
  const margemPercentual = faturamento > 0 ? (margemValor / faturamento) * 100 : 0;

  let tipoResultado: "prejuízo" | "margem" | "lucro";
  if (margemValor < 0) tipoResultado = "prejuízo";
  else if (margemValor === 0) tipoResultado = "margem";
  else tipoResultado = "lucro";

  const valorResultado =
    margemValor < 0 ? totalGastos - faturamento : faturamento - totalGastos;

  let mainText: string;
  if (tipoResultado === "prejuízo") {
    mainText = `Em ${label} seu negócio alcançou faturamento bruto de ${brl(faturamento)}, com ${tipoResultado} de ${margemPercentual.toFixed(2)}%, ou seja, gastou ${brl(valorResultado)} a mais do que faturou.`;
  } else if (tipoResultado === "margem") {
    mainText = `Em ${label} seu negócio alcançou faturamento bruto de ${brl(faturamento)}, com margem de ${margemPercentual.toFixed(2)}%, ou seja, gastou tudo que faturou.`;
  } else {
    mainText = `Em ${label} seu negócio alcançou faturamento bruto de ${brl(faturamento)}, com lucro de ${margemPercentual.toFixed(2)}%, ou seja, ficou com ${brl(valorResultado)} após despesas.`;
  }

  const mainTone: NarrativeBlock["tone"] =
    tipoResultado === "prejuízo" ? "danger" : tipoResultado === "margem" ? "warning" : "success";

  const ticketMedio = vendas > 0 ? faturamento / vendas : 0;
  const margemContribuicao = vendas > 0 ? (faturamento - (gastosVendas + gastosCompras)) / vendas : 0;
  const margemContribuicaoTotal = margemContribuicao * vendas;
  const pontoEquilibrio =
    margemContribuicaoTotal >= custosFixos && margemContribuicao > 0
      ? Math.ceil(custosFixos / margemContribuicao)
      : null;

  const faturamentoPotencial = capacidadeAtendimento * ticketMedio;
  const percentualGastosVendas = faturamento > 0 ? (gastosVendas / faturamento) * 100 : 0;
  const percentualGastosCompras = faturamento > 0 ? (gastosCompras / faturamento) * 100 : 0;
  const varShare = (percentualGastosVendas + percentualGastosCompras) / 100;
  const margemPotencial =
    faturamentoPotencial > 0
      ? ((faturamentoPotencial - faturamentoPotencial * varShare - custosFixos) / faturamentoPotencial) * 100
      : 0;

  const distanciaObjetivo = distanciaObjetivoLegacy(margemValor, margemIdeal, faturamento);

  const blocks: NarrativeBlock[] = [{ title: "Resultado do período", tone: mainTone, paragraphs: [mainText] }];

  let crit = "";
  let critTone: NarrativeBlock["tone"] = "warning";
  if (margemValor < 0) {
    crit = "Esta é uma situação crítica.";
    critTone = "danger";
  } else if (margemValor === 0) {
    crit = "Atenção: resultado zero (nem lucro nem prejuízo).";
  } else if (margemValor > 0 && vendas > capacidadeAtendimento * 1.05) {
    crit = "Atenção: vendas acima de 105% da capacidade informada.";
  }
  if (crit) blocks.push({ title: "Alerta", tone: critTone, paragraphs: [crit] });

  let cap = "";
  const miPct = margemIdeal * 100;
  if (margemValor < 0 && vendas > capacidadeAtendimento * 1.05) {
    cap = `Resultado negativo mesmo com vendas (${vendas}) acima da capacidade (${capacidadeAtendimento}).`;
  } else if (margemValor < 0 && vendas >= capacidadeAtendimento * 0.95 && vendas <= capacidadeAtendimento * 1.05) {
    cap = `Resultado negativo com vendas no intervalo da capacidade (${capacidadeAtendimento}).`;
  } else if (margemValor < 0 && vendas < capacidadeAtendimento * 0.95) {
    cap = `Resultado negativo com vendas (${vendas}) abaixo da capacidade (${capacidadeAtendimento}).`;
  } else if (margemValor === 0 && vendas > capacidadeAtendimento * 1.05) {
    cap = `Resultado zero mesmo com vendas acima da capacidade (${capacidadeAtendimento}).`;
  } else if (margemValor === 0 && vendas >= capacidadeAtendimento * 0.95 && vendas <= capacidadeAtendimento * 1.05) {
    cap = `Resultado zero com vendas no limite da capacidade (${capacidadeAtendimento}).`;
  } else if (margemValor === 0 && vendas < capacidadeAtendimento * 0.95) {
    cap = `Resultado zero com vendas (${vendas}) abaixo da capacidade (${capacidadeAtendimento}).`;
  } else if (margemValor > 0 && margemPercentual < miPct * 0.95 && vendas > capacidadeAtendimento * 1.05) {
    cap = `Lucro abaixo da meta (${miPct.toFixed(2)}%), com vendas acima da capacidade (${capacidadeAtendimento}).`;
  } else if (margemValor > 0 && margemPercentual < miPct * 0.95 && vendas >= capacidadeAtendimento * 0.95 && vendas <= capacidadeAtendimento * 1.05) {
    cap = `Lucro abaixo da meta (${miPct.toFixed(2)}%) vendendo no limite da capacidade (${capacidadeAtendimento}).`;
  } else if (margemValor > 0 && margemPercentual < miPct * 0.95 && vendas <= capacidadeAtendimento * 0.95) {
    cap = `Lucro abaixo da meta (${miPct.toFixed(2)}%) e vendas (${vendas}) abaixo da capacidade (${capacidadeAtendimento}).`;
  } else if (margemValor > 0 && margemPercentual >= miPct * 0.95 && vendas >= capacidadeAtendimento * 1.05) {
    cap = `Lucro alinhado à expectativa, mas com vendas acima da capacidade (${capacidadeAtendimento}).`;
  } else if (margemValor > 0 && margemPercentual >= miPct * 0.95 && vendas >= capacidadeAtendimento * 0.95 && vendas <= capacidadeAtendimento * 1.05) {
    cap = `Lucro alinhado à meta (${miPct.toFixed(2)}%) com vendas no limite da capacidade (${capacidadeAtendimento}).`;
  } else if (margemValor > 0 && Math.abs(margemPercentual - miPct) < 0.01 && vendas < capacidadeAtendimento * 0.95) {
    cap = `Lucro na meta (${miPct.toFixed(2)}%) com vendas abaixo da capacidade (${capacidadeAtendimento}).`;
  } else if (margemValor > 0 && margemPercentual > miPct && vendas > capacidadeAtendimento * 1.05) {
    cap = `Lucro acima da meta (${miPct.toFixed(2)}%), com vendas acima da capacidade (${capacidadeAtendimento}).`;
  }
  if (cap) blocks.push({ title: "Vendas vs capacidade", tone: "info", paragraphs: [cap] });

  const contrib: string[] = [];
  contrib.push(
    `Margem de contribuição (por unidade): ${brl(margemContribuicao)}; total no período: ${brl(margemContribuicaoTotal)}.`,
  );
  if (margemContribuicao <= 0) {
    contrib.push(
      "Margem de contribuição ≤ 0 indica que volume maior pode aprofundar prejuízo — revise preços e custos variáveis.",
    );
  } else if (margemContribuicaoTotal <= custosFixos) {
    contrib.push(
      `Com contribuição total ${brl(margemContribuicaoTotal)} não superando custos fixos ${brl(custosFixos)}, a folga oper é frágil.`,
    );
  }
  blocks.push({ title: "Margem de contribuição", tone: "info", paragraphs: contrib });

  const pe: string[] = [];
  if (margemContribuicao <= 0 || margemContribuicao * vendas < custosFixos) {
    pe.push("Ponto de equilíbrio: não alcançado com a estrutura atual de contribuição e fixos.");
  } else if (pontoEquilibrio != null) {
    pe.push(`Ponto de equilíbrio: ~${pontoEquilibrio} vendas no período.`);
    if (margemContribuicao * vendas > custosFixos && pontoEquilibrio >= capacidadeAtendimento) {
      pe.push(
        "Alerta: ponto de equilíbrio na capacidade ou acima — custos/preços/capacidade merecem revisão.",
      );
    } else if (pontoEquilibrio > 0 && pontoEquilibrio < capacidadeAtendimento) {
      pe.push(
        `Na capacidade (${capacidadeAtendimento}), a margem percentual poderia aproximar ${margemPotencial.toFixed(2)}% (hoje ${margemPercentual.toFixed(2)}%).`,
      );
    }
  }
  blocks.push({ title: "Ponto de equilíbrio", tone: "info", paragraphs: pe });

  const res: string[] = [];
  if (margemValor <= 0) {
    res.push(`Prejuízo ou margem zero (${margemPercentual.toFixed(2)}%) exige plano de ação rápido.`);
  } else if (margemValor > 0 && margemPercentual < miPct * 0.5) {
    res.push(`Lucro ${margemPercentual.toFixed(2)}% está bem abaixo da meta ${miPct.toFixed(2)}%.`);
  } else if (margemValor > 0 && margemPercentual >= miPct * 0.5 && margemPercentual < miPct * 0.8) {
    res.push(`Lucro ${margemPercentual.toFixed(2)}% sugere espaço de melhoria até a meta ${miPct.toFixed(2)}%.`);
  } else if (margemValor > 0 && margemPercentual >= miPct * 0.8 && margemPercentual < miPct) {
    res.push(`Lucro ${margemPercentual.toFixed(2)}% próximo da meta ${miPct.toFixed(2)}%.`);
  } else if (margemValor > 0 && margemPercentual >= miPct) {
    res.push(`Lucro ${margemPercentual.toFixed(2)}% na linha ou acima da meta ${miPct.toFixed(2)}%.`);
  }

  res.push(
    `Distância em relação ao lucro alvo (${miPct.toFixed(2)}% sobre faturamento): ~${brl(distanciaObjetivo)}.`,
  );

  if (vendas < capacidadeAtendimento * 0.95 && margemContribuicaoTotal > custosFixos) {
    res.push(
      "Possíveis frentes: ticket médio, custos fixos, diferenciação e sazonalidade do mês.",
    );
  } else if (vendas > capacidadeAtendimento * 1.05) {
    res.push(
      "Vendas rotineiras acima da capacidade podem pressionar qualidade, prazos e equipe — avalie capacidade real.",
    );
  }

  if (margemPercentual < miPct * 0.95) {
    res.push(`${userName}, estas leituras referem-se ao período fechado; use-as para planejar os próximos meses.`);
  }
  res.push(
    "Considere cenário macro, concorrência e comportamento do cliente ao projetar o próximo período. O simulador pode ajudar a testar hipóteses.",
  );
  blocks.push({ title: "Resumo e próximos passos", tone: "info", paragraphs: res });

  return blocks;
}

/** Alimentação / Serviços: mesma estrutura de custos do legado (pró-labore + “MOD” + demais fixos). */
function buildAlimentacaoOuServicos(
  bd: BasicData,
  userName: string,
  capacityTitle: string,
): NarrativeBlock[] {
  const label = mesAno(bd);
  const faturamento = bd.sales_revenue || 0;
  const gastosVendas = bd.sales_expenses || 0;
  const gastosInsumos = bd.input_product_expenses || 0;
  const proLabore = bd.pro_labore || 0;
  const custoMOD = bd.work_hours_per_week || 0;
  const demaisCustosFixos = bd.other_fixed_costs || 0;
  const vendas = bd.clients_served || 0;
  const capacidade = Number.parseInt(String(bd.service_capacity ?? ""), 10) || 0;
  const margemIdeal = (bd.ideal_profit_margin ?? bd.ideal_service_profit_margin ?? 0) / 100;

  const totalGastos = gastosVendas + gastosInsumos + proLabore + custoMOD + demaisCustosFixos;
  const margemValor = faturamento - totalGastos;
  const margemPercentual = faturamento > 0 ? (margemValor / faturamento) * 100 : 0;
  let tipoResultado: "prejuízo" | "margem" | "lucro";
  if (margemValor < 0) tipoResultado = "prejuízo";
  else if (margemValor === 0) tipoResultado = "margem";
  else tipoResultado = "lucro";
  const valorResultado =
    margemValor < 0 ? totalGastos - faturamento : faturamento - totalGastos;

  let mainText: string;
  if (tipoResultado === "prejuízo") {
    mainText = `Em ${label}, faturamento ${brl(faturamento)}, prejuízo ${margemPercentual.toFixed(2)}% — despesas superam receita em ${brl(valorResultado)}.`;
  } else if (tipoResultado === "margem") {
    mainText = `Em ${label}, faturamento ${brl(faturamento)}, resultado zero (100% das receitas consumidas por despesas).`;
  } else {
    mainText = `Em ${label}, faturamento ${brl(faturamento)}, margem ${margemPercentual.toFixed(2)}% — sobra ${brl(valorResultado)} após todas as despesas do modelo legado.`;
  }
  const mainTone: NarrativeBlock["tone"] =
    tipoResultado === "prejuízo" ? "danger" : tipoResultado === "margem" ? "warning" : "success";

  const ticketMedio = vendas > 0 ? faturamento / vendas : 0;
  const margemContribuicao = vendas > 0 ? (faturamento - (gastosVendas + gastosInsumos)) / vendas : 0;
  const margemContribuicaoTotal = margemContribuicao * vendas;
  const custosFixos = proLabore + custoMOD + demaisCustosFixos;
  const pontoEquilibrio =
    margemContribuicaoTotal >= custosFixos && margemContribuicao > 0
      ? Math.ceil(custosFixos / margemContribuicao)
      : null;

  const faturamentoPotencial = capacidade * ticketMedio;
  const pv = faturamento > 0 ? (gastosVendas / faturamento) * 100 : 0;
  const pi = faturamento > 0 ? (gastosInsumos / faturamento) * 100 : 0;
  const margemPotencial =
    faturamentoPotencial > 0
      ? ((faturamentoPotencial - (faturamentoPotencial * (pv + pi)) / 100 - custosFixos) / faturamentoPotencial) *
        100
      : 0;

  const distanciaObjetivo = distanciaObjetivoLegacy(margemValor, margemIdeal, faturamento);
  const miPct = margemIdeal * 100;

  const blocks: NarrativeBlock[] = [{ title: "Resultado do período", tone: mainTone, paragraphs: [mainText] }];

  let crit = "";
  let critTone: NarrativeBlock["tone"] = "warning";
  if (margemValor < 0) {
    crit = "Situação crítica.";
    critTone = "danger";
  } else if (margemValor === 0) crit = "Atenção: resultado zero.";
  else if (vendas > capacidade * 1.05) crit = "Atenção: vendas acima de 105% da capacidade informada.";
  if (crit) blocks.push({ title: "Alerta", tone: critTone, paragraphs: [crit] });

  const ticketP: string[] = [
    `Ticket médio: ${brl(ticketMedio)}.`,
    `Margem de contribuição por venda: ${brl(margemContribuicao)}; total ${brl(margemContribuicaoTotal)}.`,
  ];
  if (margemContribuicao <= 0) {
    ticketP.push("Contribuição ≤ 0: quanto mais vende, pior pode ficar o resultado — revise precificação e variáveis.");
  } else if (margemContribuicaoTotal <= custosFixos) {
    ticketP.push(
      `Contribuição total não cobre fixos (${brl(custosFixos)}): estrutura frágil para imprevistos.`,
    );
  }
  blocks.push({ title: "Ticket médio e margem de contribuição", tone: "info", paragraphs: ticketP });

  const pe: string[] = [];
  if (pontoEquilibrio) {
    pe.push(`Ponto de equilíbrio: ~${pontoEquilibrio} vendas.`);
    if (margemContribuicao * vendas > custosFixos && pontoEquilibrio >= capacidade) {
      pe.push("Alerta: equilíbrio na capacidade ou acima — revise custos, preços ou capacidade informada.");
    } else if (pontoEquilibrio > 0 && pontoEquilibrio < capacidade) {
      pe.push("Há folga entre equilíbrio e capacidade; volume maior pode elevar lucro, se mantida a contribuição.");
    }
  } else pe.push("Ponto de equilíbrio não alcançado com a contribuição atual.");
  blocks.push({ title: "Ponto de equilíbrio", tone: "info", paragraphs: pe });

  const cap: string[] = [];
  if (margemPotencial > margemPercentual && capacidade > 0) {
    cap.push(
      `Operando na capacidade (${capacidade}), a margem poderia aproximar ${margemPotencial.toFixed(2)}% (hoje ${margemPercentual.toFixed(2)}%).`,
    );
  }
  if (vendas < capacidade * 0.95) {
    cap.push("Volume abaixo da capacidade: avalie mercado, preço médio, concorrência e sazonalidade.");
  } else if (vendas > capacidade * 1.05) {
    cap.push("Volume acima da capacidade recorrente pode gerar gargalos e stress operacional.");
  }
  if (cap.length) blocks.push({ title: capacityTitle, tone: "info", paragraphs: cap });

  const res: string[] = [
    `Distância ao alvo (${miPct.toFixed(2)}%): ordem de grandeza ${brl(distanciaObjetivo)}.`,
    `${userName}, use o período como fotografia para ajustar precificação, mix e custos nos próximos meses.`,
    "O simulador ajuda a testar cenários antes de decidir.",
  ];
  blocks.push({ title: "Resumo e próximos passos", tone: "info", paragraphs: res });

  const rec: string[] = [];
  if (margemContribuicao <= 0 || margemContribuicaoTotal <= custosFixos) {
    rec.push("Priorize custos variáveis e política de preços.");
  } else if (pontoEquilibrio != null && pontoEquilibrio >= capacidade) {
    rec.push("Estrutura de custos e capacidade pedem reequilíbrio (alerta legado).");
  } else {
    rec.push("Combine gestão de fixos e preços praticados.");
  }
  blocks.push({ title: "Recomendações específicas", tone: "info", paragraphs: rec });

  return blocks;
}

function buildIndustria(bd: BasicData, userName: string): NarrativeBlock[] {
  return buildAlimentacaoOuServicos(
    bd,
    userName,
    "Análise de capacidade de produção e potencial",
  );
}

export function buildLegacyDiagnosticNarrative(
  bd: BasicData,
  userActivity: string,
  userName: string,
): LegacyDiagnosticResult {
  if (isComercio(userActivity)) {
    return { ok: true, commerceInfo: true, blocks: buildComercio(bd, userName) };
  }
  if (isAlimentacao(userActivity)) {
    return {
      ok: true,
      commerceInfo: false,
      blocks: buildAlimentacaoOuServicos(bd, userName, "Análise de capacidade e potencial"),
    };
  }
  if (isServicos(userActivity)) {
    return {
      ok: true,
      commerceInfo: false,
      blocks: buildAlimentacaoOuServicos(
        bd,
        userName,
        "Análise de capacidade de atendimento e potencial",
      ),
    };
  }
  if (isIndustria(userActivity)) {
    return { ok: true, commerceInfo: false, blocks: buildIndustria(bd, userName) };
  }
  return {
    ok: false,
    message:
      "Análise narrativa detalhada (modelo planilha) está disponível para Comércio varejista/atacadista, Alimentação fora do lar, Indústria e Prestação de serviços. Os indicadores acima continuam válidos para qualquer tipo.",
  };
}
