"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { decryptApiKey } from "@/lib/crypto"
import { fetchNeonConsumption } from "@/lib/neon/client"
import { parseConsumption } from "@/lib/neon/parser"
import { estimateNeonCostCents, applyMarkup } from "@/lib/neon/pricing"
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns"

/**
 * Fetch usage from Neon API and store/update the UsageRecord for a company and period.
 */
export async function fetchAndStoreUsage(
  companyId: string,
  periodDate?: Date
) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  })

  if (!company) throw new Error("Company not found")
  if (company.status !== "ACTIVE") throw new Error("Company is not active")

  // Default to previous month
  const targetDate = periodDate || subMonths(new Date(), 1)
  const periodStart = startOfMonth(targetDate)
  const periodEnd = endOfMonth(targetDate)

  // Decrypt the Neon API key
  const apiKey = decryptApiKey(
    company.neonApiKeyEncrypted,
    company.neonApiKeyIv,
    company.neonApiKeyTag
  )

  // Fetch from Neon API
  const response = await fetchNeonConsumption({
    apiKey,
    orgId: company.neonOrgId || undefined,
    projectIds: [company.neonProjectId],
    from: periodStart.toISOString(),
    to: periodEnd.toISOString(),
    granularity: "monthly",
  })

  // Parse metrics
  const metrics = parseConsumption(response, company.neonProjectId)

  // Calculate costs
  const estimatedCostNeonCents = estimateNeonCostCents(metrics)
  const billedAmountCents = applyMarkup(estimatedCostNeonCents, company.billingMarkupPercentage)

  // Upsert usage record
  const usageRecord = await prisma.usageRecord.upsert({
    where: {
      companyId_periodStart: {
        companyId,
        periodStart,
      },
    },
    create: {
      companyId,
      periodStart,
      periodEnd,
      ...metrics,
      estimatedCostNeonCents,
      billedAmountCents,
    },
    update: {
      periodEnd,
      ...metrics,
      estimatedCostNeonCents,
      billedAmountCents,
      fetchedAt: new Date(),
    },
  })

  return usageRecord
}

/**
 * Get usage history for a company (visible to company admins and super admins).
 */
export async function getUsageHistory(companyId: string, months: number = 12) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  // Company admins can only see their own company
  if (session.user.role === "COMPANY_ADMIN" && session.user.companyId !== companyId) {
    throw new Error("Unauthorized")
  }

  const since = subMonths(new Date(), months)

  const records = await prisma.usageRecord.findMany({
    where: {
      companyId,
      periodStart: { gte: startOfMonth(since) },
    },
    orderBy: { periodStart: "desc" },
  })

  return records.map((r) => ({
    ...r,
    periodLabel: format(r.periodStart, "MMM yyyy"),
    computeHours: +(r.computeUnitSeconds / 3600).toFixed(2),
    storageGB: +((r.rootBranchBytesMonth + r.childBranchBytesMonth) / (1024 * 1024 * 1024)).toFixed(3),
  }))
}
