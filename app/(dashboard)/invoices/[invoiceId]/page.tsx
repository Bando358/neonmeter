import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { Download } from "lucide-react"
import { getInvoice } from "@/lib/actions/invoice-actions"
import { formatCurrency, formatDate, formatDateFull } from "@/lib/utils"

interface Props {
  params: Promise<{ invoiceId: string }>
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  PAID: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  FAILED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  OVERDUE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  CANCELLED: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
}

const paymentStatusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  SUCCEEDED: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-red-100 text-red-700",
  REFUNDED: "bg-blue-100 text-blue-700",
}

export default async function InvoiceDetailPage({ params }: Props) {
  const session = await auth()
  if (!session) redirect("/login")

  const { invoiceId } = await params
  const invoice = await getInvoice(invoiceId)
  if (!invoice) notFound()

  const canPay = invoice.status === "PENDING" || invoice.status === "OVERDUE"

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
            {invoice.invoiceNumber}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {invoice.company.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/api/invoices/${invoiceId}/pdf`}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            target="_blank"
          >
            <Download className="w-4 h-4" />
            PDF
          </Link>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusColors[invoice.status]}`}>
            {invoice.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-8">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-4">Invoice Details</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-slate-500">Period</dt>
              <dd className="text-sm font-medium text-card-foreground">
                {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-slate-500">Amount</dt>
              <dd className="text-lg font-semibold text-card-foreground">
                {formatCurrency(invoice.amountCents, invoice.currency)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-slate-500">Due Date</dt>
              <dd className="text-sm font-medium text-card-foreground">{formatDate(invoice.dueDate)}</dd>
            </div>
            {invoice.paidAt && (
              <div className="flex justify-between">
                <dt className="text-sm text-slate-500">Paid At</dt>
                <dd className="text-sm font-medium text-emerald-600">{formatDateFull(invoice.paidAt)}</dd>
              </div>
            )}
          </dl>
        </div>

        {canPay && (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-6 dark:border-indigo-800 dark:bg-indigo-950/30">
            <h2 className="text-sm font-medium text-indigo-900 dark:text-indigo-300 mb-4">Pay Now</h2>
            <p className="text-sm text-indigo-700 dark:text-indigo-400 mb-4">
              Choose a payment method to settle this invoice.
            </p>
            <div className="space-y-2">
              <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700">
                Pay with Card (Stripe)
              </button>
              <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-300 bg-white px-4 py-2.5 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300">
                Pay with Mobile Money
              </button>
            </div>
          </div>
        )}
      </div>

      {invoice.payments.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-medium text-card-foreground">Payment History</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Method</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Provider</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Amount</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {invoice.payments.map((payment) => (
                <tr key={payment.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2 text-card-foreground">{payment.method}</td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {payment.provider}
                    {payment.mobileMoneyOperator && ` (${payment.mobileMoneyOperator})`}
                  </td>
                  <td className="px-4 py-2 text-right font-medium text-card-foreground">
                    {formatCurrency(payment.amountCents, payment.currency)}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${paymentStatusColors[payment.status]}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {payment.paidAt ? formatDateFull(payment.paidAt) : formatDate(payment.createdAt)}
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
