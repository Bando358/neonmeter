"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { createCompany, updateCompany } from "@/lib/actions/company-actions"
import type { CreateCompanyInput } from "@/lib/validators/company"

interface CompanyFormProps {
  mode: "create" | "edit"
  companyId?: string
  defaultValues?: Partial<CreateCompanyInput> & { status?: string }
}

export function CompanyForm({ mode, companyId, defaultValues }: CompanyFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      neonProjectId: formData.get("neonProjectId") as string,
      neonApiKey: formData.get("neonApiKey") as string,
      neonOrgId: formData.get("neonOrgId") as string,
      billingMarkupPercentage: Number(formData.get("billingMarkupPercentage")),
      currency: formData.get("currency") as "USD" | "EUR" | "XOF",
    }

    try {
      if (mode === "create") {
        const result = await createCompany(data)
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success("Company created successfully")
          router.push("/companies")
        }
      } else if (companyId) {
        const status = formData.get("status") as string
        const result = await updateCompany(companyId, { ...data, status: status as "ACTIVE" | "SUSPENDED" | "CANCELLED" })
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success("Company updated successfully")
          router.push(`/companies/${companyId}`)
        }
      }
    } catch {
      toast.error("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Company Name *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={defaultValues?.name}
            className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            placeholder="Acme Corp"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Contact Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={defaultValues?.email}
            className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            placeholder="billing@acme.com"
          />
        </div>

        <div>
          <label htmlFor="currency" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Billing Currency
          </label>
          <select
            id="currency"
            name="currency"
            defaultValue={defaultValues?.currency || "USD"}
            className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (&#8364;)</option>
            <option value="XOF">XOF (FCFA)</option>
          </select>
        </div>

        <div>
          <label htmlFor="neonProjectId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Neon Project ID *
          </label>
          <input
            id="neonProjectId"
            name="neonProjectId"
            type="text"
            required
            defaultValue={defaultValues?.neonProjectId}
            className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            placeholder="proj_abc123"
          />
        </div>

        <div>
          <label htmlFor="neonOrgId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Neon Org ID
          </label>
          <input
            id="neonOrgId"
            name="neonOrgId"
            type="text"
            defaultValue={defaultValues?.neonOrgId}
            className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            placeholder="org_abc123 (optional)"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="neonApiKey" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Neon API Key {mode === "create" ? "*" : "(leave blank to keep existing)"}
          </label>
          <input
            id="neonApiKey"
            name="neonApiKey"
            type="password"
            required={mode === "create"}
            className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white font-mono"
            placeholder={mode === "edit" ? "Enter new key to rotate..." : "napi_..."}
          />
          <p className="mt-1 text-xs text-slate-500">Encrypted at rest with AES-256-GCM</p>
        </div>

        <div>
          <label htmlFor="billingMarkupPercentage" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Billing Markup (%)
          </label>
          <input
            id="billingMarkupPercentage"
            name="billingMarkupPercentage"
            type="number"
            min="0"
            max="100"
            step="0.1"
            defaultValue={defaultValues?.billingMarkupPercentage ?? 20}
            className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
          <p className="mt-1 text-xs text-slate-500">Applied on top of Neon&apos;s cost</p>
        </div>

        {mode === "edit" && (
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={defaultValues?.status || "ACTIVE"}
              className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            >
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {mode === "create" ? "Create Company" : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
