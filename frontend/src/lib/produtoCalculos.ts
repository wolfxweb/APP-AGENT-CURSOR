import type { BasicData } from "../api/types";

/** Replica a lógica do template Jinja `calcularCamposProduto` (dados básicos + % faturamento). */
export type CalculadoFromBasic = {
  faturamento_por_mercadoria: string;
  quantidade_vendas: string;
  gastos_com_vendas: string;
  gastos_com_compras: string;
  custos_fixos: string;
  ponto_equilibrio: string;
  margem_operacional: string;
  mostrarDicaQuantidade: boolean;
  quantidadeVendasCalculada: number;
};

export function margensDePrecoCusto(precoVenda: number, custoAquisicao: number): {
  margem_contribuicao_valor: string;
  margem_contribuicao_informada: string;
  margem_contribuicao_corrigida: string;
} {
  const margemVal = precoVenda - custoAquisicao;
  let margemPct = 0;
  if (precoVenda > 0) margemPct = (margemVal / precoVenda) * 100;
  return {
    margem_contribuicao_valor: margemVal.toFixed(2),
    margem_contribuicao_informada: margemPct.toFixed(2),
    margem_contribuicao_corrigida: margemPct.toFixed(2),
  };
}

export function calcularCamposComBasic(
  precoVenda: number,
  custoAquisicao: number,
  percentualFaturamento: number,
  basic: BasicData | undefined,
  margemContribuicaoValor: number,
): CalculadoFromBasic & {
  margem_contribuicao_valor: string;
  margem_contribuicao_informada: string;
  margem_contribuicao_corrigida: string;
} {
  const m = margensDePrecoCusto(precoVenda, custoAquisicao);
  const empty: CalculadoFromBasic = {
    faturamento_por_mercadoria: "",
    quantidade_vendas: "",
    gastos_com_vendas: "",
    gastos_com_compras: "",
    custos_fixos: "",
    ponto_equilibrio: "",
    margem_operacional: "",
    mostrarDicaQuantidade: false,
    quantidadeVendasCalculada: 0,
  };

  if (!basic || percentualFaturamento <= 0) {
    return { ...empty, ...m };
  }

  const p = percentualFaturamento / 100;
  const fatLoja = basic.sales_revenue || 0;
  const faturamentoPorMercadoria = p * fatLoja;
  const gastosComVendas = p * (basic.sales_expenses || 0);
  const gastosComCompras = p * (basic.input_product_expenses || 0);
  const fixLoja = (basic.fixed_costs || 0) + (basic.other_fixed_costs || 0);
  const custosFixos = p * fixLoja;
  const quantidadeClientes = basic.clients_served || 0;
  const quantidadeVendas = Math.round(p * quantidadeClientes);

  let pontoEquilibrio = "";
  if (margemContribuicaoValor > 0 && custosFixos > 0) {
    pontoEquilibrio = (custosFixos / margemContribuicaoValor).toFixed(2);
  }

  let margemOperacional = "";
  if (faturamentoPorMercadoria > 0) {
    const totalGastos = gastosComVendas + gastosComCompras + custosFixos;
    const mo = ((faturamentoPorMercadoria - totalGastos) / faturamentoPorMercadoria) * 100;
    margemOperacional = mo.toFixed(2);
  }

  return {
    ...m,
    faturamento_por_mercadoria: faturamentoPorMercadoria.toFixed(2),
    quantidade_vendas: String(quantidadeVendas),
    gastos_com_vendas: gastosComVendas.toFixed(2),
    gastos_com_compras: gastosComCompras.toFixed(2),
    custos_fixos: custosFixos.toFixed(2),
    ponto_equilibrio: pontoEquilibrio,
    margem_operacional: margemOperacional,
    mostrarDicaQuantidade: true,
    quantidadeVendasCalculada: quantidadeVendas,
  };
}
