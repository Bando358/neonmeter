import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Zap } from "lucide-react"

export default async function Home() {
  const session = await auth()
  if (session) redirect("/dashboard")

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <main className="flex flex-1 w-full max-w-4xl flex-col items-center justify-center py-20 px-6 text-center">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white">
            <Zap className="w-6 h-6" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            NeonMeter
          </h1>
        </div>

        <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mb-4">
          Automated usage-based billing for Neon PostgreSQL databases.
        </p>
        <p className="text-base text-slate-500 dark:text-slate-400 max-w-xl mb-10">
          Track compute hours, storage, and data transfer. Generate invoices automatically.
          Accept payments via Card and Mobile Money.
        </p>

        <div className="flex gap-4">
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-indigo-600 px-8 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-8 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
          >
            Get Started
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3 w-full max-w-3xl">
          {[
            { title: "Usage Tracking", desc: "Real-time compute, storage & transfer metrics from Neon API" },
            { title: "Auto Invoicing", desc: "Monthly invoices generated with configurable markup per client" },
            { title: "Dual Payments", desc: "Stripe for cards, FedaPay for Orange/MTN/Wave Mobile Money" },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-slate-200 bg-white p-6 text-left dark:border-slate-700 dark:bg-slate-800"
            >
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
