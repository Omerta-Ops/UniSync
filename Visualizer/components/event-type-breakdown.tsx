"use client"

import type { Event } from "@/lib/data"
import { PieChart } from "lucide-react"

interface EventTypeBreakdownProps {
  events: Event[]
}

export function EventTypeBreakdown({ events }: EventTypeBreakdownProps) {
  // Infer event types from event titles (Workshop, Meetup, Hackathon, etc.)
  const typeData = events.reduce(
    (acc, event) => {
      let type = "Other"
      const title = event.title.toLowerCase()

      if (title.includes("workshop")) type = "Workshop"
      else if (title.includes("meetup") || title.includes("meet")) type = "Meetup"
      else if (title.includes("hackathon") || title.includes("hack")) type = "Hackathon"
      else if (title.includes("seminar") || title.includes("talk")) type = "Seminar"
      else if (title.includes("competition") || title.includes("contest")) type = "Competition"

      acc[type] = (acc[type] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const total = Object.values(typeData).reduce((sum, count) => sum + count, 0)
  const colors = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"]

  return (
    <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-xl transition-all duration-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-chart-4/20">
          <PieChart className="w-5 h-5 text-chart-4" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Event Categories</h3>
          <p className="text-sm text-muted-foreground">Distribution by type</p>
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(typeData)
          .sort(([, a], [, b]) => b - a)
          .map(([type, count], index) => {
            const percentage = Math.round((count / total) * 100)

            return (
              <div
                key={type}
                className="group animate-in slide-in-from-left-4"
                style={{
                  animationDelay: `${index * 100}ms`,
                  animationFillMode: "backwards",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full bg-${colors[index % colors.length]}`}
                      style={{
                        backgroundColor: `hsl(var(--${colors[index % colors.length]}))`,
                      }}
                    />
                    <span className="text-sm font-medium text-foreground">{type}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{percentage}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out group-hover:scale-105"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: `hsl(var(--${colors[index % colors.length]}))`,
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
