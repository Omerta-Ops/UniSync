"use client"

import type { Event } from "@/lib/data"
import { TrendingUp } from "lucide-react"

interface ParticipationTrendProps {
  events: Event[]
}

export function ParticipationTrend({ events }: ParticipationTrendProps) {
  const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Group by month and calculate average participation (simulated)
  const monthlyParticipation = sortedEvents.reduce(
    (acc, event) => {
      const month = new Date(event.date).toLocaleDateString("en-US", { month: "short" })
      if (!acc[month]) {
        acc[month] = { total: 0, count: 0 }
      }
      // Generate realistic participation numbers based on event type
      const participation =
        event.type === "Hackathon" || event.type === "Competition"
          ? Math.floor(Math.random() * 50) + 50 // 50-100 for big events
          : Math.floor(Math.random() * 30) + 20 // 20-50 for regular events

      acc[month].total += participation
      acc[month].count += 1
      return acc
    },
    {} as Record<string, { total: number; count: number }>,
  )

  const chartData = Object.entries(monthlyParticipation).map(([month, data]) => ({
    month,
    avg: Math.round(data.total / data.count),
  }))

  const maxAvg = Math.max(...chartData.map((d) => d.avg))

  return (
    <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-xl transition-all duration-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-chart-2/20">
          <TrendingUp className="w-5 h-5 text-chart-2" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Participation Trend</h3>
          <p className="text-sm text-muted-foreground">Average attendees per month</p>
        </div>
      </div>

      <div className="relative h-48 flex items-end gap-3">
        {chartData.map((data, index) => {
          const height = (data.avg / maxAvg) * 100

          return (
            <div key={data.month} className="flex-1 flex flex-col items-center gap-2 group">
              <div
                className="w-full bg-gradient-to-t from-chart-2 to-chart-3 rounded-t-lg hover:scale-105 transition-all duration-300 cursor-pointer relative"
                style={{
                  height: `${height}%`,
                  animationDelay: `${index * 100}ms`,
                }}
              >
                {/* Tooltip */}
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                  <div className="bg-popover border border-border rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap shadow-lg">
                    <div className="font-bold">{data.avg} avg</div>
                    <div className="text-muted-foreground">{data.month}</div>
                  </div>
                </div>
              </div>
              <span className="text-xs font-medium text-muted-foreground">{data.month}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
