import { createAdminClient } from "@/lib/supabase/admin"
import { recalculateNextEligible } from "@/lib/appointment"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const body = await request.json()
  const { id } = body as { id: string }

  if (!id) {
    return NextResponse.json({ error: "Missing appointment id" }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: appt, error: fetchError } = await supabase
    .from("appointments")
    .select("donor_id, centre_id, blood_type, status")
    .eq("id", id)
    .single()

  if (fetchError || !appt) {
    return NextResponse.json({ error: fetchError?.message || "Appointment not found" }, { status: 404 })
  }

  const { error: updateError } = await supabase
    .from("appointments")
    .update({ status: "completed", admin_approved: true })
    .eq("id", id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  await recalculateNextEligible(appt.donor_id, supabase)

  const { data: profile } = await supabase
    .from("profiles")
    .select("points, lifetime_points")
    .eq("id", appt.donor_id)
    .single()

  const currentPoints = profile?.points ?? 0
  const currentLifetime = profile?.lifetime_points ?? 0

  const { error: pointsError } = await supabase
    .from("profiles")
    .update({
      points: currentPoints + 200,
      lifetime_points: currentLifetime + 200,
    })
    .eq("id", appt.donor_id)

  const { data: inv, error: invFetchError } = await supabase
    .from("blood_inventory")
    .select("id, units")
    .eq("centre_id", appt.centre_id)
    .eq("blood_type", appt.blood_type)
    .maybeSingle()

  if (inv && !invFetchError) {
    const newUnits = (inv.units || 0) + 1
    const capacity_pct = Math.round((newUnits / 800) * 100)
    const status = capacity_pct < 20 ? "critical" : capacity_pct < 40 ? "low" : "good"
    await supabase.from("blood_inventory").update({ units: newUnits, capacity_pct, status, updated_at: new Date().toISOString() }).eq("id", inv.id)
  }

  return NextResponse.json({
    success: true,
    points_awarded: pointsError ? false : true,
    inventory_updated: !(invFetchError),
  })
}
