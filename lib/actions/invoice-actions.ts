"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { INVOICE_DUE_DAYS } from "@/lib/constants"
import { startOfMonth, endOfMonth, addDays, format } from "date-fns"

export async function generateInvoiceNumber(periodStart: Date): Promise<string> {
  const year = periodStart.getFullYear()
  const month = periodStart.getMonth()
  const count = await prisma.invoice.count({
    where: {
      periodStart: {
        gte: new Date(year, month, 1),
        lt: new Date(year, month + 1, 1),
      },
    },
  })
  const monthStr = String(month + 1).padStart(2, "0")
  return `NM-${year}-${monthStr}-${String(count + 1).padStart(3, "0")}`
}

export async function generateInvoice(companyId: string, periodStart: Date, periodEnd: Date) {
  // Find the usage record for this period
  const usageRecord = await prisma.usageRecord.findUnique({
    where: {
      companyId_periodStart: {
        companyId,
        periodStart: startOfMonth(periodStart),
      },
    },
  })

  if (!usageRecord) {
    throw new Error(`No usage record found for company ${companyId} period ${format(periodStart, "yyyy-MM")}`)
  }

  if (usageRecord.billedAmountCents <= 0) {
    return null // Skip zero-amount invoices
  }

  // Check if invoice already exists
  const existing = await prisma.invoice.findFirst({
    where: {
      companyId,
      periodStart: startOfMonth(periodStart),
    },
  })

  if (existing) {
    return existing
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { currency: true },
  })

  const invoiceNumber = await generateInvoiceNumber(periodStart)
  const dueDate = addDays(new Date(), INVOICE_DUE_DAYS)

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      companyId,
      amountCents: usageRecord.billedAmountCents,
      currency: company?.currency || "USD",
      status: "PENDING",
      periodStart: startOfMonth(periodStart),
      periodEnd: endOfMonth(periodEnd),
      dueDate,
    },
  })

  return invoice
}

export async function listInvoices(companyId?: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const where: Record<string, unknown> = {}

  if (session.user.role === "COMPANY_ADMIN") {
    if (!session.user.companyId) return []
    where.companyId = session.user.companyId
  } else if (companyId) {
    where.companyId = companyId
  }

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      company: { select: { name: true, slug: true } },
      _count: { select: { payments: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return invoices
}

export async function getInvoice(invoiceId: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      company: { select: { name: true, slug: true, email: true, currency: true } },
      payments: {
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!invoice) return null

  // Ensure company admin can only see their own
  if (session.user.role === "COMPANY_ADMIN" && invoice.companyId !== session.user.companyId) {
    throw new Error("Unauthorized")
  }

  return invoice
}
