"use server"

import prisma from "@/lib/prisma"
import { startOfMonth, subMonths } from "date-fns"

export async function getCompanyDashboardData(companyId: string) {
  const now = new Date()
  const currentMonthStart = startOfMonth(now)

  const [
    currentUsage,
    recentInvoices,
    paidTotal,
    pendingTotal,
  ] = await Promise.all([
    // Current month usage
    prisma.usageRecord.findUnique({
      where: {
        companyId_periodStart: {
          companyId,
          periodStart: currentMonthStart,
        },
      },
    }),
    // Recent invoices
    prisma.invoice.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    // Total paid
    prisma.payment.aggregate({
      where: {
        invoice: { companyId },
        status: "SUCCEEDED",
      },
      _sum: { amountCents: true },
    }),
    // Pending invoices total
    prisma.invoice.aggregate({
      where: {
        companyId,
        status: { in: ["PENDING", "OVERDUE"] },
      },
      _sum: { amountCents: true },
    }),
  ])

  return {
    currentUsage,
    recentInvoices,
    totalPaidCents: paidTotal._sum.amountCents || 0,
    totalPendingCents: pendingTotal._sum.amountCents || 0,
  }
}

export async function getSuperAdminDashboardData() {
  const now = new Date()
  const sixMonthsAgo = subMonths(now, 6)

  const [
    companyStats,
    revenueByMethod,
    totalRevenue,
    pendingInvoices,
    overdueInvoices,
    recentCompanies,
    monthlyRevenue,
  ] = await Promise.all([
    // Company count by status
    prisma.company.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    // Revenue by payment method
    prisma.payment.groupBy({
      by: ["method"],
      where: { status: "SUCCEEDED" },
      _sum: { amountCents: true },
      _count: { id: true },
    }),
    // Total revenue
    prisma.payment.aggregate({
      where: { status: "SUCCEEDED" },
      _sum: { amountCents: true },
    }),
    // Pending invoices count
    prisma.invoice.count({
      where: { status: "PENDING" },
    }),
    // Overdue invoices count
    prisma.invoice.count({
      where: { status: "OVERDUE" },
    }),
    // Recent companies
    prisma.company.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        _count: { select: { invoices: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    // Monthly revenue for last 6 months
    prisma.payment.groupBy({
      by: ["createdAt"],
      where: {
        status: "SUCCEEDED",
        createdAt: { gte: sixMonthsAgo },
      },
      _sum: { amountCents: true },
    }),
  ])

  const companyStatusMap: Record<string, number> = {}
  for (const stat of companyStats) {
    companyStatusMap[stat.status] = stat._count.id
  }

  const revenueByMethodMap: Record<string, { total: number; count: number }> = {}
  for (const rev of revenueByMethod) {
    revenueByMethodMap[rev.method] = {
      total: rev._sum.amountCents || 0,
      count: rev._count.id,
    }
  }

  return {
    companies: companyStatusMap,
    totalCompanies: Object.values(companyStatusMap).reduce((a, b) => a + b, 0),
    revenueByMethod: revenueByMethodMap,
    totalRevenueCents: totalRevenue._sum.amountCents || 0,
    pendingInvoices,
    overdueInvoices,
    recentCompanies,
  }
}
