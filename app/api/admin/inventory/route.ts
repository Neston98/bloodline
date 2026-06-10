import { createAdminClient } from "@/lib/supabase/admin"
import { logger } from "@/lib/logger"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const body = await request.json()
  const items = body.items as Array<{ id: string; units: number }>

  logger.info("api/admin/inventory", "request received", { itemCount: items?.length })

  if (!items || !Array.isArray(items)) {
    logger.warn("api/admin/inventory", "invalid request body")
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const supabase = createAdminClient()
  const errors: string[] = []

  for (const item of items) {
    const { error } = await supabase
      .from("blood_inventory")
      .update({ units: item.units })
      .eq("id", item.id)
    if (error) {
      logger.warn("api/admin/inventory", "failed to update item", { itemId: item.id, units: item.units, error: error.message })
      errors.push(error.message)
    }
  }

  logger.info("api/admin/inventory", "completed", { total: items.length, errors: errors.length })

  return NextResponse.json({ success: errors.length === 0, errors })
}
