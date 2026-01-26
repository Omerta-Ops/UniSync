"use client"

import type { LucideIcon } from "lucide-react"

interface UserStatsCardProps {
  icon: LucideIcon
  label: string
  value: number | string
  color: string
  index: number
}

export function UserStatsCard({ icon: Icon, label, value, color, index }: UserStatsCardProps) {
  return (
    <div
      className="relative bg-card border border-border rounded-2xl p-6 overflow-hidden group hover:shadow-xl transition-all duration-500 animate-in fade-in slide-in-from-top-4"
      style={{
        animationDelay: `${index * 100}ms`,
        animationFillMode: "backwards",
      }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500"
        style={{
          background: `linear-gradient(135deg, ${color}40 0%, transparent 100%)`,
        }}
      />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-2">{label}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
        </div>
        <div
          className="p-3 rounded-xl group-hover:scale-110 transition-transform duration-500"
          style={{
            backgroundColor: `${color}20`,
          }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      </div>
    </div>
  )
}
