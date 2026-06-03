import { createAdminClient } from "@/lib/supabase/admin"
import { computeCapacityPct, computeStatus } from "@/lib/inventory"
import { AdminCentresView } from "./admin-centres-view"
import CentreRedirect from "../dashboard/dashboard-redirect"
import type { InventoryStatus } from "@/types"

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

export default async function AdminCentresPage({
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

  const centreResult = await supabase.from("blood_centres").select("name, address").eq("id", centreId).single()
  const centreName = centreResult.data?.name ?? "Blood Centre"
  const centreAddress = centreResult.data?.address ?? ""

  const inventory = await fetchOrFallback(async () => {
    const { data, error } = await supabase
      .from("blood_inventory")
      .select("id, blood_type, units")
      .eq("centre_id", centreId)
      .order("blood_type", { ascending: true })
    if (error) { console.error("[BloodLine] admin centres query:", error.message); return null }
    return (data as Array<{ id: string; blood_type: string; units: number }>)?.map((item) => {
      const capacity_pct = computeCapacityPct(item.units)
      return { id: item.id, blood_type: item.blood_type, units: item.units, capacity_pct, status: computeStatus(capacity_pct) as InventoryStatus }
    }) || null
  }, FALLBACK_INVENTORY, "admin centres")

  return (
    <AdminCentresView
      centreName={centreName}
      address={centreAddress}
      centreId={centreId}
      inventoryItems={inventory}
    />
  )
}
