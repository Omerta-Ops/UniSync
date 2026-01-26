"use client"

import type { Club } from "@/lib/data"
import { cn } from "@/lib/utils"

interface FilterNavProps {
  clubs: Club[]
  selectedClub: string | null
  onSelectClub: (clubId: string | null) => void
}

export function FilterNav({ clubs, selectedClub, onSelectClub }: FilterNavProps) {
  return (
    <div
      className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border animate-in slide-in-from-top-4 duration-700"
      style={{ animationDelay: "400ms", animationFillMode: "backwards" }}
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => onSelectClub(null)}
            className={cn(
              "px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap",
              "hover:scale-105 hover:-translate-y-0.5 active:scale-95",
              selectedClub === null
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 animate-pulse"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            All Events
          </button>
          {clubs.map((club, index) => (
            <button
              key={club.id}
              onClick={() => onSelectClub(club.id)}
              className={cn(
                "px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap",
                "hover:scale-105 hover:-translate-y-0.5 active:scale-95 flex items-center gap-2",
                "animate-in fade-in slide-in-from-right-4",
                selectedClub === club.id ? "shadow-lg" : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}
              style={
                selectedClub === club.id
                  ? {
                      backgroundColor: club.color,
                      color: "white",
                      boxShadow: `0 10px 40px -10px ${club.color}80`,
                      animationDelay: `${(index + 1) * 50}ms`,
                      animationFillMode: "backwards",
                    }
                  : {
                      animationDelay: `${(index + 1) * 50}ms`,
                      animationFillMode: "backwards",
                    }
              }
            >
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: club.color }} />
              {club.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
