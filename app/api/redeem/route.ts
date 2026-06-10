import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const body = await request.json()
  const { donorId, voucherId, voucherName, pointsCost } = body

  if (!donorId || !voucherId || !voucherName || !pointsCost) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { error: redemptionError } = await supabase
    .from("reward_redemptions")
    .insert({
      donor_id: donorId,
      voucher_id: voucherId,
      voucher_name: voucherName,
      points_spent: pointsCost,
    })

  if (redemptionError) {
    return NextResponse.json({ error: redemptionError.message }, { status: 500 })
  }

  const { error: pointsError } = await supabase.rpc("deduct_points", {
    p_donor_id: donorId,
    p_points: pointsCost,
  })

  if (pointsError) {
    return NextResponse.json({ error: pointsError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
