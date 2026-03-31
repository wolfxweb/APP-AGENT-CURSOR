/** Converte texto em pt-BR (milhares . e decimais ,) para número. */
export function parseMoneyPt(value: string): number {
  if (!value || !value.trim()) return 0;
  let v = value.toString().replace(/\s/g, "").replace(/R\$/g, "");
  v = v.replace(/\./g, "").replace(",", ".");
  v = v.replace(/[^\d.]/g, "");
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

/** Formata número como moeda pt-BR (sem símbolo). */
export function formatMoneyPt(value: string | number): string {
  if (value === "" || value === null || value === undefined) return "";
  const n = typeof value === "number" ? value : parseMoneyPt(value);
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function percentOfPartOverRevenue(part: string, revenue: string): string {
  const r = parseMoneyPt(revenue);
  if (r <= 0) return "0,00%";
  const p = parseMoneyPt(part);
  return `${(p / r * 100).toFixed(2).replace(".", ",")}%`;
}

export function percentNumericFromDisplay(display: string): number {
  const n = parseFloat(display.replace("%", "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}
