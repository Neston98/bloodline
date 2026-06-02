export function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-SG", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  })
}

export function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number)
  const ampm = h >= 12 ? "pm" : "am"
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${hour}:${m.toString().padStart(2, "0")}${ampm}`
}

export function bloodTypeColor(status: string) {
  switch (status) {
    case "critical": return "text-red-600 bg-red-100"
    case "low": return "text-amber-700 bg-amber-100"
    case "good": return "text-green-700 bg-green-100"
    default: return "text-gray-600 bg-gray-100"
  }
}

export function statusPillColor(status: string) {
  switch (status) {
    case "fast_pass":
    case "Fast-Pass":
    case "critical":
      return "bg-red-100 text-red-700"
    case "scheduled":
    case "low":
      return "bg-amber-100 text-amber-700"
    case "completed":
    case "good":
      return "bg-green-100 text-green-700"
    case "cancelled":
      return "bg-gray-100 text-gray-500"
    default:
      return "bg-gray-100 text-gray-600"
  }
}

const TIERS = [
  { name: "Iron", minPoints: 0, textColor: "#6b7280", bgColor: "#f3f4f6", gradient: "linear-gradient(to right, #9ca3af, #6b7280)", indicator: "bg-gray-500" },
  { name: "Bronze", minPoints: 100, textColor: "#92400e", bgColor: "#fef3c7", gradient: "linear-gradient(to right, #d97706, #ea580c)", indicator: "bg-amber-500" },
  { name: "Silver", minPoints: 500, textColor: "#374151", bgColor: "#e5e7eb", gradient: "linear-gradient(to right, #94a3b8, #475569)", indicator: "bg-slate-500" },
  { name: "Gold", minPoints: 1500, textColor: "#a16207", bgColor: "#fef9c3", gradient: "linear-gradient(to right, #facc15, #d97706)", indicator: "bg-yellow-500" },
  { name: "Platinum", minPoints: 3000, textColor: "#1d4ed8", bgColor: "#dbeafe", gradient: "linear-gradient(to right, #3b82f6, #4f46e5)", indicator: "bg-blue-500" },
  { name: "Diamond", minPoints: 5000, textColor: "#4338ca", bgColor: "#e0e7ff", gradient: "linear-gradient(to right, #6366f1, #9333ea)", indicator: "bg-indigo-500" },
]

export function getDisplayTier(profile: { tier?: string | null; points: number; lifetime_points?: number }) {
  return profile.tier || calculateTier(profile.lifetime_points ?? profile.points)
}
export function getTierPoints(profile: { lifetime_points?: number; points: number }) {
  return profile.lifetime_points ?? profile.points
}

export function calculateTier(points: number) {
  let tier = TIERS[0]
  for (const t of TIERS) {
    if (points >= t.minPoints) tier = t
  }
  return tier.name
}

export function pointsToNextTier(points: number) {
  const idx = getTierIndex(points)
  if (idx >= TIERS.length - 1) return 0
  return TIERS[idx + 1].minPoints - points
}

export function getTierIndex(points: number) {
  let idx = 0
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (points >= TIERS[i].minPoints) return i
  }
  return 0
}

export function getTierBenefits(tier: string) {
  switch (tier) {
    case "Diamond": return "Priority booking, exclusive merch, donor recognition wall"
    case "Platinum": return "Priority booking, exclusive merch, VIP event invites"
    case "Gold": return "Priority booking, exclusive merch"
    case "Silver": return "Priority booking, milestone badges"
    case "Bronze": return "Milestone badges"
    default: return "Basic donor benefits"
  }
}

export function getTierColor(tier: string) {
  return TIERS.find((t) => t.name === tier)?.textColor ?? "#6b7280"
}

export function getTierIndicator(tier: string) {
  return TIERS.find((t) => t.name === tier)?.indicator ?? "bg-gray-500"
}

export function getTierGradient(tier: string) {
  return TIERS.find((t) => t.name === tier)?.gradient ?? "linear-gradient(to right, #9ca3af, #6b7280)"
}

export function getTierBg(tier: string) {
  return TIERS.find((t) => t.name === tier)?.bgColor ?? "#f3f4f6"
}

export function getNextTierName(points: number) {
  const idx = getTierIndex(points)
  if (idx >= TIERS.length - 1) return null
  return TIERS[idx + 1].name
}

export function calculateTierProgress(points: number) {
  let currentMin = 0
  let nextMin = 100
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (points >= TIERS[i].minPoints) {
      currentMin = TIERS[i].minPoints
      nextMin = i < TIERS.length - 1 ? TIERS[i + 1].minPoints : currentMin
      break
    }
  }
  if (points >= nextMin) return 100
  return Math.round(((points - currentMin) / (nextMin - currentMin)) * 100)
}
