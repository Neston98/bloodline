import { createClient } from "@/lib/supabase/client"
import { computeCapacityPct, computeStatus } from "@/lib/inventory"
import { logger } from "@/lib/logger"

export async function checkFastPassEligibility(
  centreId: string,
  bloodType: string,
  appointmentDate: string,
): Promise<boolean> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const appt = new Date(appointmentDate)
  appt.setHours(0, 0, 0, 0)
  const diffDays = Math.round((appt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0 || diffDays > 3) {
    logger.info("fast-pass", "outside 3-day window", { centreId, bloodType, appointmentDate, diffDays })
    return false
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from("blood_inventory")
    .select("units")
    .eq("centre_id", centreId)
    .eq("blood_type", bloodType)
    .maybeSingle()

  if (error) {
    logger.warn("fast-pass", "inventory check error", { centreId, bloodType, error: error.message })
    return false
  }

  if (!data) {
    logger.warn("fast-pass", "no inventory data found", { centreId, bloodType })
    return false
  }

  const pct = computeCapacityPct(data.units)
  const status = computeStatus(pct)
  const eligible = status === "critical" || status === "low"

  logger.info("fast-pass", "eligibility result", { centreId, bloodType, units: data.units, pct, status, eligible })
  return eligible
}

export async function sendFastPassEmail(params: {
  email: string
  donorName: string
  donorNric: string
  donorPhone: string
  bloodType: string
  centreName: string
  date: string
  time: string
  appointmentId: string
  donorId: string
}) {
  logger.info("fast-pass", "sending email", { email: params.email, donorName: params.donorName })
  const res = await fetch("/api/email/fast-pass", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const text = await res.text()
    logger.error("fast-pass", "email API failed", { status: res.status, body: text })
    throw new Error(`Email API returned ${res.status}: ${text}`)
  }
  logger.info("fast-pass", "email sent successfully", { email: params.email })
}

export async function recalculateNextEligible(donorId: string, supabase?: any): Promise<string> {
  const client = supabase || createClient()
  const today = new Date()

  const dates: Date[] = [today]

  const { data: appts, error: apptErr } = await client
    .from("appointments")
    .select("appointment_date")
    .eq("donor_id", donorId)
    .in("status", ["scheduled", "fast_pass", "completed"])
  if (apptErr) {
    logger.warn("recalculate", "fetch appointments error", { donorId, error: apptErr.message })
  }

  if (appts) {
    for (const a of appts) {
      const d = new Date(a.appointment_date + "T12:00:00")
      d.setDate(d.getDate() + 84)
      dates.push(d)
    }
  }

  const { data: travel, error: travelErr } = await client
    .from("travel_history")
    .select("cleared_date")
    .eq("donor_id", donorId)
    .eq("status", "pending")
  if (travelErr) {
    logger.warn("recalculate", "fetch travel error", { donorId, error: travelErr.message })
  }

  if (travel) {
    for (const t of travel) {
      if (t.cleared_date) {
        dates.push(new Date(t.cleared_date + "T12:00:00"))
      }
    }
  }

  const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())))
  const nextEligible = maxDate.toISOString().slice(0, 10)

  const { error: updateErr } = await client.from("profiles").update({ next_eligible: nextEligible }).eq("id", donorId)
  if (updateErr) {
    logger.error("recalculate", "failed to update next_eligible", updateErr, { donorId, nextEligible })
  }

  logger.info("recalculate", "completed", { donorId, nextEligible, appointmentDates: appts?.length ?? 0, travelRecords: travel?.length ?? 0 })
  return nextEligible
}
