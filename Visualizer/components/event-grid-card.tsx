"use client"

import { type Event, clubs } from "@/lib/data"
import { Calendar, Tag, Users } from "lucide-react"
import { cn } from "@/lib/utils"

interface EventGridCardProps {
  event: Event
  index: number
}

export function EventGridCard({ event, index }: EventGridCardProps) {
  const club = clubs.find((c) => c.id === event.club)

  return (
    <div
      className={cn(
        "group relative bg-card border border-border rounded-2xl overflow-hidden",
        "hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-3 hover:border-primary/50 transition-all duration-500",
        "animate-in fade-in slide-in-from-bottom-4",
      )}
      style={{
        animationDelay: `${index * 100}ms`,
        animationFillMode: "backwards",
      }}
    >
      {/* Color accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1 transition-all duration-500 group-hover:h-2 group-hover:shadow-lg"
        style={{ backgroundColor: club?.color }}
      />

      {/* Gradient overlay on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500"
        style={{
          background: `linear-gradient(135deg, ${club?.color}40 0%, transparent 100%)`,
        }}
      />

      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold mb-2 text-foreground group-hover:text-primary transition-colors duration-300">
              {event.title}
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-300">
              <Users className="w-4 h-4" />
              <span>{club?.name}</span>
            </div>
          </div>
          <span
            className="px-3 py-1 rounded-full text-xs font-medium group-hover:scale-110 transition-transform duration-300"
            style={{
              backgroundColor: `${club?.color}20`,
              color: club?.color,
            }}
          >
            {event.type}
          </span>
        </div>

        {/* Date */}
        <div className="flex items-center gap-2 mb-4 text-muted-foreground group-hover:text-foreground transition-colors duration-300">
          <Calendar className="w-4 h-4" />
          <time className="text-sm">
            {new Date(event.date).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </time>
        </div>

        {/* Skills */}
        <div className="flex items-start gap-2 mb-5">
          <Tag className="w-4 h-4 mt-1 text-muted-foreground shrink-0" />
          <div className="flex flex-wrap gap-2">
            {event.skills.map((skill) => (
              <span
                key={skill}
                className="px-2.5 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground hover:bg-primary/20 hover:text-primary hover:scale-105 transition-all duration-300 cursor-default"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Action button */}
        <button
          className="w-full py-2.5 rounded-lg text-sm font-medium transition-all duration-300 hover:shadow-xl active:scale-95"
          style={{
            backgroundColor: club?.color,
            color: "white",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.03)"
            e.currentTarget.style.boxShadow = `0 15px 40px -10px ${club?.color}80`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)"
            e.currentTarget.style.boxShadow = "none"
          }}
        >
          Register Now
        </button>
      </div>
    </div>
  )
}
