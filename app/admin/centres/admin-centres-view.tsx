"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { cn } from "@/utils/cn"
import { MapPin, Plus, Minus, Save, Building } from "lucide-react"
import type { InventoryStatus } from "@/types"

interface CentreInventoryItem {
  id: string
  blood_type: string
  units: number
  capacity_pct: number
  status: InventoryStatus
}

const MAX_UNITS = 800

function computeStatus(capacityPct: number): InventoryStatus {
  if (capacityPct < 20) return "critical"
  if (capacityPct < 40) return "low"
  if (capacityPct <= 70) return "moderate"
  return "healthy"
}

export function AdminCentresView({
  centreName,
  address,
  centreId,
  inventoryItems,
}: {
  centreName: string
  address: string
  centreId: string
  inventoryItems: CentreInventoryItem[]
}) {
  const [inventory, setInventory] = useState(inventoryItems)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [lastUpdated, setLastUpdated] = useState("")

  useEffect(() => {
    setLastUpdated(new Date().toLocaleDateString("en-SG", { weekday: "long", hour: "2-digit", minute: "2-digit", hour12: true }))
  }, [])

  function adjustUnits(idx: number, delta: number) {
    setInventory((prev) => {
      const next = [...prev]
      const item = { ...next[idx] }
      const newUnits = Math.max(0, Math.min(MAX_UNITS, item.units + delta))
      const newCapacityPct = Math.round((newUnits / MAX_UNITS) * 100)
      item.units = newUnits
      item.capacity_pct = newCapacityPct
      item.status = computeStatus(newCapacityPct)
      next[idx] = item
      return next
    })
  }

  async function handleSave() {
    setSaving(true)
    const items = inventory.map((i) => ({ id: i.id, units: i.units }))
    const res = await fetch("/api/admin/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    })
    const result = await res.json()
    if (result.errors?.length) {
      console.error("[BloodLine] save inventory:", result.errors.join(", "))
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const totalUnits = inventory.reduce((sum, item) => sum + item.units, 0)
  const criticalCount = inventory.filter((i) => i.status === "critical").length
  const lowCount = inventory.filter((i) => i.status === "low").length

  return (
    <AdminLayout currentPath="/admin/centres" centreName={centreName} centreId={centreId}>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">Blood Centres</h1>
          <p className="mt-1 text-sm text-gray-900">
            Last Updated: {lastUpdated || "Loading..."}
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="flex items-start gap-4 p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <Building className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-black">{centreName}</h3>
            <div className="mt-1 flex items-center gap-1 text-sm text-gray-900">
              <MapPin className="h-3.5 w-3.5" />
              {address}
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              <span className="text-gray-600">
                Total Units: <strong className="text-black">{totalUnits}</strong>
              </span>
              <span className="text-gray-600">
                Critical Types: <strong className="text-red-600">{criticalCount}</strong>
              </span>
              <span className="text-gray-600">
                Low Types: <strong className="text-amber-600">{lowCount}</strong>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {inventory.map((item, idx) => (
          <Card key={item.id}>
            <CardContent className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-2xl font-bold text-black">{item.blood_type}</span>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                    item.status === "critical" && "bg-red-100 text-red-700",
                    item.status === "low" && "bg-orange-100 text-orange-800",
                    item.status === "moderate" && "bg-yellow-100 text-yellow-800",
                    item.status === "healthy" && "bg-green-100 text-green-700",
                  )}
                >
                  {item.status}
                </span>
              </div>

              <div className="mb-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-900">Capacity</span>
                  <span className="font-medium text-gray-900">{item.capacity_pct}%</span>
                </div>
                <Progress
                  value={item.capacity_pct}
                  className="mt-1"
                  indicatorClassName={
                    item.status === "critical" ? "bg-status-critical" :
                    item.status === "low" ? "bg-status-low" :
                    item.status === "moderate" ? "bg-status-moderate" :
                    "bg-status-healthy"
                  }
                />
              </div>

              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={() => adjustUnits(idx, -1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="text-lg font-bold text-black">{item.units}</span>
                <button
                  onClick={() => adjustUnits(idx, 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:border-green-200 hover:bg-green-50 hover:text-green-600"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mt-6 text-xs text-gray-600">
        Changes are reflected nationally once saved. Threshold: Critical &lt;15%, Low &lt;40%.
      </p>
    </AdminLayout>
  )
}
