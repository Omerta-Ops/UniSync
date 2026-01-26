"use client"

import type React from "react"

import { useState } from "react"
import type { UserProfile } from "@/lib/data"
import { clubs, events } from "@/lib/data"

interface UserProfileFormProps {
  initialData: UserProfile
  onSave: (profile: UserProfile) => void
}

export function UserProfileForm({ initialData, onSave }: UserProfileFormProps) {
  const [formData, setFormData] = useState<UserProfile>(initialData)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleClubToggle = (clubId: string) => {
    setFormData((prev) => ({
      ...prev,
      clubMemberships: prev.clubMemberships.includes(clubId)
        ? prev.clubMemberships.filter((id) => id !== clubId)
        : [...prev.clubMemberships, clubId],
    }))
  }

  const handleEventToggle = (eventId: string) => {
    setFormData((prev) => ({
      ...prev,
      eventsAttended: prev.eventsAttended.includes(eventId)
        ? prev.eventsAttended.filter((id) => id !== eventId)
        : [...prev.eventsAttended, eventId],
    }))
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-card border border-border rounded-2xl p-8 animate-in fade-in zoom-in-95 duration-700">
        <h2 className="text-2xl font-bold mb-6 text-foreground">
          {initialData.name === "Alex Johnson" ? "Create Your Profile" : "Edit Your Profile"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              className="animate-in slide-in-from-left-4 duration-500"
              style={{ animationDelay: "100ms", animationFillMode: "backwards" }}
            >
              <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:scale-105 transition-all duration-300"
                required
              />
            </div>

            <div
              className="animate-in slide-in-from-right-4 duration-500"
              style={{ animationDelay: "200ms", animationFillMode: "backwards" }}
            >
              <label className="block text-sm font-medium text-foreground mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:scale-105 transition-all duration-300"
                required
              />
            </div>

            <div
              className="animate-in slide-in-from-left-4 duration-500"
              style={{ animationDelay: "300ms", animationFillMode: "backwards" }}
            >
              <label className="block text-sm font-medium text-foreground mb-2">Major</label>
              <input
                type="text"
                value={formData.major}
                onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:scale-105 transition-all duration-300"
                required
              />
            </div>

            <div
              className="animate-in slide-in-from-right-4 duration-500"
              style={{ animationDelay: "400ms", animationFillMode: "backwards" }}
            >
              <label className="block text-sm font-medium text-foreground mb-2">Year</label>
              <select
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:scale-105 transition-all duration-300"
                required
              >
                <option>Freshman</option>
                <option>Sophomore</option>
                <option>Junior</option>
                <option>Senior</option>
              </select>
            </div>
          </div>

          {/* Bio */}
          <div
            className="animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: "500ms", animationFillMode: "backwards" }}
          >
            <label className="block text-sm font-medium text-foreground mb-2">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:scale-[1.02] transition-all duration-300 resize-none"
              placeholder="Tell us about yourself..."
            />
          </div>

          {/* Club Memberships */}
          <div
            className="animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: "600ms", animationFillMode: "backwards" }}
          >
            <label className="block text-sm font-medium text-foreground mb-3">Club Memberships</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {clubs.map((club) => (
                <label
                  key={club.id}
                  className="flex items-center gap-3 p-4 rounded-xl bg-background border border-border hover:border-primary hover:scale-105 cursor-pointer transition-all duration-300"
                >
                  <input
                    type="checkbox"
                    checked={formData.clubMemberships.includes(club.id)}
                    onChange={() => handleClubToggle(club.id)}
                    className="w-5 h-5 rounded border-border text-primary focus:ring-primary transition-all duration-300"
                  />
                  <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: club.color }} />
                  <span className="text-foreground">{club.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Events Attended */}
          <div
            className="animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: "700ms", animationFillMode: "backwards" }}
          >
            <label className="block text-sm font-medium text-foreground mb-3">Events Attended</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2">
              {events.map((event) => (
                <label
                  key={event.id}
                  className="flex items-center gap-3 p-4 rounded-xl bg-background border border-border hover:border-primary hover:scale-105 cursor-pointer transition-all duration-300"
                >
                  <input
                    type="checkbox"
                    checked={formData.eventsAttended.includes(event.id)}
                    onChange={() => handleEventToggle(event.id)}
                    className="w-5 h-5 rounded border-border text-primary focus:ring-primary transition-all duration-300"
                  />
                  <div className="flex-1">
                    <p className="text-foreground font-medium">{event.title}</p>
                    <p className="text-sm text-muted-foreground">{new Date(event.date).toLocaleDateString()}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-chart-2 text-white font-semibold hover:scale-105 hover:shadow-2xl hover:shadow-primary/50 active:scale-95 transition-all duration-300 animate-in fade-in zoom-in-95 duration-700"
            style={{ animationDelay: "800ms", animationFillMode: "backwards" }}
          >
            Save Profile
          </button>
        </form>
      </div>
    </div>
  )
}
