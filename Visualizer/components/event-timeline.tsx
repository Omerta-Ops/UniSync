"use client"

import { type Event, clubs } from "@/lib/data"
import { Clock } from "lucide-react"

interface EventTimelineProps {
  events: Event[]
}

export function EventTimeline({ events }: EventTimelineProps) {
  // Sort events by date
  const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 5)

  return (
    <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-xl transition-all duration-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-chart-2/20">
          <Clock className="w-5 h-5 text-chart-2" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Upcoming Timeline</h3>
          <p className="text-sm text-muted-foreground">Next 5 events</p>
        </div>
      </div>

      <div className="relative space-y-6">
        {/* Timeline line */}
        <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-chart-2 via-chart-3 to-transparent" />

        {sortedEvents.map((event, index) => {
          const club = clubs.find((c) => c.id === event.club)
          const date = new Date(event.date)
          const isUpcoming = date > new Date()

          return (
            <div
              key={event.id}
              className="relative pl-10 animate-in slide-in-from-left-4"
              style={{
                animationDelay: `${index * 100}ms`,
                animationFillMode: "backwards",
              }}
            >
              {/* Timeline dot */}
              <div
                className="absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-background transition-all duration-300 hover:scale-125"
                style={{ backgroundColor: club?.color || "#3b82f6" }}
              >
                {isUpcoming && (
                  <div
                    className="absolute inset-0 rounded-full animate-ping"
                    style={{ backgroundColor: club?.color }}
                  />
                )}
              </div>

              <div className="group">
                <div className="flex items-start justify-between mb-1">
                  <p className="font-medium text-foreground group-hover:text-chart-2 transition-colors">
                    {event.title}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{club?.name}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {event.skills.slice(0, 3).map((skill) => (
                    <span key={skill} className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">
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
  )
}
