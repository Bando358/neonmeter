import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { listPayments } from "@/lib/actions/payment-actions"
import { formatCurrency, formatDateFull } from "@/lib/utils"

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  SUCCEEDED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  FAILED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  REFUNDED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
}

export default async function PaymentsPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const payments = await listPayments()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Payments</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Payment history and transaction details
        </p>
      </div>

      {payments.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            No payments yet. Pay invoices using Card or Mobile Money.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Invoice</th>
                {session.user.role === "SUPER_ADMIN" && (
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Company</th>
                )}
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Method</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Provider</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Amount</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-card-foreground">
                    {payment.invoice.invoiceNumber}
                  </td>
                  {session.user.role === "SUPER_ADMIN" && (
                    <td className="px-4 py-3 text-muted-foreground">
                      {payment.invoice.company.name}
                    </td>
                  )}
                  <td className="px-4 py-3 text-card-foreground">{payment.method.replace("_", " ")}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {payment.provider}
                    {payment.mobileMoneyOperator && ` (${payment.mobileMoneyOperator})`}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-card-foreground">
                    {formatCurrency(payment.amountCents, payment.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[payment.status]}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {payment.paidAt ? formatDateFull(payment.paidAt) : formatDateFull(payment.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
