"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { encryptApiKey } from "@/lib/crypto"
import { slugify } from "@/lib/utils"
import {
  createCompanySchema,
  updateCompanySchema,
  type CreateCompanyInput,
  type UpdateCompanyInput,
} from "@/lib/validators/company"
import { revalidatePath } from "next/cache"

async function requireSuperAdmin() {
  const session = await auth()
  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized: Super Admin access required")
  }
  return session
}

export async function createCompany(data: CreateCompanyInput) {
  await requireSuperAdmin()

  const parsed = createCompanySchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.message }
  }

  const { neonApiKey, ...rest } = parsed.data

  // Generate unique slug
  let slug = slugify(rest.name)
  const existing = await prisma.company.findUnique({ where: { slug } })
  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`
  }

  // Encrypt the Neon API key
  const { encrypted, iv, tag } = encryptApiKey(neonApiKey)

  const company = await prisma.company.create({
    data: {
      name: rest.name,
      slug,
      email: rest.email || null,
      neonProjectId: rest.neonProjectId,
      neonApiKeyEncrypted: encrypted,
      neonApiKeyIv: iv,
      neonApiKeyTag: tag,
      neonOrgId: rest.neonOrgId || null,
      billingMarkupPercentage: rest.billingMarkupPercentage,
      currency: rest.currency,
    },
  })

  revalidatePath("/companies")
  return { success: true, companyId: company.id }
}

export async function updateCompany(companyId: string, data: UpdateCompanyInput) {
  await requireSuperAdmin()

  const parsed = updateCompanySchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.message }
  }

  const { neonApiKey, ...rest } = parsed.data

  // Build update data
  const updateData: Record<string, unknown> = {}

  if (rest.name !== undefined) {
    updateData.name = rest.name
    updateData.slug = slugify(rest.name)
  }
  if (rest.email !== undefined) updateData.email = rest.email || null
  if (rest.neonProjectId !== undefined) updateData.neonProjectId = rest.neonProjectId
  if (rest.neonOrgId !== undefined) updateData.neonOrgId = rest.neonOrgId || null
  if (rest.billingMarkupPercentage !== undefined) updateData.billingMarkupPercentage = rest.billingMarkupPercentage
  if (rest.currency !== undefined) updateData.currency = rest.currency
  if (rest.status !== undefined) updateData.status = rest.status
  if (rest.alertThresholdAmount !== undefined) updateData.alertThresholdAmount = rest.alertThresholdAmount

  // If a new API key is provided, encrypt it
  if (neonApiKey && neonApiKey.length > 0) {
    const { encrypted, iv, tag } = encryptApiKey(neonApiKey)
    updateData.neonApiKeyEncrypted = encrypted
    updateData.neonApiKeyIv = iv
    updateData.neonApiKeyTag = tag
  }

  await prisma.company.update({
    where: { id: companyId },
    data: updateData,
  })

  revalidatePath("/companies")
  revalidatePath(`/companies/${companyId}`)
  return { success: true }
}

export async function getCompany(companyId: string) {
  await requireSuperAdmin()

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      _count: {
        select: { users: true, invoices: true, usageRecords: true },
      },
    },
  })

  if (!company) return null

  // Never return the encrypted key
  const { neonApiKeyEncrypted, neonApiKeyIv, neonApiKeyTag, ...safeCompany } = company
  return { ...safeCompany, hasApiKey: !!neonApiKeyEncrypted }
}

export async function listCompanies() {
  await requireSuperAdmin()

  const companies = await prisma.company.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      email: true,
      neonProjectId: true,
      status: true,
      currency: true,
      billingMarkupPercentage: true,
      createdAt: true,
      _count: {
        select: { users: true, invoices: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return companies
}

export async function deleteCompany(companyId: string) {
  await requireSuperAdmin()

  await prisma.company.delete({
    where: { id: companyId },
  })

  revalidatePath("/companies")
  return { success: true }
}
