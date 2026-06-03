import { createAdminClient } from "@/lib/supabase/admin"
import { computeCapacityPct, computeStatus } from "@/lib/inventory"
import { AdminDashboardView } from "./admin-dashboard-view"
import CentreRedirect from "./dashboard-redirect"
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

async function fetchOrFallback<T>(fetch: () => Promise<T | null | undefined>, fallback: T, label = "query"): Promise<T> {
  try {
    const result = await fetch()
    return result ?? fallback
  } catch (e) {
    console.error(`[BloodLine] ${label}:`, e)
    return fallback
  }
}

function groupInventory(data: BI[]): InventoryItem[] {
  const centres = new Set(data.map((i) => i.centre_id))
  const centreCount = centres.size || 1
  const nationalMax = 800 * centreCount
  const grouped: Record<string, number> = {}
  for (const item of data) {
    grouped[item.blood_type] = (grouped[item.blood_type] || 0) + item.units
  }
  return Object.entries(grouped).map(([blood_type, units]) => {
    const capacity_pct = computeCapacityPct(units, nationalMax)
    return { blood_type, units, capacity_pct, status: computeStatus(capacity_pct) } as InventoryItem
  })
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ centre_id?: string }>
}) {
  const params = await searchParams
  const centreId = params.centre_id

  if (!centreId) {
    return <CentreRedirect />
  }

  const supabase = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)

  const centreResult = await supabase.from("blood_centres").select("name").eq("id", centreId).single()
  const centreName = centreResult.data?.name ?? "Blood Centre"

  const rawInventory = await fetchOrFallback(async () => {
    const { data, error } = await supabase.from("blood_inventory").select("*")
    if (error) { console.error("[BloodLine] inventory:", error.message); return null }
    return data as BI[]
  }, null, "inventory")

  const appointments = await fetchOrFallback(async () => {
    const { data, error } = await supabase
      .from("appointments")
      .select("time_start, blood_type, donor_id, status")
      .eq("centre_id", centreId)
      .eq("appointment_date", today)
      .order("time_start", { ascending: true })
    if (error) { console.error("[BloodLine] appointments:", error.message); return null }
    return data as Array<{ time_start: string; blood_type: string; donor_id: string; status: string }>
  }, null, "appointments")

  let queue: QueueDonor[] = []

  if (appointments && appointments.length > 0) {
    const donorIds = [...new Set(appointments.map((a) => a.donor_id))]
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, initials")
      .in("id", donorIds)

    const profileMap = new Map<string, { full_name: string; initials: string }>()
    if (profiles) {
      for (const p of profiles as Array<{ id: string; full_name: string; initials: string }>) {
        profileMap.set(p.id, p)
      }
    }

    queue = appointments.map((a) => {
      const prof = profileMap.get(a.donor_id)
      return {
        initials: prof?.initials || "??",
        name: prof?.full_name || "Unknown",
        blood_type: a.blood_type,
        centre: centreName,
        time: a.time_start,
        status: (a.status === "fast_pass" ? "fast_pass" : "scheduled") as "fast_pass" | "scheduled",
      }
    })
  }

  const donorCount = await fetchOrFallback(async () => {
    const { count, error } = await supabase.from("profiles").select("*", { count: "exact", head: true })
    if (error) { console.error("[BloodLine] donor count:", error.message); return null }
    return count ?? 0
  }, 4812, "donor count")

  const apptCount = queue.length

  const inventory: InventoryItem[] = rawInventory ? groupInventory(rawInventory) : FALLBACK_INVENTORY

  return (
    <AdminDashboardView
      centreName={centreName}
      centreId={centreId}
      inventory={inventory}
      queue={queue}
      donorCount={donorCount}
      apptCount={apptCount}
    />
  )
}
