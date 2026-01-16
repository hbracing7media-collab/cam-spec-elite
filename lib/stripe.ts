import Stripe from "stripe";

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
  typescript: true,
});

// Helper to format amount for Stripe (converts dollars to cents)
export function toStripeCents(amount: number): number {
  return Math.round(amount * 100);
}

// Helper to format cents back to dollars
export function fromStripeCents(cents: number): number {
  return cents / 100;
}
