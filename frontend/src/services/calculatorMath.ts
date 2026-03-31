/**
 * Mesmas fórmulas que `backend/app/services/calculator_math.py` — preview local sem POST.
 */
import type { CalculatorCalculateResult } from "../api/types";

/**
 * @param competitorPrice - quando definido e > 0, preenche `price_relation_pct`.
 */
export function computeCalculatorPreview(
  current_price: number,
  current_margin: number,
  desired_margin: number,
  competitorPrice?: number,
): CalculatorCalculateResult | null {
  if (!Number.isFinite(current_price) || current_price <= 0) return null;
  if (!Number.isFinite(current_margin) || current_margin < 0 || current_margin >= 100) return null;
  if (!Number.isFinite(desired_margin) || desired_margin < 0 || desired_margin >= 100) return null;

  const cost = current_price * (1 - current_margin / 100);
  if (cost <= 0) return null;

  const suggested_price = Math.round((cost / (1 - desired_margin / 100)) * 100) / 100;
  const implied_unit_cost = Math.round(current_price * (1 - current_margin / 100) * 100) / 100;

  let price_relation_pct: number | null = null;
  if (
    competitorPrice != null &&
    Number.isFinite(competitorPrice) &&
    competitorPrice > 0
  ) {
    price_relation_pct = Math.round((suggested_price / competitorPrice - 1) * 100 * 100) / 100;
  }

  return { suggested_price, price_relation_pct, implied_unit_cost };
}
