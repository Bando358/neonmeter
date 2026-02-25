import type { NeonConsumptionResponse, ParsedUsageMetrics } from "@/types/neon"

const METRIC_MAP: Record<string, keyof ParsedUsageMetrics> = {
  compute_unit_seconds: "computeUnitSeconds",
  root_branch_bytes_month: "rootBranchBytesMonth",
  child_branch_bytes_month: "childBranchBytesMonth",
  instant_restore_bytes_month: "instantRestoreBytesMonth",
  public_network_transfer_bytes: "publicNetworkTransferBytes",
  private_network_transfer_bytes: "privateNetworkTransferBytes",
  written_data_bytes: "writtenDataBytes",
  extra_branches_month: "extraBranchesMonth",
}

function emptyMetrics(): ParsedUsageMetrics {
  return {
    computeUnitSeconds: 0,
    rootBranchBytesMonth: 0,
    childBranchBytesMonth: 0,
    instantRestoreBytesMonth: 0,
    publicNetworkTransferBytes: 0,
    privateNetworkTransferBytes: 0,
    writtenDataBytes: 0,
    extraBranchesMonth: 0,
  }
}

/**
 * Parse Neon consumption response for a specific project, summing all periods.
 */
export function parseConsumption(
  response: NeonConsumptionResponse,
  projectId: string
): ParsedUsageMetrics {
  const project = response.projects.find((p) => p.project_id === projectId)
  if (!project) return emptyMetrics()

  const result = emptyMetrics()

  for (const period of project.periods) {
    for (const entry of period.consumption) {
      for (const metric of entry.metrics) {
        const key = METRIC_MAP[metric.metric_name]
        if (key) {
          result[key] += metric.value
        }
      }
    }
  }

  return result
}
