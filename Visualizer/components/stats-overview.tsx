"use client"

import type { Event } from "@/lib/data"
import { Calendar, Users, Zap, TrendingUp } from "lucide-react"

interface StatsOverviewProps {
  events: Event[]
  selectedClub: string | null
}

export function StatsOverview({ events, selectedClub }: StatsOverviewProps) {
  const totalEvents = events.length
  const uniqueClubs = new Set(events.map((e) => e.club)).size
  const allSkills = events.flatMap((e) => e.skills)
  const uniqueSkills = new Set(allSkills).size
  const upcomingCount = events.filter((e) => new Date(e.date) > new Date()).length

  const stats = [
    {
      label: "Total Events",
      value: totalEvents,
      icon: Calendar,
      color: "#3b82f6",
    },
    {
      label: "Active Clubs",
      value: selectedClub ? 1 : uniqueClubs,
      icon: Users,
      color: "#8b5cf6",
    },
    {
      label: "Skills Covered",
      value: uniqueSkills,
      icon: Zap,
      color: "#f59e0b",
    },
    {
      label: "Upcoming",
      value: upcomingCount,
      icon: TrendingUp,
      color: "#10b981",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.label}
            className="relative bg-card border border-border rounded-2xl p-6 overflow-hidden group hover:shadow-xl hover:-translate-y-2 hover:border-primary/50 transition-all duration-500 animate-in fade-in slide-in-from-top-4"
            style={{
              animationDelay: `${index * 100}ms`,
              animationFillMode: "backwards",
            }}
          >
            {/* Background gradient */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500"
              style={{
                background: `linear-gradient(135deg, ${stat.color}40 0%, transparent 100%)`,
              }}
            />

            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2 group-hover:text-foreground transition-colors duration-300">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold text-foreground group-hover:scale-110 transition-transform duration-300 inline-block">
                  {stat.value}
                </p>
              </div>
              <div
                className="p-3 rounded-xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-500"
                style={{
                  backgroundColor: `${stat.color}20`,
                }}
              >
                <Icon className="w-6 h-6" style={{ color: stat.color }} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
