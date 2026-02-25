import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { listInvoices } from "@/lib/actions/invoice-actions"
import { formatCurrency, formatDate } from "@/lib/utils"

const statusColors: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  PAID: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  FAILED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  OVERDUE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  CANCELLED: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
}

export default async function InvoicesPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const invoices = await listInvoices()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Invoices</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          View and manage your billing invoices
        </p>
      </div>

      {invoices.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            No invoices yet. Invoices are generated automatically at the beginning of each month.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Invoice #</th>
                {session.user.role === "SUPER_ADMIN" && (
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Company</th>
                )}
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Period</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Amount</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="font-medium font-mono text-card-foreground hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                      {invoice.invoiceNumber}
                    </Link>
                  </td>
                  {session.user.role === "SUPER_ADMIN" && (
                    <td className="px-4 py-3 text-muted-foreground">{invoice.company.name}</td>
                  )}
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-card-foreground">
                    {formatCurrency(invoice.amountCents, invoice.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[invoice.status]}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(invoice.dueDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
