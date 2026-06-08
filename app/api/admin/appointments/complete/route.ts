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
    .select("donor_id, status")
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

  return NextResponse.json({
    success: true,
    points_awarded: pointsError ? false : true,
  })
}
