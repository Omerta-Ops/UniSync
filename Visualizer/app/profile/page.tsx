"use client"

import { useState, useEffect } from "react"
import { sampleUser, events, clubs } from "@/lib/data"
import type { UserProfile } from "@/lib/data"
import { UserProfileForm } from "@/components/user-profile-form"
import { ContributionGraph } from "@/components/contribution-graph"
import { UserStatsCard } from "@/components/user-stats-card"
import { AnimatedBackground } from "@/components/animated-background"
import { ArrowLeft, User, Calendar, Award, Target } from "lucide-react"
import Link from "next/link"

export default function ProfilePage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [showForm, setShowForm] = useState(true)
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [isDark])

  useEffect(() => {
    const savedUser = localStorage.getItem("userProfile")
    if (savedUser) {
      setUserProfile(JSON.parse(savedUser))
      setShowForm(false)
    }
  }, [])

  const handleSaveProfile = (profile: UserProfile) => {
    setUserProfile(profile)
    localStorage.setItem("userProfile", JSON.stringify(profile))
    setShowForm(false)
  }

  const handleEditProfile = () => {
    setShowForm(true)
  }

  const attendedEvents = userProfile ? events.filter((event) => userProfile.eventsAttended.includes(event.id)) : []

  const userClubs = userProfile ? clubs.filter((club) => userProfile.clubMemberships.includes(club.id)) : []

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AnimatedBackground />

      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 rounded-xl bg-muted hover:bg-muted/80 transition-all duration-300 hover:scale-110 active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-chart-2 to-chart-3 bg-clip-text text-transparent">
                My Profile
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">Track your campus journey</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {showForm || !userProfile ? (
          <UserProfileForm initialData={userProfile || sampleUser} onSave={handleSaveProfile} />
        ) : (
          <>
            <div className="bg-card border border-border rounded-2xl p-8 mb-8 animate-in fade-in slide-in-from-top-4">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center text-4xl font-bold text-white">
                  {userProfile.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-foreground mb-2">{userProfile.name}</h2>
                  <p className="text-muted-foreground mb-4">{userProfile.bio}</p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-chart-1" />
                      <span>
                        {userProfile.major} • {userProfile.year}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-chart-2" />
                      <span>Joined {new Date(userProfile.joinDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleEditProfile}
                  className="px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  Edit Profile
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <UserStatsCard
                icon={Calendar}
                label="Events Attended"
                value={attendedEvents.length}
                color="#3b82f6"
                index={0}
              />
              <UserStatsCard icon={User} label="Club Memberships" value={userClubs.length} color="#8b5cf6" index={1} />
              <UserStatsCard
                icon={Award}
                label="Skills Acquired"
                value={userProfile.skills.length}
                color="#f59e0b"
                index={2}
              />
              <UserStatsCard
                icon={Target}
                label="Completion Rate"
                value={`${Math.round((attendedEvents.length / events.length) * 100)}%`}
                color="#10b981"
                index={3}
              />
            </div>

            <ContributionGraph events={attendedEvents} userProfile={userProfile} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="text-xl font-bold mb-4 text-foreground">Skills Acquired</h3>
                <div className="flex flex-wrap gap-2">
                  {userProfile.skills.map((skill, index) => (
                    <span
                      key={skill}
                      className="px-4 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:scale-105 transition-transform duration-300 animate-in fade-in"
                      style={{
                        animationDelay: `${index * 50}ms`,
                        animationFillMode: "backwards",
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="text-xl font-bold mb-4 text-foreground">Club Memberships</h3>
                <div className="space-y-3">
                  {userClubs.map((club, index) => (
                    <div
                      key={club.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted hover:bg-muted/80 transition-all duration-300 hover:translate-x-2 animate-in slide-in-from-left-4"
                      style={{
                        animationDelay: `${index * 100}ms`,
                        animationFillMode: "backwards",
                      }}
                    >
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: club.color }} />
                      <div>
                        <p className="font-medium text-foreground">{club.name}</p>
                        <p className="text-sm text-muted-foreground">{club.domain}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
