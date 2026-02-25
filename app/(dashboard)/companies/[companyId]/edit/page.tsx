import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { getCompany } from "@/lib/actions/company-actions"
import { CompanyForm } from "@/components/company-form"

interface Props {
  params: Promise<{ companyId: string }>
}

export default async function EditCompanyPage({ params }: Props) {
  const session = await auth()
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/dashboard")

  const { companyId } = await params
  const company = await getCompany(companyId)
  if (!company) notFound()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Company</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Update {company.name}&apos;s configuration
        </p>
      </div>

      <CompanyForm
        mode="edit"
        companyId={companyId}
        defaultValues={{
          name: company.name,
          email: company.email || "",
          neonProjectId: company.neonProjectId,
          neonOrgId: company.neonOrgId || "",
          billingMarkupPercentage: company.billingMarkupPercentage,
          currency: company.currency,
          status: company.status,
        }}
      />
    </div>
  )
}
