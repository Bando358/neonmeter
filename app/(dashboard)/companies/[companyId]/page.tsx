import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { getCompany } from "@/lib/actions/company-actions"
import { formatDate } from "@/lib/utils"
import { Pencil, Shield, Activity } from "lucide-react"

interface Props {
  params: Promise<{ companyId: string }>
}

export default async function CompanyDetailPage({ params }: Props) {
  const session = await auth()
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/dashboard")

  const { companyId } = await params
  const company = await getCompany(companyId)
  if (!company) notFound()

  const statusColors = {
    ACTIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    SUSPENDED: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{company.name}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {company.email || company.slug}
          </p>
        </div>
        <Link
          href={`/companies/${companyId}/edit`}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <Pencil className="w-4 h-4" />
          Edit
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-4">Company Details</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-slate-500">Status</dt>
              <dd>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[company.status]}`}>
                  {company.status}
                </span>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-slate-500">Currency</dt>
              <dd className="text-sm font-medium text-card-foreground">{company.currency}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-slate-500">Markup</dt>
              <dd className="text-sm font-medium text-card-foreground">{company.billingMarkupPercentage}%</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-slate-500">Created</dt>
              <dd className="text-sm font-medium text-card-foreground">{formatDate(company.createdAt)}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-4">Neon Configuration</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-slate-500">Project ID</dt>
              <dd className="text-sm font-mono font-medium text-card-foreground">{company.neonProjectId}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-slate-500">Org ID</dt>
              <dd className="text-sm font-mono font-medium text-card-foreground">{company.neonOrgId || "N/A"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-slate-500">API Key</dt>
              <dd className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-sm text-emerald-600 dark:text-emerald-400">
                  {company.hasApiKey ? "Encrypted" : "Not set"}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-4">Statistics</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-slate-500">Users</dt>
              <dd className="text-sm font-medium text-card-foreground">{company._count.users}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-slate-500">Invoices</dt>
              <dd className="text-sm font-medium text-card-foreground">{company._count.invoices}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-slate-500">Usage Records</dt>
              <dd className="text-sm font-medium text-card-foreground">{company._count.usageRecords}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <button className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              <Activity className="w-4 h-4" />
              Fetch Latest Usage
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
