"use client"

import { type Event, clubs } from "@/lib/data"
import { PieChart } from "lucide-react"
import { useState, useEffect } from "react"

interface ClubDistributionProps {
  events: Event[]
}

export function ClubDistribution({ events }: ClubDistributionProps) {
  // Count events per club
  const clubCounts = events.reduce(
    (acc, event) => {
      acc[event.club] = (acc[event.club] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const total = events.length
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const pieData = clubs.map((club) => {
    const count = clubCounts[club.id] || 0
    const percentage = total > 0 ? (count / total) * 100 : 0
    return { club, count, percentage }
  })

  // Calculate cumulative angles for pie chart
  let cumulativeAngle = 0
  const segments = pieData.map((data) => {
    const startAngle = cumulativeAngle
    const angle = (data.percentage / 100) * 360
    cumulativeAngle += angle
    return { ...data, startAngle, angle }
  })

  return (
    <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-xl transition-all duration-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-chart-4/20">
          <PieChart className="w-5 h-5 text-chart-4" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Club Distribution</h3>
          <p className="text-sm text-muted-foreground">Events by club</p>
        </div>
      </div>

      <div className="flex justify-center mb-8">
        <div className="relative w-48 h-48">
          <svg viewBox="0 0 100 100" className="transform -rotate-90">
            {segments.map((segment, index) => {
              const radius = 40
              const centerX = 50
              const centerY = 50

              // Convert angles to radians
              const startAngle = (segment.startAngle * Math.PI) / 180
              const endAngle = ((segment.startAngle + segment.angle) * Math.PI) / 180

              // Calculate path coordinates
              const x1 = centerX + radius * Math.cos(startAngle)
              const y1 = centerY + radius * Math.sin(startAngle)
              const x2 = centerX + radius * Math.cos(endAngle)
              const y2 = centerY + radius * Math.sin(endAngle)

              const largeArcFlag = segment.angle > 180 ? 1 : 0

              const pathData =
                segment.percentage > 0
                  ? `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`
                  : ""

              return (
                <path
                  key={segment.club.id}
                  d={pathData}
                  fill={segment.club.color}
                  className="transition-all duration-500 hover:opacity-80 cursor-pointer"
                  style={{
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? "scale(1)" : "scale(0.8)",
                    transformOrigin: "50% 50%",
                    transitionDelay: `${index * 100}ms`,
                  }}
                >
                  <title>
                    {segment.club.name}: {segment.count} events ({segment.percentage.toFixed(1)}%)
                  </title>
                </path>
              )
            })}
            {/* Center circle for donut effect */}
            <circle cx="50" cy="50" r="20" fill="hsl(var(--card))" />
          </svg>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-3xl font-bold text-foreground">{total}</div>
            <div className="text-xs text-muted-foreground">Total Events</div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {clubs.map((club, index) => {
          const count = clubCounts[club.id] || 0
          const percentage = total > 0 ? (count / total) * 100 : 0

          return (
            <div
              key={club.id}
              className="animate-in slide-in-from-bottom-4"
              style={{
                animationDelay: `${index * 100}ms`,
                animationFillMode: "backwards",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: club.color }} />
                  <span className="text-sm font-medium text-foreground">{club.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">{count}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: club.color,
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
