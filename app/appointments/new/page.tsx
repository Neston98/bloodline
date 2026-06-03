import { createClient } from "@/lib/supabase/server"
import { enrichInventory } from "@/lib/inventory"
import { NewAppointmentView } from "./new-appointment-view"
import type { Profile, BloodCentre, BloodInventory } from "@/types"

const MOCK_PROFILE: Profile = {
  id: "donor-1", full_name: "Alex Tan", initials: "AT", nric: "S****1234A",
  blood_type: "O+", date_of_birth: "1990-05-15", age: 35, mobile: "+65 9123 4567",
  email: "alex.tan@email.com", address: "123 Orchard Road, #12-34, Singapore 123456",
  weight_kg: 72,   last_hb: "14.8", last_hb_meta: "g/dL on 28 May 2026",
  donations_count: 12, points: 2450, lifetime_points: 2450, tier: "Gold", next_eligible: "2026-06-15",
  created_at: "2022-01-10",
}

const MOCK_CENTRES: BloodCentre[] = [
  { id: "f1ed58e5-bf60-490a-a5be-0457fd920da3", name: "Bloodbank@HSA", address: "11 Outram Road, Singapore 169078", opening_hours: "Mon–Fri 9am–5pm", status: "healthy", created_at: "2025-01-01" },
  { id: "c60aa472-d012-4bf5-b93a-49b68be02e52", name: "Bloodbank@Woodlands", address: "900 South Woodlands Drive, Singapore 730900", opening_hours: "Mon–Sat 8am–6pm", status: "healthy", created_at: "2025-01-01" },
  { id: "2cafeaa0-6b7a-47c9-89e3-300dcdcad651", name: "Bloodbank@Dhoby Ghaut", address: "11 Orchard Road, Singapore 238826", opening_hours: "Mon–Sat 8am–6pm", status: "healthy", created_at: "2025-01-01" },
  { id: "c8ec2c23-de06-45ac-93a6-1fe16e700638", name: "Bloodbank@Westgate Tower", address: "3 Gateway Drive, Singapore 608532", opening_hours: "Mon–Fri 9am–5pm", status: "healthy", created_at: "2025-01-01" },
  { id: "d59b8f2c-dfc5-4aac-a3b1-c8ce56cbcfe8", name: "Bloodbank@One Punggol", address: "1 Punggol Drive, Singapore 828629", opening_hours: "Mon–Sat 8am–6pm", status: "healthy", created_at: "2025-01-01" },
]

const MOCK_INVENTORY: BloodInventory[] = [
  { id: "inv-1", centre_id: "f1ed58e5-bf60-490a-a5be-0457fd920da3", blood_type: "O+", units: 4, capacity_pct: 8, status: "critical", updated_at: new Date().toISOString() },
  { id: "inv-2", centre_id: "f1ed58e5-bf60-490a-a5be-0457fd920da3", blood_type: "O-", units: 2, capacity_pct: 4, status: "critical", updated_at: new Date().toISOString() },
  { id: "inv-5", centre_id: "c60aa472-d012-4bf5-b93a-49b68be02e52", blood_type: "O+", units: 12, capacity_pct: 15, status: "low", updated_at: new Date().toISOString() },
  { id: "inv-6", centre_id: "2cafeaa0-6b7a-47c9-89e3-300dcdcad651", blood_type: "O+", units: 15, capacity_pct: 18, status: "low", updated_at: new Date().toISOString() },
  { id: "inv-7", centre_id: "d59b8f2c-dfc5-4aac-a3b1-c8ce56cbcfe8", blood_type: "O+", units: 6, capacity_pct: 9, status: "critical", updated_at: new Date().toISOString() },
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

export default async function NewAppointmentPage() {
  const profile = await fetchOrFallback(async () => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { console.warn("[BloodLine] No user session found"); return null }
    const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()
    if (error) console.error("[BloodLine] profiles query:", error.message)
    return data as Profile
  }, MOCK_PROFILE, "profiles")

  const centres = await fetchOrFallback(async () => {
    const supabase = await createClient()
    const { data, error } = await supabase.from("blood_centres").select("*").order("name", { ascending: true })
    if (error) console.error("[BloodLine] blood_centres query:", error.message)
    return data as BloodCentre[]
  }, MOCK_CENTRES, "blood_centres")

  const inventory = await fetchOrFallback(async () => {
    const supabase = await createClient()
    const { data, error } = await supabase.from("blood_inventory").select("*")
    if (error) { console.error("[BloodLine] blood_inventory query:", error.message); return null }
    return enrichInventory(data as BloodInventory[])
  }, enrichInventory(MOCK_INVENTORY), "blood_inventory")

  return <NewAppointmentView profile={profile} centres={centres} inventory={inventory} />
}
