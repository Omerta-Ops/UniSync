export interface Event {
  id: string
  title: string
  club: string
  date: string
  skills: string[]
  type: string
}

export interface Club {
  id: string
  name: string
  domain: string
  color: string
}

export interface UserProfile {
  id: string
  name: string
  email: string
  major: string
  year: string
  bio: string
  joinDate: string
  eventsAttended: string[]
  clubMemberships: string[]
  skills: string[]
  avatar?: string
}

export const clubs: Club[] = [
  { id: "tech_club", name: "Technology Club", domain: "Tech", color: "#3b82f6" },
  { id: "law_society", name: "Legal Studies Society", domain: "Law", color: "#8b5cf6" },
  { id: "electrical_club", name: "Electrical Engineering Circle", domain: "Electrical", color: "#f59e0b" },
  { id: "design_club", name: "Design Club", domain: "Design", color: "#10b981" },
  { id: "entrepreneurship_cell", name: "Entrepreneurship Cell", domain: "Business", color: "#f97316" },
]

export const events: Event[] = [
  {
    id: "ai_workshop",
    title: "Intro to Artificial Intelligence",
    club: "tech_club",
    date: "2025-01-15",
    skills: ["AI", "Python", "Problem Solving"],
    type: "Workshop",
  },
  {
    id: "hack_night",
    title: "Overnight Hack Night",
    club: "tech_club",
    date: "2025-01-22",
    skills: ["Web Development", "Teamwork"],
    type: "Hackathon",
  },
  {
    id: "moot_court",
    title: "Beginner Moot Court",
    club: "law_society",
    date: "2025-01-18",
    skills: ["Legal Research", "Public Speaking"],
    type: "Competition",
  },
  {
    id: "rights_seminar",
    title: "Seminar on Fundamental Rights",
    club: "law_society",
    date: "2025-01-26",
    skills: ["Critical Thinking"],
    type: "Seminar",
  },
  {
    id: "circuit_basics",
    title: "Hands-on Circuit Design",
    club: "electrical_club",
    date: "2025-01-20",
    skills: ["Circuit Analysis", "Electronics"],
    type: "Workshop",
  },
  {
    id: "iot_intro",
    title: "Introduction to IoT",
    club: "electrical_club",
    date: "2025-01-28",
    skills: ["IoT", "Embedded Systems"],
    type: "Workshop",
  },
  {
    id: "uiux_bootcamp",
    title: "UI/UX Design Bootcamp",
    club: "design_club",
    date: "2025-01-19",
    skills: ["UI Design", "UX Research"],
    type: "Bootcamp",
  },
  {
    id: "poster_design",
    title: "Poster Design Challenge",
    club: "design_club",
    date: "2025-01-25",
    skills: ["Graphic Design", "Creativity"],
    type: "Competition",
  },
  {
    id: "startup_101",
    title: "Startup Basics 101",
    club: "entrepreneurship_cell",
    date: "2025-01-21",
    skills: ["Business Strategy", "Pitching"],
    type: "Talk",
  },
  {
    id: "pitch_day",
    title: "Student Startup Pitch Day",
    club: "entrepreneurship_cell",
    date: "2025-01-29",
    skills: ["Entrepreneurship", "Presentation"],
    type: "Event",
  },
]

export const upcomingEvents = [
  {
    title: "AI Workshop",
    date: "2025-01-15",
    club: "Technology Club",
    description: "Learn basics of Artificial Intelligence",
  },
  {
    title: "Legal Debate",
    date: "2025-01-20",
    club: "Legal Studies Society",
    description: "Debate on current legal issues",
  },
  {
    title: "Circuit Design Contest",
    date: "2025-01-25",
    club: "Electrical Engineering Circle",
    description: "Compete in designing innovative circuits",
  },
  {
    title: "UX/UI Design Seminar",
    date: "2025-02-01",
    club: "Design Club",
    description: "Explore user experience design principles",
  },
]

// Sample user data
export const sampleUser: UserProfile = {
  id: "user_001",
  name: "Alex Johnson",
  email: "alex.johnson@university.edu",
  major: "Computer Science",
  year: "Junior",
  bio: "Passionate about technology and innovation. Love attending workshops and hackathons!",
  joinDate: "2024-09-01",
  eventsAttended: ["ai_workshop", "hack_night", "uiux_bootcamp", "startup_101", "circuit_basics"],
  clubMemberships: ["tech_club", "design_club", "entrepreneurship_cell"],
  skills: ["AI", "Python", "Web Development", "UI Design", "Teamwork"],
}
