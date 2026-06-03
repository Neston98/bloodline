import { createClient } from "@/lib/supabase/server"
import { enrichInventory } from "@/lib/inventory"
import { DashboardView } from "./dashboard-view"
import type { Profile, Appointment, BloodCentre, BloodInventory as BI, EmergencyContact, TravelRecord } from "@/types"

const MOCK_PROFILE: Profile = {
  id: "donor-1",
  full_name: "Alex Tan",
  initials: "AT",
  nric: "S****1234A",
  blood_type: "O+",
  date_of_birth: "1990-05-15",
  age: 35,
  mobile: "+65 9123 4567",
  email: "alex.tan@email.com",
  address: "123 Orchard Road, #12-34, Singapore 123456",
  weight_kg: 72,
  last_hb: "14.8",
  last_hb_meta: "g/dL on 28 May 2026",
  donations_count: 12,
  points: 2450,
  lifetime_points: 2450,
  tier: "Gold",
  next_eligible: "2025-07-15",
  created_at: "2022-01-10",
}

const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: "apt-1", donor_id: "donor-1", centre_id: "centre-1",
    centre_name: "Singapore General Hospital Blood Bank",
    appointment_date: "2025-06-20", time_start: "09:00", time_end: "10:00",
    blood_type: "O+", status: "scheduled", created_at: "2025-05-01",
  },
  {
    id: "apt-2", donor_id: "donor-1", centre_id: "centre-2",
    centre_name: "Health Sciences Authority",
    appointment_date: "2025-03-15", time_start: "14:00", time_end: "15:00",
    blood_type: "O+", status: "completed", created_at: "2025-02-20",
  },
  {
    id: "apt-3", donor_id: "donor-1", centre_id: "centre-3",
    centre_name: "National University Hospital Blood Bank",
    appointment_date: "2024-12-10", time_start: "10:00", time_end: "11:00",
    blood_type: "O+", status: "completed", created_at: "2024-11-25",
  },
  {
    id: "apt-4", donor_id: "donor-1", centre_id: "centre-1",
    centre_name: "Singapore General Hospital Blood Bank",
    appointment_date: "2025-06-25", time_start: "11:00", time_end: "12:00",
    blood_type: "O+", status: "fast_pass", created_at: "2025-05-15",
  },
]

const MOCK_CENTRES: BloodCentre[] = [
  { id: "centre-1", name: "Bloodbank@One Punggol", address: "1 Punggol Drive", opening_hours: "08:00-17:00", status: "healthy", created_at: "2025-01-01" },
  { id: "centre-2", name: "Bloodbank@Dhoby Ghaut", address: "1 Orchard Road", opening_hours: "08:00-17:00", status: "healthy", created_at: "2025-01-01" },
  { id: "centre-3", name: "Bloodbank@Woodlands", address: "1 Woodlands Square", opening_hours: "09:00-18:00", status: "low", created_at: "2025-01-01" },
  { id: "centre-4", name: "Bloodbank@HSA", address: "11 Outram Road", opening_hours: "08:00-17:00", status: "critical", created_at: "2025-01-01" },
  { id: "centre-5", name: "Bloodbank@Westgate Tower", address: "1 Jurong East", opening_hours: "09:00-18:00", status: "healthy", created_at: "2025-01-01" },
]

const MOCK_INVENTORY: BI[] = [
  { id: "inv-1", centre_id: "centre-1", blood_type: "O+", units: 42, capacity_pct: 35, status: "low", updated_at: "2025-06-01" },
  { id: "inv-2", centre_id: "centre-1", blood_type: "O-", units: 8, capacity_pct: 10, status: "critical", updated_at: "2025-06-01" },
  { id: "inv-3", centre_id: "centre-1", blood_type: "A+", units: 78, capacity_pct: 65, status: "healthy", updated_at: "2025-06-01" },
  { id: "inv-4", centre_id: "centre-1", blood_type: "A-", units: 15, capacity_pct: 20, status: "low", updated_at: "2025-06-01" },
  { id: "inv-5", centre_id: "centre-1", blood_type: "B+", units: 55, capacity_pct: 45, status: "healthy", updated_at: "2025-06-01" },
  { id: "inv-6", centre_id: "centre-1", blood_type: "B-", units: 12, capacity_pct: 15, status: "low", updated_at: "2025-06-01" },
  { id: "inv-7", centre_id: "centre-1", blood_type: "AB+", units: 25, capacity_pct: 50, status: "healthy", updated_at: "2025-06-01" },
  { id: "inv-8", centre_id: "centre-1", blood_type: "AB-", units: 5, capacity_pct: 8, status: "critical", updated_at: "2025-06-01" },
  { id: "inv-9", centre_id: "centre-2", blood_type: "O+", units: 62, capacity_pct: 72, status: "healthy", updated_at: "2025-06-01" },
  { id: "inv-10", centre_id: "centre-2", blood_type: "O-", units: 18, capacity_pct: 22, status: "low", updated_at: "2025-06-01" },
  { id: "inv-11", centre_id: "centre-2", blood_type: "A+", units: 88, capacity_pct: 76, status: "healthy", updated_at: "2025-06-01" },
  { id: "inv-12", centre_id: "centre-2", blood_type: "B+", units: 65, capacity_pct: 55, status: "healthy", updated_at: "2025-06-01" },
  { id: "inv-13", centre_id: "centre-3", blood_type: "O+", units: 22, capacity_pct: 28, status: "low", updated_at: "2025-06-01" },
  { id: "inv-14", centre_id: "centre-3", blood_type: "O-", units: 4, capacity_pct: 6, status: "critical", updated_at: "2025-06-01" },
  { id: "inv-15", centre_id: "centre-3", blood_type: "A+", units: 38, capacity_pct: 42, status: "healthy", updated_at: "2025-06-01" },
  { id: "inv-16", centre_id: "centre-4", blood_type: "O-", units: 2, capacity_pct: 4, status: "critical", updated_at: "2025-06-01" },
  { id: "inv-17", centre_id: "centre-4", blood_type: "A+", units: 12, capacity_pct: 14, status: "critical", updated_at: "2025-06-01" },
  { id: "inv-18", centre_id: "centre-4", blood_type: "B+", units: 8, capacity_pct: 10, status: "critical", updated_at: "2025-06-01" },
  { id: "inv-19", centre_id: "centre-5", blood_type: "O+", units: 52, capacity_pct: 62, status: "healthy", updated_at: "2025-06-01" },
  { id: "inv-20", centre_id: "centre-5", blood_type: "A+", units: 72, capacity_pct: 80, status: "healthy", updated_at: "2025-06-01" },
  { id: "inv-21", centre_id: "centre-5", blood_type: "B+", units: 48, capacity_pct: 58, status: "healthy", updated_at: "2025-06-01" },
]

const MOCK_CONTACTS: EmergencyContact[] = [
  { id: "ec-1", donor_id: "donor-1", name: "Sarah Tan", relation: "Spouse", phone: "+65 9876 5432" },
  { id: "ec-2", donor_id: "donor-1", name: "James Tan", relation: "Brother", phone: "+65 8765 4321" },
]

const MOCK_TRAVEL: TravelRecord[] = [
  { id: "tr-1", donor_id: "donor-1", country: "Thailand", city: "Bangkok", return_date: "2025-04-10", cleared_date: "2025-05-10", status: "cleared" },
  { id: "tr-2", donor_id: "donor-1", country: "Malaysia", city: "Kuala Lumpur", return_date: "2025-02-15", cleared_date: "2025-03-15", status: "cleared" },
  { id: "tr-3", donor_id: "donor-1", country: "Japan", city: "Tokyo", return_date: "2025-06-01", cleared_date: "", status: "pending" },
]

async function fetchOrFallback<T>(fetch: () => Promise<T | null | undefined>, fallback: T, label = "query"): Promise<T> {
  try {
    const result = await fetch()
    if (result === null || result === undefined) {
      console.warn(`[BloodLine] ${label}: returned null, using mock data`)
    }
    return result ?? fallback
  } catch (e) {
    console.error(`[BloodLine] ${label}:`, e)
    return fallback
  }
}

export default async function DashboardPage() {
  const profile = await fetchOrFallback(async () => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { console.warn("[BloodLine] No user session found"); return null }
    const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()
    if (error) console.error("[BloodLine] profiles query:", error.message); else if (!data) console.warn("[BloodLine] No profile found, using mock")
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

  const inventory = await fetchOrFallback(async () => {
    const supabase = await createClient()
    const { data, error } = await supabase.from("blood_inventory").select("*").order("blood_type", { ascending: true })
    if (error) { console.error("[BloodLine] blood_inventory query:", error.message); return null }
    return enrichInventory(data as BI[])
  }, enrichInventory(MOCK_INVENTORY), "blood_inventory")

  const contacts = await fetchOrFallback(async () => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data, error } = await supabase.from("emergency_contacts").select("*").eq("donor_id", user.id)
    if (error) console.error("[BloodLine] emergency_contacts query:", error.message)
    return data as EmergencyContact[]
  }, MOCK_CONTACTS, "emergency_contacts")

  const travel = await fetchOrFallback(async () => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data, error } = await supabase.from("travel_history").select("*").eq("donor_id", user.id).order("return_date", { ascending: false })
    if (error) console.error("[BloodLine] travel_history query:", error.message)
    return data as TravelRecord[]
  }, MOCK_TRAVEL, "travel_history")

  const centres = await fetchOrFallback(async () => {
    const supabase = await createClient()
    const { data, error } = await supabase.from("blood_centres").select("id, name").order("name", { ascending: true })
    if (error) console.error("[BloodLine] blood_centres query:", error.message)
    return data as BloodCentre[]
  }, MOCK_CENTRES, "blood_centres")

  return (
    <DashboardView
      profile={profile}
      appointments={appointments}
      inventory={inventory}
      contacts={contacts}
      travel={travel}
      centres={centres}
    />
  )
}
