import { createAdminClient } from "@/lib/supabase/admin"
import { recalculateNextEligible } from "@/lib/appointment"
import { AdminDonorsView, type DonorAppointment } from "./admin-donors-view"
import type { BloodType } from "@/types"

const FALLBACK_APPOINTMENTS: DonorAppointment[] = [
  { id: "a1", time_start: "09:00", time_end: "09:30", donor_name: "Alex Tan", donor_initials: "AT", blood_type: "O+" as BloodType, status: "fast_pass", admin_approved: false, phone: "+65 9123 4567", email: "alex.tan@email.com", emergency_contacts: [{ name: "Sarah Tan", relation: "Spouse", phone: "+65 9876 5432" }, { name: "Mike Tan", relation: "Brother", phone: "+65 9123 1111" }] },
  { id: "a2", time_start: "10:00", time_end: "10:30", donor_name: "Sarah Lim", donor_initials: "SL", blood_type: "A-" as BloodType, status: "scheduled", admin_approved: false, phone: "+65 9234 5678", email: "sarah.lim@email.com", emergency_contacts: [{ name: "John Lim", relation: "Brother", phone: "+65 8765 4321" }] },
  { id: "a3", time_start: "11:00", time_end: "11:30", donor_name: "James Wong", donor_initials: "JW", blood_type: "B+" as BloodType, status: "fast_pass", admin_approved: false, phone: "+65 9345 6789", email: "james.wong@email.com", emergency_contacts: [{ name: "Lisa Wong", relation: "Spouse", phone: "+65 8654 3210" }] },
  { id: "a4", time_start: "13:00", time_end: "13:30", donor_name: "Lisa Chen", donor_initials: "LC", blood_type: "AB+" as BloodType, status: "scheduled", admin_approved: false, phone: "+65 9456 7890", email: "lisa.chen@email.com", emergency_contacts: [{ name: "Mike Chen", relation: "Husband", phone: "+65 8543 2109" }] },
  { id: "a5", time_start: "14:00", time_end: "14:30", donor_name: "Mike Tan", donor_initials: "MT", blood_type: "O-" as BloodType, status: "fast_pass", admin_approved: false, phone: "+65 9567 8901", email: "mike.tan@email.com", emergency_contacts: [{ name: "Rachel Tan", relation: "Sister", phone: "+65 8432 1098" }] },
  { id: "a6", time_start: "15:00", time_end: "15:30", donor_name: "Rachel Ng", donor_initials: "RN", blood_type: "A+" as BloodType, status: "scheduled", admin_approved: false, phone: "+65 9678 9012", email: "rachel.ng@email.com", emergency_contacts: [{ name: "David Ng", relation: "Father", phone: "+65 8321 0987" }] },
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

export default async function AdminDonorsPage({
  searchParams,
}: {
  searchParams: Promise<{ centre_id?: string; date?: string }>
}) {
  const params = await searchParams
  const centreId = params.centre_id ?? ""
  const dateParam = params.date ?? new Date().toISOString().slice(0, 10)
  const today = new Date().toISOString().slice(0, 10)

  const supabase = createAdminClient()
  const centreResult = await supabase.from("blood_centres").select("name").eq("id", centreId).single()
  const centreName = centreResult.data?.name ?? "Blood Centre"

  // Auto-cancel past unapproved appointments and recalculate eligibility
  const { data: cancelled } = await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("centre_id", centreId)
    .in("status", ["scheduled", "fast_pass"])
    .lt("appointment_date", today)
    .select("donor_id")
  if (cancelled && cancelled.length > 0) {
    const donorIds = [...new Set(cancelled.map((a: { donor_id: string }) => a.donor_id))]
    for (const donorId of donorIds) {
      await recalculateNextEligible(donorId, supabase)
    }
  }

  const appointments = await fetchOrFallback(async () => {
    const { data, error } = await supabase
      .from("appointments")
      .select("id, time_start, time_end, blood_type, status, admin_approved, donor_id, profiles!inner(full_name, initials, mobile, email, id)")
      .eq("appointment_date", dateParam)
      .order("time_start", { ascending: true })
    if (error) { console.error("[BloodLine] admin donors query:", error.message); return null }

    if (!data || data.length === 0) return null

    const seen = new Set<string>()
    const unique = (data as Array<Record<string, unknown>>).filter((a) => {
      if (seen.has(a.id as string)) return false
      seen.add(a.id as string)
      return true
    })

    const donorIds = [...new Set(unique.map((a) => (a as { donor_id: string }).donor_id))]

    const supabase2 = createAdminClient()
    const { data: ecData } = await supabase2
      .from("emergency_contacts")
      .select("*")
      .in("donor_id", donorIds)

    const ecMap = new Map<string, Array<{ name: string; relation: string; phone: string }>>()
    if (ecData) {
      for (const ec of ecData as Array<{ donor_id: string; name: string; relation: string; phone: string }>) {
        const existing = ecMap.get(ec.donor_id) || []
        existing.push({ name: ec.name, relation: ec.relation, phone: ec.phone })
        ecMap.set(ec.donor_id, existing)
      }
    }

    return unique.map((a) => {
      const profile = (a.profiles as Record<string, unknown>) || {}
      return {
      id: a.id as string,
      time_start: a.time_start as string,
      time_end: a.time_end as string,
      donor_name: (profile.full_name as string) || "Unknown",
      donor_initials: (profile.initials as string) || "??",
      blood_type: a.blood_type as BloodType,
      status: (a.status === "fast_pass" ? "fast_pass" : a.status === "scheduled" ? "scheduled" : a.status === "completed" ? "completed" : "cancelled") as DonorAppointment["status"],
      admin_approved: (a.admin_approved as boolean) ?? false,
      phone: (profile.mobile as string) || "",
      email: (profile.email as string) || "",
      emergency_contacts: ecMap.get(a.donor_id as string) || [{ name: "Unknown", relation: "Unknown", phone: "N/A" }],
    }})
  }, dateParam === today ? FALLBACK_APPOINTMENTS : [], "admin donors")

  return <AdminDonorsView centreName={centreName} centreId={centreId} dateParam={dateParam} appointments={appointments} />
}
