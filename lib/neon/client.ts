import { NEON_API_BASE } from "@/lib/constants"
import type { NeonConsumptionResponse } from "@/types/neon"

export interface FetchConsumptionParams {
  apiKey: string
  orgId?: string
  projectIds?: string[]
  from: string // ISO 8601
  to: string
  granularity?: "hourly" | "daily" | "monthly"
}

export async function fetchNeonConsumption(
  params: FetchConsumptionParams
): Promise<NeonConsumptionResponse> {
  const url = new URL(`${NEON_API_BASE}/consumption_history/v2/projects`)
  url.searchParams.set("from", params.from)
  url.searchParams.set("to", params.to)
  url.searchParams.set("granularity", params.granularity || "monthly")

  if (params.orgId) {
    url.searchParams.set("org_id", params.orgId)
  }

  if (params.projectIds) {
    for (const id of params.projectIds) {
      url.searchParams.append("project_ids", id)
    }
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(
      `Neon API error ${response.status}: ${text.slice(0, 200)}`
    )
  }

  return response.json()
}
