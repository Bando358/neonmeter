import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getUsageHistory } from "@/lib/actions/usage-actions"
import { UsageChart } from "@/components/usage-chart"
import { formatCurrency } from "@/lib/utils"
import type { Currency } from "@/app/generated/prisma/client"

export default async function UsagePage() {
  const session = await auth()
  if (!session) redirect("/login")

  const companyId = session.user.companyId

  if (!companyId && session.user.role !== "SUPER_ADMIN") {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Usage</h1>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            Your account is not linked to a company. Contact your administrator.
          </p>
        </div>
      </div>
    )
  }

  // For super admin without company, show a message to select a company
  if (!companyId) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Usage</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Select a company from the Companies page to view its usage.
          </p>
        </div>
      </div>
    )
  }

  const usageData = await getUsageHistory(companyId)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Usage</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Track your Neon PostgreSQL resource consumption
        </p>
      </div>

      {usageData.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            No usage data yet. Data is fetched daily from the Neon API.
          </p>
        </div>
      ) : (
        <>
          <UsageChart data={usageData} />

          <div className="mt-6 rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Period</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Compute (h)</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Storage (GB)</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Neon Cost</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Billed</th>
                </tr>
              </thead>
              <tbody>
                {usageData.map((record) => (
                  <tr key={record.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium text-card-foreground">{record.periodLabel}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{record.computeHours}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{record.storageGB}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {formatCurrency(record.estimatedCostNeonCents, "USD" as Currency)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-card-foreground">
                      {formatCurrency(record.billedAmountCents, "USD" as Currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
