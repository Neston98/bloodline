import { createClient } from "@/lib/supabase/server"
import { AppointmentsView } from "./appointments-view"
import type { Profile, Appointment, BloodCentre } from "@/types"

const MOCK_PROFILE: Profile = {
  id: "donor-1", full_name: "Alex Tan", initials: "AT", nric: "S****1234A",
  blood_type: "O+", date_of_birth: "1990-05-15", age: 35, mobile: "+65 9123 4567",
  email: "alex.tan@email.com", address: "123 Orchard Road, #12-34, Singapore 123456",
  weight_kg: 72, last_hb: "14.5", last_hb_meta: "g/dL on 15 Mar 2025",
  donations_count: 12, points: 2450, tier: "Gold", next_eligible: "2025-07-15",
  created_at: "2022-01-10",
}

const MOCK_APPOINTMENTS: Appointment[] = [
  { id: "apt-1", donor_id: "donor-1", centre_id: "centre-1", centre_name: "Singapore General Hospital Blood Bank", appointment_date: "2025-06-20", time_start: "09:00", time_end: "10:00", blood_type: "O+", status: "scheduled", created_at: "2025-05-01" },
  { id: "apt-4", donor_id: "donor-1", centre_id: "centre-1", centre_name: "Singapore General Hospital Blood Bank", appointment_date: "2025-06-25", time_start: "11:00", time_end: "12:00", blood_type: "O+", status: "fast_pass", created_at: "2025-05-15" },
  { id: "apt-2", donor_id: "donor-1", centre_id: "centre-2", centre_name: "Health Sciences Authority", appointment_date: "2025-03-15", time_start: "14:00", time_end: "15:00", blood_type: "O+", status: "completed", created_at: "2025-02-20" },
  { id: "apt-3", donor_id: "donor-1", centre_id: "centre-3", centre_name: "National University Hospital Blood Bank", appointment_date: "2024-12-10", time_start: "10:00", time_end: "11:00", blood_type: "O+", status: "completed", created_at: "2024-11-25" },
  { id: "apt-5", donor_id: "donor-1", centre_id: "centre-2", centre_name: "Health Sciences Authority", appointment_date: "2024-09-05", time_start: "09:00", time_end: "10:00", blood_type: "O+", status: "completed", created_at: "2024-08-15" },
]

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

export default async function AppointmentsPage() {
  const profile = await fetchOrFallback(async () => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { console.warn("[BloodLine] No user session found"); return null }
    const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()
    if (error) console.error("[BloodLine] profiles query:", error.message)
    return data as Profile
  }, MOCK_PROFILE, "profiles")

  const appointments = await fetchOrFallback(async () => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data, error } = await supabase.from("appointments").select("*").eq("donor_id", user.id).order("appointment_date", { ascending: false })
    if (error) console.error("[BloodLine] appointments query:", error.message)
    return data as Appointment[]
  }, MOCK_APPOINTMENTS, "appointments")

  const centres = await fetchOrFallback(async () => {
    const supabase = await createClient()
    const { data, error } = await supabase.from("blood_centres").select("*").order("name", { ascending: true })
    if (error) console.error("[BloodLine] blood_centres query:", error.message)
    return data as BloodCentre[]
  }, MOCK_CENTRES, "blood_centres")

  return <AppointmentsView profile={profile} appointments={appointments} centres={centres} />
}
