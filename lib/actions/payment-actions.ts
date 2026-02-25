"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { getStripe, createOrGetStripeCustomer } from "@/lib/stripe/client"
import { createFedaPayTransaction } from "@/lib/fedapay/client"
import { revalidatePath } from "next/cache"

/**
 * Initiate a Stripe card payment for an invoice.
 * Returns the client secret for Stripe Elements.
 */
export async function initiateStripePayment(invoiceId: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { company: { select: { id: true, name: true, email: true } } },
  })

  if (!invoice) throw new Error("Invoice not found")
  if (invoice.status !== "PENDING" && invoice.status !== "OVERDUE") {
    throw new Error("Invoice is not payable")
  }

  // Ensure company admin owns this invoice
  if (session.user.role === "COMPANY_ADMIN" && invoice.companyId !== session.user.companyId) {
    throw new Error("Unauthorized")
  }

  // Get or create Stripe customer
  const stripeCustomerId = await createOrGetStripeCustomer(
    invoice.company.id,
    invoice.company.name,
    invoice.company.email
  )

  // Create PaymentIntent
  const paymentIntent = await getStripe().paymentIntents.create({
    amount: invoice.amountCents,
    currency: invoice.currency.toLowerCase(),
    customer: stripeCustomerId,
    metadata: {
      invoiceId: invoice.id,
      companyId: invoice.companyId,
      invoiceNumber: invoice.invoiceNumber,
    },
  })

  // Create payment record
  await prisma.payment.create({
    data: {
      invoiceId: invoice.id,
      method: "CARD",
      provider: "STRIPE",
      externalTransactionId: paymentIntent.id,
      amountCents: invoice.amountCents,
      currency: invoice.currency,
      status: "PENDING",
    },
  })

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  }
}

/**
 * Handle successful Stripe payment (called from webhook).
 */
export async function handleStripePaymentSuccess(paymentIntentId: string) {
  const payment = await prisma.payment.findUnique({
    where: { externalTransactionId: paymentIntentId },
  })

  if (!payment) throw new Error("Payment not found")
  if (payment.status === "SUCCEEDED") return // Idempotent

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: { status: "SUCCEEDED", paidAt: new Date() },
    }),
    prisma.invoice.update({
      where: { id: payment.invoiceId },
      data: { status: "PAID", paidAt: new Date() },
    }),
  ])
}

/**
 * Handle failed Stripe payment (called from webhook).
 */
export async function handleStripePaymentFailure(
  paymentIntentId: string,
  reason?: string
) {
  const payment = await prisma.payment.findUnique({
    where: { externalTransactionId: paymentIntentId },
  })

  if (!payment) throw new Error("Payment not found")

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "FAILED",
      failureReason: reason || "Payment failed",
    },
  })
}

/**
 * Initiate a FedaPay Mobile Money payment.
 */
export async function initiateFedaPayPayment(
  invoiceId: string,
  phone: string,
  customerName: string,
  country?: string
) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { company: { select: { id: true, name: true, email: true } } },
  })

  if (!invoice) throw new Error("Invoice not found")
  if (invoice.status !== "PENDING" && invoice.status !== "OVERDUE") {
    throw new Error("Invoice is not payable")
  }

  if (session.user.role === "COMPANY_ADMIN" && invoice.companyId !== session.user.companyId) {
    throw new Error("Unauthorized")
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  // For XOF, amount is already in units (no cents conversion)
  // For USD/EUR, convert cents to currency units
  const amount = invoice.currency === "XOF"
    ? invoice.amountCents
    : invoice.amountCents / 100

  const { transactionId, paymentUrl } = await createFedaPayTransaction({
    amount,
    currency: invoice.currency,
    description: `Invoice ${invoice.invoiceNumber} - ${invoice.company.name}`,
    callbackUrl: `${appUrl}/api/webhooks/fedapay`,
    customerEmail: invoice.company.email || session.user.email || "",
    customerName,
    customerPhone: phone,
    customerCountry: country,
  })

  // Create payment record
  await prisma.payment.create({
    data: {
      invoiceId: invoice.id,
      method: "MOBILE_MONEY",
      provider: "FEDAPAY",
      externalTransactionId: transactionId,
      amountCents: invoice.amountCents,
      currency: invoice.currency,
      status: "PENDING",
    },
  })

  return { paymentUrl, transactionId }
}

/**
 * Handle FedaPay approved payment (called from webhook).
 */
export async function handleFedaPayApproved(transactionId: string) {
  const payment = await prisma.payment.findUnique({
    where: { externalTransactionId: transactionId },
  })

  if (!payment) throw new Error("Payment not found")
  if (payment.status === "SUCCEEDED") return

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: { status: "SUCCEEDED", paidAt: new Date() },
    }),
    prisma.invoice.update({
      where: { id: payment.invoiceId },
      data: { status: "PAID", paidAt: new Date() },
    }),
  ])
}

/**
 * Handle FedaPay declined/canceled payment.
 */
export async function handleFedaPayDeclined(transactionId: string) {
  const payment = await prisma.payment.findUnique({
    where: { externalTransactionId: transactionId },
  })

  if (!payment) throw new Error("Payment not found")

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "FAILED",
      failureReason: "Payment declined or canceled",
    },
  })
}

/**
 * List payments (for a company or all if super admin).
 */
export async function listPayments(companyId?: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const where: Record<string, unknown> = {}

  if (session.user.role === "COMPANY_ADMIN") {
    if (!session.user.companyId) return []
    where.invoice = { companyId: session.user.companyId }
  } else if (companyId) {
    where.invoice = { companyId }
  }

  const payments = await prisma.payment.findMany({
    where,
    include: {
      invoice: {
        select: { invoiceNumber: true, company: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return payments
}
