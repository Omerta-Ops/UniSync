"use client"

import { useState, useEffect } from "react"
import { FilterNav } from "@/components/filter-nav"
import { StatsOverview } from "@/components/stats-overview"
import { EventGridCard } from "@/components/event-grid-card"
import { EmptyState } from "@/components/empty-state"
import { ActivityChart } from "@/components/activity-chart"
import { SkillsRadar } from "@/components/skills-radar"
import { EventTimeline } from "@/components/event-timeline"
import { ClubDistribution } from "@/components/club-distribution"
import { AnimatedBackground } from "@/components/animated-background"
import { EventsHeatmap } from "@/components/events-heatmap"
import { ParticipationTrend } from "@/components/participation-trend"
import { EventTypeBreakdown } from "@/components/event-type-breakdown"
import { events, clubs } from "@/lib/data"
import { Moon, Sun } from "lucide-react"
import Link from "next/link"
import { User } from "lucide-react"

export default function Home() {
  const [selectedClub, setSelectedClub] = useState<string | null>(null)
  const [isDark, setIsDark] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
    setMounted(true)
  }, [isDark])

  const filteredEvents = selectedClub ? events.filter((event) => event.club === selectedClub) : events

  const sortedEvents = [...filteredEvents].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const selectedClubData = clubs.find((club) => club.id === selectedClub)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AnimatedBackground />

      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border animate-in slide-in-from-top-4 duration-700">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="animate-in fade-in zoom-in-50 duration-700">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-chart-2 to-chart-3 bg-clip-text text-transparent">
              Campus Events Hub
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Discover clubs, events, and opportunities</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="p-3 rounded-xl bg-muted hover:bg-muted/80 transition-all duration-300 hover:scale-110 hover:rotate-6 active:scale-95 animate-in fade-in zoom-in-50 duration-700"
              style={{ animationDelay: "200ms", animationFillMode: "backwards" }}
            >
              <User className="w-5 h-5" />
            </Link>
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-3 rounded-xl bg-muted hover:bg-muted/80 transition-all duration-300 hover:scale-110 hover:rotate-12 active:scale-95 animate-in fade-in zoom-in-50 duration-700"
              style={{ animationDelay: "300ms", animationFillMode: "backwards" }}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      <FilterNav clubs={clubs} selectedClub={selectedClub} onSelectClub={setSelectedClub} />

      <main className="container mx-auto px-6 py-8">
        <StatsOverview events={filteredEvents} selectedClub={selectedClub} />

        <div
          className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700"
          style={{ animationDelay: "500ms", animationFillMode: "backwards" }}
        >
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-primary to-chart-2 rounded-full animate-pulse" />
            Analytics Dashboard
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ActivityChart events={filteredEvents} />
            <ParticipationTrend events={filteredEvents} />
          </div>
        </div>

        <div
          className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700"
          style={{ animationDelay: "600ms", animationFillMode: "backwards" }}
        >
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <div
              className="w-1 h-6 bg-gradient-to-b from-chart-2 to-chart-3 rounded-full animate-pulse"
              style={{ animationDelay: "100ms" }}
            />
            Event Insights
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EventsHeatmap events={filteredEvents} />
            <EventTypeBreakdown events={filteredEvents} />
          </div>
        </div>

        <div
          className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700"
          style={{ animationDelay: "700ms", animationFillMode: "backwards" }}
        >
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <div
              className="w-1 h-6 bg-gradient-to-b from-chart-3 to-chart-1 rounded-full animate-pulse"
              style={{ animationDelay: "200ms" }}
            />
            Quick Overview
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SkillsRadar events={filteredEvents} />
            </div>
            <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-500 flex flex-col items-center justify-center group">
              <div className="text-6xl font-bold bg-gradient-to-r from-chart-1 to-chart-3 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-500">
                {filteredEvents.length}
              </div>
              <p className="text-base font-semibold text-foreground text-center">Total Events</p>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedClub ? "in selected club" : "across all clubs"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <EventTimeline events={filteredEvents} />
            <ClubDistribution events={filteredEvents} />
          </div>
        </div>

        {sortedEvents.length > 0 && (
          <div
            className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700"
            style={{ animationDelay: "800ms", animationFillMode: "backwards" }}
          >
            <h2 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
              <div
                className="w-1 h-6 bg-gradient-to-b from-primary to-chart-1 rounded-full animate-pulse"
                style={{ animationDelay: "300ms" }}
              />
              {selectedClub ? `${selectedClubData?.name} Events` : "All Events"}
            </h2>
            <p className="text-muted-foreground ml-6">
              {sortedEvents.length} {sortedEvents.length === 1 ? "event" : "events"} found
            </p>
          </div>
        )}

        {sortedEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedEvents.map((event, index) => (
              <EventGridCard key={event.id} event={event} index={index} />
            ))}
          </div>
        ) : (
          <EmptyState clubName={selectedClubData?.name} />
        )}
      </main>

      <footer
        className="mt-20 py-6 text-center text-sm text-muted-foreground border-t border-border animate-in fade-in slide-in-from-bottom-4 duration-700"
        style={{ animationDelay: "900ms", animationFillMode: "backwards" }}
      >
        <p>© 2025 Campus Events Hub. All rights reserved.</p>
      </footer>
    </div>
  )
}
