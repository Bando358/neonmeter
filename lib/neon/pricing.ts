import { NEON_PRICING } from "@/lib/constants"
import type { ParsedUsageMetrics } from "@/types/neon"

/**
 * Estimate what Neon charges for the given metrics (in USD cents).
 */
export function estimateNeonCostCents(metrics: ParsedUsageMetrics): number {
  const cost =
    metrics.computeUnitSeconds * NEON_PRICING.computeUnitSecond +
    metrics.rootBranchBytesMonth * NEON_PRICING.rootBranchByteMonth +
    metrics.childBranchBytesMonth * NEON_PRICING.childBranchByteMonth +
    metrics.instantRestoreBytesMonth * NEON_PRICING.instantRestoreByteMonth +
    metrics.writtenDataBytes * NEON_PRICING.writtenDataByte +
    metrics.publicNetworkTransferBytes * NEON_PRICING.publicNetworkTransferByte +
    metrics.privateNetworkTransferBytes * NEON_PRICING.privateNetworkTransferByte +
    metrics.extraBranchesMonth * NEON_PRICING.extraBranchMonth

  // Convert dollars to cents
  return Math.round(cost * 100)
}

/**
 * Apply markup to a cost in cents.
 */
export function applyMarkup(costCents: number, markupPercent: number): number {
  return Math.round(costCents * (1 + markupPercent / 100))
}
