"use server"

import prisma from "@/lib/prisma"
import { fetchAndStoreUsage } from "@/lib/actions/usage-actions"
import { generateInvoice } from "@/lib/actions/invoice-actions"
import { OVERDUE_GRACE_DAYS } from "@/lib/constants"
import { subMonths, startOfMonth, endOfMonth, subDays } from "date-fns"

/**
 * Fetch usage for all active companies. Called daily by cron.
 */
export async function fetchAndStoreUsageForAllCompanies() {
  const companies = await prisma.company.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, name: true },
  })

  const results: { companyId: string; name: string; success: boolean; error?: string }[] = []

  // Process sequentially to respect Neon API rate limit (50 req/min)
  for (const company of companies) {
    try {
      await fetchAndStoreUsage(company.id)
      results.push({ companyId: company.id, name: company.name, success: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      results.push({ companyId: company.id, name: company.name, success: false, error: message })
    }

    // Small delay to stay within rate limit
    if (companies.length > 10) {
      await new Promise((resolve) => setTimeout(resolve, 1500))
    }
  }

  return results
}

/**
 * Generate invoices for all active companies for the previous month.
 * Called on the 1st of each month.
 */
export async function runMonthlyBilling() {
  const previousMonth = subMonths(new Date(), 1)
  const periodStart = startOfMonth(previousMonth)
  const periodEnd = endOfMonth(previousMonth)

  const companies = await prisma.company.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, name: true },
  })

  const results: { companyId: string; name: string; invoiceId?: string; error?: string }[] = []

  for (const company of companies) {
    try {
      const invoice = await generateInvoice(company.id, periodStart, periodEnd)
      results.push({
        companyId: company.id,
        name: company.name,
        invoiceId: invoice?.id,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      results.push({ companyId: company.id, name: company.name, error: message })
    }
  }

  return results
}

/**
 * Check for overdue invoices and optionally suspend companies.
 * Called daily.
 */
export async function checkOverdueInvoices() {
  const now = new Date()

  // Mark PENDING invoices past due date as OVERDUE
  const overdue = await prisma.invoice.updateMany({
    where: {
      status: "PENDING",
      dueDate: { lt: now },
    },
    data: { status: "OVERDUE" },
  })

  // Suspend companies with invoices overdue past grace period
  const graceDate = subDays(now, OVERDUE_GRACE_DAYS)
  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      status: "OVERDUE",
      dueDate: { lt: graceDate },
      company: { status: "ACTIVE" },
    },
    select: { companyId: true },
    distinct: ["companyId"],
  })

  const suspendedCount = await prisma.company.updateMany({
    where: {
      id: { in: overdueInvoices.map((i) => i.companyId) },
      status: "ACTIVE",
    },
    data: { status: "SUSPENDED" },
  })

  return {
    markedOverdue: overdue.count,
    companiesSuspended: suspendedCount.count,
  }
}
