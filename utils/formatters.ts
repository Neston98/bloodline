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

export function calculateTier(points: number) {
  if (points >= 3000) return "Platinum"
  if (points >= 2000) return "Gold"
  if (points >= 1000) return "Silver"
  return "Bronze"
}

export function pointsToNextTier(points: number) {
  if (points >= 3000) return 0
  if (points >= 2000) return 3000 - points
  return 2000 - points
}
