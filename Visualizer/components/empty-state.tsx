"use client"

import { Search } from "lucide-react"

interface EmptyStateProps {
  clubName?: string
}

export function EmptyState({ clubName }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-500">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
        <div className="relative bg-muted rounded-full p-8">
          <Search className="w-12 h-12 text-muted-foreground" />
        </div>
      </div>
      <h3 className="text-2xl font-semibold mb-2 text-foreground">No Events Found</h3>
      <p className="text-muted-foreground text-center max-w-md">
        {clubName
          ? `There are no events available for ${clubName} at the moment. Check back later!`
          : "No events match your current filters. Try adjusting your selection."}
      </p>
    </div>
  )
}
