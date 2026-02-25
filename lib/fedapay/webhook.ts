import { Webhook } from "fedapay"

export function verifyFedaPayWebhook(body: string, signature: string) {
  const secret = process.env.FEDAPAY_WEBHOOK_SECRET
  if (!secret) throw new Error("FEDAPAY_WEBHOOK_SECRET is not set")

  return Webhook.constructEvent(body, signature, secret)
}
