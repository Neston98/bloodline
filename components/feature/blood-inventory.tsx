"use client"

import { useState } from "react"
import { cn } from "@/utils/cn"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { BloodInventory, BloodType } from "@/types"

const ALL_BLOOD_TYPES = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"]

interface BloodInventoryProps {
  inventory: BloodInventory[]
  centreName?: string
  userBloodType?: string
}

function barColor(status: BloodInventory["status"]) {
  if (status === "critical") return "bg-red-600"
  if (status === "low") return "bg-amber-600"
  if (status === "moderate") return "bg-yellow-500"
  return "bg-green-600"
}

function computeStatus(pct: number) {
  if (pct < 20) return "critical" as const
  if (pct < 40) return "low" as const
  if (pct <= 70) return "moderate" as const
  return "healthy" as const
}

export function BloodInventory({ inventory, centreName, userBloodType }: BloodInventoryProps) {
  const [showAll, setShowAll] = useState(false)
  const existing = new Map<string, BloodInventory>(inventory.map((i) => [i.blood_type, i]))
  const rows = ALL_BLOOD_TYPES.map((bt) => {
    const item = existing.get(bt)
    if (item) return item
    return { id: `pad-${bt}`, centre_id: "", blood_type: bt as BloodType, units: 0, capacity_pct: 0, status: "healthy" as const, updated_at: "" }
  })
  const displayed = showAll ? rows : rows.filter((r) => r.blood_type === userBloodType)
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Blood Supply {centreName ? `– ${centreName}` : ""}</CardTitle>
          {userBloodType && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="text-sm font-medium text-red-600 hover:text-red-700"
            >
              {showAll ? "Show my type only" : "See other blood types"}
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayed.map((item) => (
            <div key={item.id || item.blood_type} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-10 shrink-0 text-sm font-bold text-black">{item.blood_type}</span>
                <div className="h-2 w-52 rounded-full bg-gray-100">
                  <div
                    className={cn("h-full rounded-full transition-all", barColor(item.status))}
                    style={{ width: `${Math.max(2, item.capacity_pct ?? 0)}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-16 text-right text-sm text-gray-600 shrink-0">{item.units} units</span>
                <Badge
                  variant={
                    item.status === "critical"
                      ? "danger"
                      : item.status === "low" || item.status === "moderate"
                        ? "warning"
                        : "success"
                  }
                  className="w-16 justify-center shrink-0"
                >
                  {item.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
