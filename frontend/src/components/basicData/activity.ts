/** Mesmo critério do legado Jinja: comércio atacadista/varejista usam layout “indústria/comércio”. */
export function isWholesaleRetailCommerce(activityType: string): boolean {
  const a = activityType.trim();
  return a === "Comércio atacadista" || a === "Comércio varejista";
}
