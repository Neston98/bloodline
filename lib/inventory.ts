export const MAX_UNITS = 800

export function computeCapacityPct(units: number, max = MAX_UNITS): number {
  return Math.min(100, Math.round((units / max) * 100))
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
