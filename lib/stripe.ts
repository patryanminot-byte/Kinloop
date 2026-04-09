import { watasuFee } from "./utils";

export const STRIPE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

/**
 * Calculate item price, Watasu fee, and total.
 */
export function calculateTotal(price: number) {
  const fee = watasuFee(price);
  return { itemPrice: price, fee, total: price + fee };
}

/**
 * Human-readable fee label for the current tier.
 */
export function feeLabel(price: number): string {
  const fee = watasuFee(price);
  return `Flat $${fee} fee included`;
}
