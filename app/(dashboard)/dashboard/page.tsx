import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Zap, Activity, FileText, CreditCard, Building2, AlertTriangle } from "lucide-react"
import { getCompanyDashboardData, getSuperAdminDashboardData } from "@/lib/actions/dashboard-actions"
import { formatCurrency, formatDate } from "@/lib/utils"

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const isSuperAdmin = session.user.role === "SUPER_ADMIN"

  if (isSuperAdmin) {
    const data = await getSuperAdminDashboardData()

    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Welcome back, {session.user.name}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard icon={CreditCard} label="Total Revenue" value={formatCurrency(data.totalRevenueCents)} color="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400" />
          <StatCard icon={Building2} label="Companies" value={String(data.totalCompanies)} color="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400" />
          <StatCard icon={FileText} label="Pending Invoices" value={String(data.pendingInvoices)} color="bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400" />
          <StatCard icon={AlertTriangle} label="Overdue" value={String(data.overdueInvoices)} color="bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-sm font-medium text-muted-foreground mb-4">Revenue by Method</h2>
            <dl className="space-y-3">
              {Object.entries(data.revenueByMethod).map(([method, info]) => (
                <div key={method} className="flex items-center justify-between">
                  <dt className="text-sm text-card-foreground">
                    {method === "CARD" ? "Card (Stripe)" : "Mobile Money (FedaPay)"}
                  </dt>
                  <dd className="text-sm font-medium text-card-foreground">
                    {formatCurrency(info.total)} ({info.count} txns)
                  </dd>
                </div>
              ))}
              {Object.keys(data.revenueByMethod).length === 0 && (
                <p className="text-sm text-muted-foreground">No payments yet</p>
              )}
            </dl>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-muted-foreground">Recent Companies</h2>
              <Link href="/companies" className="text-xs text-indigo-600 hover:text-indigo-500">View all</Link>
            </div>
            {data.recentCompanies.length === 0 ? (
              <p className="text-sm text-muted-foreground">No companies yet</p>
            ) : (
              <ul className="space-y-3">
                {data.recentCompanies.map((c) => (
                  <li key={c.id} className="flex items-center justify-between">
                    <Link href={`/companies/${c.id}`} className="text-sm font-medium text-card-foreground hover:text-indigo-600">
                      {c.name}
                    </Link>
                    <span className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Company admin dashboard
  const companyId = session.user.companyId
  if (!companyId) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Welcome, {session.user.name}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            Your account is not linked to a company yet. Contact your administrator.
          </p>
        </div>
      </div>
    )
  }

  const data = await getCompanyDashboardData(companyId)
  const computeHours = data.currentUsage
    ? +(data.currentUsage.computeUnitSeconds / 3600).toFixed(1)
    : 0
  const estBill = data.currentUsage?.billedAmountCents || 0

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Welcome back, {session.user.name}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard icon={Activity} label="Compute Hours (MTD)" value={`${computeHours}h`} color="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400" />
        <StatCard icon={Zap} label="Est. Current Bill" value={formatCurrency(estBill)} color="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400" />
        <StatCard icon={FileText} label="Outstanding" value={formatCurrency(data.totalPendingCents)} color="bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400" />
        <StatCard icon={CreditCard} label="Total Paid" value={formatCurrency(data.totalPaidCents)} color="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400" />
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-muted-foreground">Recent Invoices</h2>
          <Link href="/invoices" className="text-xs text-indigo-600 hover:text-indigo-500">View all</Link>
        </div>
        {data.recentInvoices.length === 0 ? (
          <p className="text-sm text-muted-foreground">No invoices yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 text-left font-medium text-muted-foreground">Invoice</th>
                <th className="py-2 text-right font-medium text-muted-foreground">Amount</th>
                <th className="py-2 text-left font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.recentInvoices.map((inv) => (
                <tr key={inv.id} className="border-b border-border last:border-0">
                  <td className="py-2">
                    <Link href={`/invoices/${inv.id}`} className="font-mono text-xs hover:text-indigo-600">{inv.invoiceNumber}</Link>
                  </td>
                  <td className="py-2 text-right font-medium">{formatCurrency(inv.amountCents, inv.currency)}</td>
                  <td className="py-2">
                    <span className="text-xs font-medium">{inv.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  color: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold text-card-foreground">{value}</p>
        </div>
      </div>
    </div>
  )
}
