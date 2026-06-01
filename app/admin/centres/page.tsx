import { createAdminClient } from "@/lib/supabase/admin"
import { computeCapacityPct, computeStatus } from "@/lib/inventory"
import { AdminCentresView } from "./admin-centres-view"
import type { InventoryStatus } from "@/types"

const CENTRE_NAME = "Bloodbank@One Punggol"
const CENTRE_ADDRESS = "1 Punggol Drive, #01-01, Singapore 828602"
const CENTRE_ID = "centre-1"

interface CentreInventoryItem {
  id: string
  blood_type: string
  units: number
  capacity_pct: number
  status: InventoryStatus
}

const FALLBACK_INVENTORY: CentreInventoryItem[] = [
  { id: "inv-fb-1", blood_type: "O+", units: 52, capacity_pct: 87, status: "healthy" },
  { id: "inv-fb-2", blood_type: "O-", units: 8, capacity_pct: 13, status: "critical" },
  { id: "inv-fb-3", blood_type: "A+", units: 40, capacity_pct: 67, status: "healthy" },
  { id: "inv-fb-4", blood_type: "A-", units: 18, capacity_pct: 30, status: "low" },
  { id: "inv-fb-5", blood_type: "B+", units: 30, capacity_pct: 50, status: "healthy" },
  { id: "inv-fb-6", blood_type: "B-", units: 12, capacity_pct: 20, status: "low" },
  { id: "inv-fb-7", blood_type: "AB+", units: 16, capacity_pct: 27, status: "low" },
  { id: "inv-fb-8", blood_type: "AB-", units: 8, capacity_pct: 40, status: "healthy" },
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

export default async function AdminCentresPage() {
  const inventory = await fetchOrFallback(async () => {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("blood_inventory")
      .select("id, blood_type, units")
      .eq("centre_id", CENTRE_ID)
      .order("blood_type", { ascending: true })
    if (error) { console.error("[BloodLine] admin centres query:", error.message); return null }
    return (data as Array<{ id: string; blood_type: string; units: number }>)?.map((item) => {
      const capacity_pct = computeCapacityPct(item.units)
      return { id: item.id, blood_type: item.blood_type, units: item.units, capacity_pct, status: computeStatus(capacity_pct) as InventoryStatus }
    }) || null
  }, FALLBACK_INVENTORY, "admin centres")

  return (
    <AdminCentresView
      centreName={CENTRE_NAME}
      address={CENTRE_ADDRESS}
      inventoryItems={inventory}
    />
  )
}
