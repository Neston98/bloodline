import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const body = await request.json()
  const items = body.items as Array<{ id: string; units: number }>

  if (!items || !Array.isArray(items)) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const supabase = createAdminClient()
  const errors: string[] = []

  for (const item of items) {
    const { error } = await supabase
      .from("blood_inventory")
      .update({ units: item.units })
      .eq("id", item.id)
    if (error) errors.push(error.message)
  }

  return NextResponse.json({ success: errors.length === 0, errors })
}
