"use client"

import type { Event } from "@/lib/data"
import { Calendar } from "lucide-react"

interface EventsHeatmapProps {
  events: Event[]
}

export function EventsHeatmap({ events }: EventsHeatmapProps) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  // Count events by day of week
  const dayData = events.reduce(
    (acc, event) => {
      const day = new Date(event.date).getDay()
      acc[day] = (acc[day] || 0) + 1
      return acc
    },
    {} as Record<number, number>,
  )

  const maxCount = Math.max(...Object.values(dayData), 1)

  return (
    <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-xl transition-all duration-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-chart-3/20">
          <Calendar className="w-5 h-5 text-chart-3" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Events by Day</h3>
          <p className="text-sm text-muted-foreground">Weekly distribution pattern</p>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => {
          const count = dayData[index] || 0
          const intensity = count / maxCount
          const bgOpacity = Math.max(0.1, intensity)

          return (
            <div
              key={day}
              className="group relative flex flex-col items-center gap-2 p-3 rounded-xl hover:scale-105 transition-all duration-300 cursor-pointer"
              style={{
                backgroundColor: `rgba(139, 92, 246, ${bgOpacity * 0.3})`,
                borderColor: `rgba(139, 92, 246, ${bgOpacity})`,
                borderWidth: "2px",
              }}
            >
              <span className="text-xs font-medium text-muted-foreground">{day}</span>
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-chart-3 to-chart-4 font-bold text-sm">
                {count}
              </div>

              {/* Tooltip */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                <div className="bg-popover border border-border rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap shadow-lg">
                  {count} {count === 1 ? "event" : "events"}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
