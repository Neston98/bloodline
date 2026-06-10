import { createAdminClient } from "@/lib/supabase/admin"
import { recalculateNextEligible } from "@/lib/appointment"
import { AdminDonorsView, type DonorAppointment } from "./admin-donors-view"
import type { BloodType } from "@/types"

async function fetchOrFallback<T>(fetch: () => Promise<T | null | undefined>, fallback: T, label = "query"): Promise<T> {
  try {
    const result = await fetch()
    return result ?? fallback
  } catch (e) {
    console.error(`[BloodLine] ${label}:`, e)
    return fallback
  }
}

export default async function AdminDonorsPage({
  searchParams,
}: {
  searchParams: Promise<{ centre_id?: string; date_from?: string; date_to?: string }>
}) {
  const params = await searchParams
  const centreId = params.centre_id ?? ""
  const dateFrom = params.date_from ?? new Date().toISOString().slice(0, 10)
  const dateTo = params.date_to ?? dateFrom
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
    let query = supabase
      .from("appointments")
      .select("id, appointment_date, time_start, time_end, blood_type, status, admin_approved, travel_declaration, donor_id, profiles!inner(full_name, initials, mobile, email, id)")
      .order("time_start", { ascending: true })

    if (dateFrom === dateTo) {
      query = query.eq("appointment_date", dateFrom)
    } else {
      query = query.gte("appointment_date", dateFrom).lte("appointment_date", dateTo)
    }

    const { data, error } = await query
    if (error) { console.error("[BloodLine] admin donors query:", error.message); return null }

    if (!data || data.length === 0) return []

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
      appointment_date: a.appointment_date as string,
      time_start: a.time_start as string,
      time_end: a.time_end as string,
      donor_name: (profile.full_name as string) || "Unknown",
      donor_initials: (profile.initials as string) || "??",
      blood_type: a.blood_type as BloodType,
      status: (a.status === "fast_pass" ? "fast_pass" : a.status === "scheduled" ? "scheduled" : a.status === "completed" ? "completed" : "cancelled") as DonorAppointment["status"],
      admin_approved: (a.admin_approved as boolean) ?? false,
      travel_declaration: (a.travel_declaration as string) || undefined,
      phone: (profile.mobile as string) || "",
      email: (profile.email as string) || "",
      emergency_contacts: ecMap.get(a.donor_id as string) || [{ name: "Unknown", relation: "Unknown", phone: "N/A" }],
    }})
  }, [], "admin donors")

  return <AdminDonorsView centreName={centreName} centreId={centreId} dateFrom={dateFrom} dateTo={dateTo} appointments={appointments} />
}
