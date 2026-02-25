import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Plus } from "lucide-react"
import { listCompanies } from "@/lib/actions/company-actions"
import { formatDate } from "@/lib/utils"

export default async function CompaniesPage() {
  const session = await auth()
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/dashboard")

  const companies = await listCompanies()

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    SUSPENDED: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Companies</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage client companies and their Neon configurations
          </p>
        </div>
        <Link
          href="/companies/new"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" />
          Add Company
        </Link>
      </div>

      {companies.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            No companies yet. Add your first company to start tracking usage.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Company</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Project ID</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Markup</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Currency</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Created</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/companies/${company.id}`}
                      className="font-medium text-card-foreground hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                      {company.name}
                    </Link>
                    {company.email && (
                      <p className="text-xs text-muted-foreground mt-0.5">{company.email}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {company.neonProjectId}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[company.status]}`}>
                      {company.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{company.billingMarkupPercentage}%</td>
                  <td className="px-4 py-3 text-muted-foreground">{company.currency}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(company.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
