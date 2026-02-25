import { NextRequest, NextResponse } from "next/server"
import { verifyFedaPayWebhook } from "@/lib/fedapay/webhook"
import {
  handleFedaPayApproved,
  handleFedaPayDeclined,
} from "@/lib/actions/payment-actions"

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("x-fedapay-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  let event: { name: string; entity: { id: number } }
  try {
    event = verifyFedaPayWebhook(body, signature) as typeof event
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    const transactionId = String(event.entity.id)

    switch (event.name) {
      case "transaction.approved":
        await handleFedaPayApproved(transactionId)
        break
      case "transaction.declined":
      case "transaction.canceled":
        await handleFedaPayDeclined(transactionId)
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("FedaPay webhook error:", error)
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    )
  }
}
