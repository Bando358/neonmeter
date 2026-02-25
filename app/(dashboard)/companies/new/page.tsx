import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { CompanyForm } from "@/components/company-form"

export default async function NewCompanyPage() {
  const session = await auth()
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/dashboard")

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Add Company</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Register a new client company with their Neon project details
        </p>
      </div>

      <CompanyForm mode="create" />
    </div>
  )
}
