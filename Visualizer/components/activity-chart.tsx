"use client"

import type { Event } from "@/lib/data"
import { BarChart3 } from "lucide-react"

interface ActivityChartProps {
  events: Event[]
}

export function ActivityChart({ events }: ActivityChartProps) {
  // Group events by month
  const monthlyData = events.reduce(
    (acc, event) => {
      const month = new Date(event.date).toLocaleDateString("en-US", { month: "short" })
      acc[month] = (acc[month] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const months = Object.keys(monthlyData)
  const maxCount = Math.max(...Object.values(monthlyData))

  return (
    <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-xl transition-all duration-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-chart-1/20">
          <BarChart3 className="w-5 h-5 text-chart-1" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Event Activity</h3>
          <p className="text-sm text-muted-foreground">Monthly distribution</p>
        </div>
      </div>

      <div className="space-y-4">
        {months.map((month, index) => {
          const count = monthlyData[month]
          const percentage = (count / maxCount) * 100

          return (
            <div
              key={month}
              className="animate-in slide-in-from-left-4"
              style={{
                animationDelay: `${index * 100}ms`,
                animationFillMode: "backwards",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">{month}</span>
                <span className="text-sm text-muted-foreground">{count} events</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-chart-1 to-chart-2 rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${percentage}%`,
                    animationDelay: `${index * 100}ms`,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
