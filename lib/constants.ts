export const APP_NAME = "NeonMeter"
export const APP_DESCRIPTION = "Automated billing for Neon PostgreSQL usage"

export const DEFAULT_MARKUP_PERCENTAGE = 20.0
export const DEFAULT_CURRENCY = "USD" as const

// Neon pricing (approximate, per unit)
export const NEON_PRICING = {
  computeUnitSecond: 0.0000104, // ~$0.0375/hour for 1 CU
  rootBranchByteMonth: 0.000000000125, // ~$0.125/GiB-month
  childBranchByteMonth: 0.000000000125,
  instantRestoreByteMonth: 0.000000000125,
  writtenDataByte: 0.00000000009, // ~$0.096/GiB
  publicNetworkTransferByte: 0.00000000009, // ~$0.09/GiB
  privateNetworkTransferByte: 0.0,
  extraBranchMonth: 0.0, // included in plan
} as const

// Invoice due date: days after generation
export const INVOICE_DUE_DAYS = 15

// Overdue grace period before suspension (days)
export const OVERDUE_GRACE_DAYS = 7

// Neon API
export const NEON_API_BASE = "https://console.neon.tech/api/v2"
export const NEON_API_RATE_LIMIT = 50 // requests per minute
