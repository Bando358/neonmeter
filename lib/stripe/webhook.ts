import Stripe from "stripe"
import { getStripe } from "./client"

export function verifyStripeWebhook(
  body: string,
  signature: string
): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not set")

  return getStripe().webhooks.constructEvent(body, signature, secret)
}
