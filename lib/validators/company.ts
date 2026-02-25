import { z } from "zod"

export const createCompanySchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  neonProjectId: z.string().min(1, "Neon Project ID is required"),
  neonApiKey: z.string().min(1, "Neon API Key is required"),
  neonOrgId: z.string().optional().or(z.literal("")),
  billingMarkupPercentage: z.coerce.number().min(0).max(100).default(20),
  currency: z.enum(["USD", "EUR", "XOF"]).default("USD"),
})

export const updateCompanySchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  neonProjectId: z.string().min(1, "Neon Project ID is required").optional(),
  neonApiKey: z.string().optional().or(z.literal("")), // empty means keep existing
  neonOrgId: z.string().optional().or(z.literal("")),
  billingMarkupPercentage: z.coerce.number().min(0).max(100).optional(),
  currency: z.enum(["USD", "EUR", "XOF"]).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "CANCELLED"]).optional(),
  alertThresholdAmount: z.coerce.number().int().min(0).nullable().optional(),
})

export type CreateCompanyInput = z.infer<typeof createCompanySchema>
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>
