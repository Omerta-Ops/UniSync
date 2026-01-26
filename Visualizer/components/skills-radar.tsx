"use client"

import type { Event } from "@/lib/data"
import { Target } from "lucide-react"

interface SkillsRadarProps {
  events: Event[]
}

export function SkillsRadar({ events }: SkillsRadarProps) {
  // Count skill occurrences
  const skillCounts = events.reduce(
    (acc, event) => {
      event.skills.forEach((skill) => {
        acc[skill] = (acc[skill] || 0) + 1
      })
      return acc
    },
    {} as Record<string, number>,
  )

  // Get top 8 skills
  const topSkills = Object.entries(skillCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)

  const maxCount = Math.max(...topSkills.map(([, count]) => count))

  const colors = ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#f97316", "#ec4899", "#06b6d4", "#8b5cf6"]

  return (
    <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-xl transition-all duration-500 h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-chart-3/20">
          <Target className="w-5 h-5 text-chart-3" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Top Skills</h3>
          <p className="text-sm text-muted-foreground">Most popular across events</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {topSkills.map(([skill, count], index) => {
          const percentage = (count / maxCount) * 100
          const color = colors[index % colors.length]

          return (
            <div
              key={skill}
              className="animate-in slide-in-from-right-4"
              style={{
                animationDelay: `${index * 80}ms`,
                animationFillMode: "backwards",
              }}
            >
              <div className="flex items-center gap-2 group">
                <div
                  className="w-2 h-2 rounded-full transition-all duration-300 group-hover:scale-150 shrink-0"
                  style={{ backgroundColor: color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground truncate">{skill}</span>
                    <span className="text-xs text-muted-foreground ml-2 shrink-0">{count}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: color,
                        animationDelay: `${index * 80}ms`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
