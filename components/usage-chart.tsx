"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface UsageData {
  periodLabel: string
  computeHours: number
  storageGB: number
  billedAmountCents: number
}

export function UsageChart({ data }: { data: UsageData[] }) {
  const reversed = [...data].reverse()

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Compute Hours</h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={reversed}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="periodLabel" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="computeHours"
              stroke="#6366f1"
              fill="#6366f1"
              fillOpacity={0.1}
              name="Compute Hours"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Storage (GB)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={reversed}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="periodLabel" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="storageGB"
              stroke="#8b5cf6"
              fill="#8b5cf6"
              fillOpacity={0.1}
              name="Storage GB"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
