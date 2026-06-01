import { createAdminClient } from "@/lib/supabase/admin"
import { computeCapacityPct, computeStatus, MAX_UNITS } from "@/lib/inventory"
import { AdminDashboardView } from "./admin-dashboard-view"
import type { InventoryStatus, BloodInventory as BI } from "@/types"

interface InventoryItem {
  blood_type: string
  units: number
  capacity_pct: number
  status: InventoryStatus
}

interface QueueDonor {
  initials: string
  name: string
  blood_type: string
  centre: string
  time: string
  status: "fast_pass" | "scheduled"
}

const CENTRE_NAME = "Bloodbank@One Punggol"

const FALLBACK_INVENTORY: InventoryItem[] = [
  { blood_type: "O+", units: 28, capacity_pct: 56, status: "healthy" },
  { blood_type: "O-", units: 4, capacity_pct: 8, status: "critical" },
  { blood_type: "A+", units: 35, capacity_pct: 70, status: "healthy" },
  { blood_type: "A-", units: 12, capacity_pct: 24, status: "low" },
  { blood_type: "B+", units: 22, capacity_pct: 44, status: "healthy" },
  { blood_type: "B-", units: 8, capacity_pct: 16, status: "low" },
  { blood_type: "AB+", units: 15, capacity_pct: 30, status: "low" },
  { blood_type: "AB-", units: 3, capacity_pct: 6, status: "critical" },
]

const FALLBACK_QUEUE = [
  { initials: "JW", name: "James Wong", blood_type: "O+", centre: "Bloodbank@One Punggol", time: "09:00", status: "fast_pass" as const },
  { initials: "SL", name: "Sarah Lim", blood_type: "A-", centre: "Bloodbank@One Punggol", time: "10:30", status: "scheduled" as const },
  { initials: "MT", name: "Mike Tan", blood_type: "B+", centre: "Woodlands Blood Centre", time: "11:00", status: "fast_pass" as const },
]

async function fetchOrFallback<T>(fetch: () => Promise<T | null | undefined>, fallback: T, label = "query"): Promise<T> {
  try {
    const result = await fetch()
    if (result === null || result === undefined) {
      console.warn(`[BloodLine] ${label}: returned null, using fallback`)
    }
    return result ?? fallback
  } catch (e) {
    console.error(`[BloodLine] ${label}:`, e)
    return fallback
  }
}

function groupInventory(data: BI[]): InventoryItem[] {
  const centres = new Set(data.map((i) => i.centre_id))
  const centreCount = centres.size || 1
  const nationalMax = MAX_UNITS * centreCount
  const grouped: Record<string, number> = {}
  for (const item of data) {
    grouped[item.blood_type] = (grouped[item.blood_type] || 0) + item.units
  }
  return Object.entries(grouped).map(([blood_type, units]) => {
    const capacity_pct = computeCapacityPct(units, nationalMax)
    return { blood_type, units, capacity_pct, status: computeStatus(capacity_pct) } as InventoryItem
  })
}

export default async function AdminDashboardPage() {
  const rawInventory = await fetchOrFallback(async () => {
    const supabase = createAdminClient()
    const { data, error } = await supabase.from("blood_inventory").select("*")
    if (error) { console.error("[BloodLine] admin blood_inventory:", error.message); return null }
    return data as BI[]
  }, null, "admin blood_inventory")

  const inventory: InventoryItem[] = rawInventory ? groupInventory(rawInventory) : FALLBACK_INVENTORY

  const today = new Date().toISOString().slice(0, 10)

  const queue = await fetchOrFallback(async () => {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("appointments")
      .select("time_start, blood_type, donor_id, centre_id, status, profiles!inner(full_name, initials)")
      .eq("appointment_date", today)
      .order("time_start", { ascending: true })
    if (error) { console.error("[BloodLine] admin queue query:", error.message); return null }
    return (data || []).map((a: Record<string, unknown>) => ({
      initials: (a as { profiles: { initials: string } }).profiles?.initials || "??",
      name: (a as { profiles: { full_name: string } }).profiles?.full_name || "Unknown",
      blood_type: a.blood_type as string,
      centre: a.centre_id as string,
      time: a.time_start as string,
      status: (a.status === "fast_pass" ? "fast_pass" : "scheduled") as "fast_pass" | "scheduled",
    }))
  }, FALLBACK_QUEUE, "admin queue")

  const donorCount = await fetchOrFallback(async () => {
    const supabase = createAdminClient()
    const { count, error } = await supabase.from("profiles").select("*", { count: "exact", head: true })
    if (error) { console.error("[BloodLine] admin donor count:", error.message); return null }
    return count ?? 0
  }, 4812, "admin donor count")

  const apptCount = await fetchOrFallback(async () => {
    const supabase = createAdminClient()
    const { count, error } = await supabase.from("appointments").select("*", { count: "exact", head: true }).eq("appointment_date", today)
    if (error) { console.error("[BloodLine] admin appt count:", error.message); return null }
    return count ?? 0
  }, 127, "admin appt count")

  return (
    <AdminDashboardView
      centreName={CENTRE_NAME}
      inventory={inventory}
      queue={queue}
      donorCount={donorCount}
      apptCount={apptCount}
    />
  )
}
