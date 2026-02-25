"use client"

import { useState } from "react"
import { Loader2, CreditCard, Smartphone } from "lucide-react"
import { toast } from "sonner"
import { initiateStripePayment, initiateFedaPayPayment } from "@/lib/actions/payment-actions"

interface PaymentDialogProps {
  invoiceId: string
  amount: string
  onSuccess?: () => void
}

type PaymentTab = "card" | "mobile"

export function PaymentDialog({ invoiceId, amount, onSuccess }: PaymentDialogProps) {
  const [tab, setTab] = useState<PaymentTab>("card")
  const [loading, setLoading] = useState(false)

  // Mobile Money form state
  const [phone, setPhone] = useState("")
  const [name, setName] = useState("")
  const [country, setCountry] = useState("bj")

  async function handleCardPayment() {
    setLoading(true)
    try {
      const { clientSecret } = await initiateStripePayment(invoiceId)
      // Redirect to Stripe checkout or use Elements
      // For simplicity, we redirect to a checkout page
      window.location.href = `/checkout?secret=${clientSecret}&invoice=${invoiceId}`
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Payment failed")
    } finally {
      setLoading(false)
    }
  }

  async function handleMobilePayment(e: React.FormEvent) {
    e.preventDefault()
    if (!phone || !name) {
      toast.error("Please fill in all fields")
      return
    }

    setLoading(true)
    try {
      const { paymentUrl } = await initiateFedaPayPayment(invoiceId, phone, name, country)
      if (paymentUrl) {
        window.location.href = paymentUrl
      } else {
        toast.success("Payment request sent. Check your phone for confirmation.")
        onSuccess?.()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Payment failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold text-card-foreground mb-1">Pay {amount}</h2>
      <p className="text-sm text-muted-foreground mb-6">Choose your payment method</p>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("card")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === "card"
              ? "bg-indigo-600 text-white"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Card
        </button>
        <button
          onClick={() => setTab("mobile")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === "mobile"
              ? "bg-indigo-600 text-white"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          <Smartphone className="w-4 h-4" />
          Mobile Money
        </button>
      </div>

      {tab === "card" && (
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            You will be redirected to Stripe secure checkout to complete the payment.
          </p>
          <button
            onClick={handleCardPayment}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
            Pay with Card
          </button>
        </div>
      )}

      {tab === "mobile" && (
        <form onSubmit={handleMobilePayment} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              placeholder="+229 97 80 80 80"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Country
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            >
              <option value="bj">Benin</option>
              <option value="ci">Ivory Coast</option>
              <option value="sn">Senegal</option>
              <option value="tg">Togo</option>
              <option value="bf">Burkina Faso</option>
              <option value="ml">Mali</option>
              <option value="ne">Niger</option>
              <option value="gn">Guinea</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
            Pay with Mobile Money
          </button>
        </form>
      )}
    </div>
  )
}
