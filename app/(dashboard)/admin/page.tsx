import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getSuperAdminDashboardData } from "@/lib/actions/dashboard-actions"
import { formatCurrency } from "@/lib/utils"

export default async function AdminPage() {
  const session = await auth()
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/dashboard")

  const data = await getSuperAdminDashboardData()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Overview</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Global statistics and revenue overview
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Total Revenue</p>
          <p className="text-2xl font-semibold text-card-foreground mt-1">
            {formatCurrency(data.totalRevenueCents)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Active Companies</p>
          <p className="text-2xl font-semibold text-card-foreground mt-1">
            {data.companies["ACTIVE"] || 0}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Suspended</p>
          <p className="text-2xl font-semibold text-amber-600 mt-1">
            {data.companies["SUSPENDED"] || 0}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Overdue Invoices</p>
          <p className="text-2xl font-semibold text-red-600 mt-1">{data.overdueInvoices}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-card-foreground mb-4">Revenue by Payment Method</h2>
          {Object.keys(data.revenueByMethod).length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments processed yet.</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(data.revenueByMethod).map(([method, info]) => {
                const percentage = data.totalRevenueCents > 0
                  ? Math.round((info.total / data.totalRevenueCents) * 100)
                  : 0
                return (
                  <div key={method}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-card-foreground">
                        {method === "CARD" ? "Card (Stripe)" : "Mobile Money (FedaPay)"}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {formatCurrency(info.total)} ({info.count} txns)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${method === "CARD" ? "bg-indigo-500" : "bg-emerald-500"}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-card-foreground mb-4">Company Status Distribution</h2>
          <div className="space-y-3">
            {[
              { status: "ACTIVE", color: "bg-emerald-500" },
              { status: "SUSPENDED", color: "bg-amber-500" },
              { status: "CANCELLED", color: "bg-red-500" },
            ].map(({ status, color }) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${color}`} />
                  <span className="text-sm text-card-foreground">{status}</span>
                </div>
                <span className="text-sm font-medium text-card-foreground">
                  {data.companies[status] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
