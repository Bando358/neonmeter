import { NextRequest, NextResponse } from "next/server"
import type Stripe from "stripe"
import { verifyStripeWebhook } from "@/lib/stripe/webhook"
import {
  handleStripePaymentSuccess,
  handleStripePaymentFailure,
} from "@/lib/actions/payment-actions"

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = verifyStripeWebhook(body, signature)
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handleStripePaymentSuccess(paymentIntent.id)
        break
      }
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handleStripePaymentFailure(
          paymentIntent.id,
          paymentIntent.last_payment_error?.message
        )
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Stripe webhook error:", error)
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    )
  }
}
