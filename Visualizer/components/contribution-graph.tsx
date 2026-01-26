"use client"

import { useState } from "react"
import type { Event, UserProfile } from "@/lib/data"
import { clubs } from "@/lib/data"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"

interface ContributionGraphProps {
  events: Event[]
  userProfile: UserProfile
}

export function ContributionGraph({ events, userProfile }: ContributionGraphProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [hoveredDay, setHoveredDay] = useState<{ date: Date; events: Event[] } | null>(null)

  // Generate all days for the year
  const generateYearDays = (year: number) => {
    const days: Date[] = []
    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year, 11, 31)

    // Start from the first Sunday of the year
    const firstDay = new Date(startDate)
    firstDay.setDate(startDate.getDate() - startDate.getDay())

    // End on the last Saturday
    const lastDay = new Date(endDate)
    lastDay.setDate(endDate.getDate() + (6 - endDate.getDay()))

    const currentDay = new Date(firstDay)
    while (currentDay <= lastDay) {
      days.push(new Date(currentDay))
      currentDay.setDate(currentDay.getDate() + 1)
    }

    return days
  }

  // Group events by date
  const eventsByDate = events.reduce(
    (acc, event) => {
      const eventDate = new Date(event.date)
      if (eventDate.getFullYear() === selectedYear) {
        const dateKey = eventDate.toISOString().split("T")[0]
        if (!acc[dateKey]) acc[dateKey] = []
        acc[dateKey].push(event)
      }
      return acc
    },
    {} as Record<string, Event[]>,
  )

  const allDays = generateYearDays(selectedYear)
  const totalEventsInYear = Object.values(eventsByDate).flat().length

  // Group days by weeks
  const weeks: Date[][] = []
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7))
  }

  // Get color intensity based on event count
  const getIntensity = (count: number) => {
    if (count === 0) return "bg-muted/30"
    if (count === 1) return "bg-chart-1/40"
    if (count === 2) return "bg-chart-1/60"
    if (count === 3) return "bg-chart-1/80"
    return "bg-chart-1"
  }

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  return (
    <div className="bg-card border border-border rounded-2xl p-8 animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-chart-1/20">
            <Calendar className="w-6 h-6 text-chart-1" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-foreground">Event Participation</h3>
            <p className="text-sm text-muted-foreground">
              {totalEventsInYear} {totalEventsInYear === 1 ? "event" : "events"} attended in {selectedYear}
            </p>
          </div>
        </div>

        {/* Year Selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedYear(selectedYear - 1)}
            className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-all hover:scale-110 active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-lg font-semibold px-4">{selectedYear}</span>
          <button
            onClick={() => setSelectedYear(selectedYear + 1)}
            disabled={selectedYear >= new Date().getFullYear()}
            className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-all hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Contribution Graph */}
      <div className="relative overflow-x-auto">
        <div className="inline-flex gap-1 min-w-full">
          {/* Day labels */}
          <div className="flex flex-col gap-1 text-xs text-muted-foreground pr-2">
            <div className="h-3" />
            <div className="h-3">Mon</div>
            <div className="h-3" />
            <div className="h-3">Wed</div>
            <div className="h-3" />
            <div className="h-3">Fri</div>
            <div className="h-3" />
          </div>

          {/* Grid */}
          <div className="flex-1">
            {/* Month labels */}
            <div className="flex gap-1 mb-1 text-xs text-muted-foreground h-3">
              {months.map((month, index) => {
                const firstDayOfMonth = weeks.findIndex((week) =>
                  week.some((day) => day.getMonth() === index && day.getDate() <= 7),
                )
                if (firstDayOfMonth === -1) return null
                return (
                  <div key={month} className="absolute" style={{ left: `${firstDayOfMonth * 14 + 40}px` }}>
                    {month}
                  </div>
                )
              })}
            </div>

            {/* Days grid */}
            <div className="flex gap-1">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {week.map((day, dayIndex) => {
                    const dateKey = day.toISOString().split("T")[0]
                    const dayEvents = eventsByDate[dateKey] || []
                    const count = dayEvents.length
                    const isCurrentYear = day.getFullYear() === selectedYear

                    return (
                      <div
                        key={dayIndex}
                        className={`w-3 h-3 rounded-sm border border-border/50 transition-all duration-200 hover:scale-150 hover:border-primary hover:shadow-lg cursor-pointer ${
                          isCurrentYear ? getIntensity(count) : "bg-muted/10"
                        }`}
                        onMouseEnter={() => setHoveredDay({ date: day, events: dayEvents })}
                        onMouseLeave={() => setHoveredDay(null)}
                        title={`${day.toDateString()}: ${count} event${count !== 1 ? "s" : ""}`}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hover tooltip */}
      {hoveredDay && hoveredDay.events.length > 0 && (
        <div className="mt-6 p-4 rounded-xl bg-muted border border-border animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-foreground">
              {hoveredDay.date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
            <span className="text-xs text-muted-foreground">{hoveredDay.events.length} event(s)</span>
          </div>
          <div className="space-y-2">
            {hoveredDay.events.map((event) => {
              const club = clubs.find((c) => c.id === event.club)
              return (
                <div key={event.id} className="flex items-start gap-2 p-2 rounded-lg bg-card">
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: club?.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{club?.name}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {event.skills.slice(0, 3).map((skill) => (
                        <span key={skill} className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-muted/30 border border-border/50" />
            <div className="w-3 h-3 rounded-sm bg-chart-1/40 border border-border/50" />
            <div className="w-3 h-3 rounded-sm bg-chart-1/60 border border-border/50" />
            <div className="w-3 h-3 rounded-sm bg-chart-1/80 border border-border/50" />
            <div className="w-3 h-3 rounded-sm bg-chart-1 border border-border/50" />
          </div>
          <span>More</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {Math.round((totalEventsInYear / 365) * 100)}% participation rate
        </p>
      </div>
    </div>
  )
}
