export interface NeonMetric {
  metric_name: string
  value: number
}

export interface NeonConsumptionEntry {
  timeframe_start: string
  timeframe_end: string
  metrics: NeonMetric[]
}

export interface NeonPeriod {
  period_id: string
  period_plan: string
  period_start: string
  consumption: NeonConsumptionEntry[]
}

export interface NeonProject {
  project_id: string
  periods: NeonPeriod[]
}

export interface NeonConsumptionResponse {
  projects: NeonProject[]
  pagination?: { cursor?: string }
}

export interface ParsedUsageMetrics {
  computeUnitSeconds: number
  rootBranchBytesMonth: number
  childBranchBytesMonth: number
  instantRestoreBytesMonth: number
  publicNetworkTransferBytes: number
  privateNetworkTransferBytes: number
  writtenDataBytes: number
  extraBranchesMonth: number
}
