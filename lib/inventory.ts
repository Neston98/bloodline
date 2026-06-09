export const MAX_UNITS = 800
export const ALL_BLOOD_TYPES = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"] as const

export function computeCapacityPct(units: number, max = MAX_UNITS): number {
  const u = Math.max(0, Number(units) || 0)
  const m = Math.max(1, Number(max) || MAX_UNITS)
  return Math.min(100, Math.round((u / m) * 100))
}

export function computeStatus(pct: number): "critical" | "low" | "moderate" | "healthy" {
  if (pct < 20) return "critical"
  if (pct < 40) return "low"
  if (pct <= 70) return "moderate"
  return "healthy"
}

export function enrichInventory<T extends { units: number }>(
  items: T[],
  max = MAX_UNITS,
): (T & { capacity_pct: number; status: "critical" | "low" | "moderate" | "healthy" })[] {
  return items.map((item) => {
    const capacity_pct = computeCapacityPct(item.units, max)
    return { ...item, capacity_pct, status: computeStatus(capacity_pct) }
  })
}

export function computeFromUnits(units: number): { capacity_pct: number; status: "critical" | "low" | "moderate" | "healthy" } {
  const capacity_pct = computeCapacityPct(units)
  return { capacity_pct, status: computeStatus(capacity_pct) }
}

export function padBloodTypes<T extends { blood_type: string; units: number }>(
  items: T[],
  max = MAX_UNITS,
): (T & { capacity_pct: number; status: "critical" | "low" | "moderate" | "healthy" })[] {
  const existing = new Map(items.map((i) => [i.blood_type, i]))
  return ALL_BLOOD_TYPES.map((bt) => {
    const item = existing.get(bt)
    const units = item ? item.units : 0
    const capacity_pct = computeCapacityPct(units, max)
    return { ...(item || { blood_type: bt }), units, capacity_pct, status: computeStatus(capacity_pct) } as T & { capacity_pct: number; status: "critical" | "low" | "moderate" | "healthy" }
  })
}
