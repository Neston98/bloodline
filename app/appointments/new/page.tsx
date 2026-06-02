import { createClient } from "@/lib/supabase/server"
import { NewAppointmentView } from "./new-appointment-view"
import type { Profile, BloodCentre } from "@/types"

const MOCK_PROFILE: Profile = {
  id: "donor-1", full_name: "Alex Tan", initials: "AT", nric: "S****1234A",
  blood_type: "O+", date_of_birth: "1990-05-15", age: 35, mobile: "+65 9123 4567",
  email: "alex.tan@email.com", address: "123 Orchard Road, #12-34, Singapore 123456",
  weight_kg: 72,   last_hb: "14.8", last_hb_meta: "g/dL on 28 May 2026",
  donations_count: 12, points: 2450, lifetime_points: 2450, tier: "Gold", next_eligible: "2025-07-15",
  created_at: "2022-01-10",
}

const MOCK_CENTRES: BloodCentre[] = [
  { id: "centre-1", name: "Singapore General Hospital Blood Bank", address: "Outram Road, Singapore 169608", opening_hours: "Mon–Sat 8am–6pm", status: "healthy", created_at: "2025-01-01" },
  { id: "centre-2", name: "Health Sciences Authority", address: "11 Outram Road, Singapore 169078", opening_hours: "Mon–Fri 9am–5pm", status: "healthy", created_at: "2025-01-01" },
  { id: "centre-3", name: "National University Hospital Blood Bank", address: "5 Lower Kent Ridge Road, Singapore 119074", opening_hours: "Mon–Sat 8am–6pm", status: "healthy", created_at: "2025-01-01" },
  { id: "centre-4", name: "KK Women's & Children's Hospital", address: "100 Bukit Timah Road, Singapore 229899", opening_hours: "Mon–Fri 9am–5pm", status: "healthy", created_at: "2025-01-01" },
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

  return <NewAppointmentView profile={profile} centres={centres} />
}
