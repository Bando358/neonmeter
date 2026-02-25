import Stripe from "stripe"
import { stripe } from "./client"

export function verifyStripeWebhook(
  body: string,
  signature: string
): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not set")

  return stripe.webhooks.constructEvent(body, signature, secret)
}
