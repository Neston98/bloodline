import { createClient } from "@/lib/supabase/client"

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
    console.log(`[FastPass] date ${appointmentDate} is ${diffDays} days away — outside 3-day window`)
    return false
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from("blood_inventory")
    .select("status, units")
    .eq("centre_id", centreId)
    .eq("blood_type", bloodType)
    .maybeSingle()

  if (error) {
    console.warn("[FastPass] inventory check error:", error.message)
  }

  const eligible = !data
    ? true
    : data.status === "critical" || data.status === "low"
  console.log(`[FastPass] centre=${centreId} type=${bloodType} status=${data?.status} units=${data?.units} eligible=${eligible}`)
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
  console.log("[FastPass] Sending email to", params.email)
  const res = await fetch("/api/email/fast-pass", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const text = await res.text()
    console.error("[FastPass] Email API error:", res.status, text)
    throw new Error(`Email API returned ${res.status}: ${text}`)
  }
  console.log("[FastPass] Email sent successfully")
}

export async function recalculateNextEligible(donorId: string): Promise<string> {
  const supabase = createClient()
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)

  const dates: Date[] = [today]

  const { data: appts } = await supabase
    .from("appointments")
    .select("appointment_date")
    .eq("donor_id", donorId)
    .in("status", ["scheduled", "fast_pass"])

  if (appts) {
    for (const a of appts) {
      const d = new Date(a.appointment_date + "T12:00:00")
      d.setDate(d.getDate() + 84)
      dates.push(d)
    }
  }

  const { data: travel } = await supabase
    .from("travel_history")
    .select("cleared_date")
    .eq("donor_id", donorId)
    .eq("status", "pending")

  if (travel) {
    for (const t of travel) {
      if (t.cleared_date) {
        dates.push(new Date(t.cleared_date + "T12:00:00"))
      }
    }
  }

  const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())))
  const nextEligible = maxDate.toISOString().slice(0, 10)

  await supabase.from("profiles").update({ next_eligible: nextEligible }).eq("id", donorId)
  return nextEligible
}
