"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/layout/admin-layout"
import { PageHeader } from "@/components/feature/page-header"
import { StatsCard } from "@/components/feature/stats-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/utils/cn"
import { Users, Zap, Droplets, Clock, AlertTriangle, RefreshCw } from "lucide-react"
import type { InventoryStatus } from "@/types"

interface AdminInventoryItem {
  blood_type: string
  units: number
  capacity_pct: number
  status: InventoryStatus
}

interface QueueDonor {
  initials: string
  name: string
  blood_type: string
  centre: string
  time: string
  status: "fast_pass" | "scheduled"
}

export function AdminDashboardView({
  centreName,
  centreId,
  inventory,
  queue,
  donorCount,
  apptCount,
}: {
  centreName: string
  centreId: string
  inventory: AdminInventoryItem[]
  queue: QueueDonor[]
  donorCount: number
  apptCount: number
}) {
  const router = useRouter()
  const [showRefreshed, setShowRefreshed] = useState(false)
  const totalWaitMin = queue.length * 20
  const fastPassCount = queue.filter((q) => q.status === "fast_pass").length
  const surgeMin = Math.min(totalWaitMin, fastPassCount * 5)
  const waitDisplay = totalWaitMin < 60 ? `${totalWaitMin}min` : `${Math.floor(totalWaitMin / 60)}h ${totalWaitMin % 60}min`
  const surgeDisplay = surgeMin > 0 ? `+${surgeMin} min surge` : "On time"

  function getGreeting() {
    const hour = new Date().getHours()
    if (hour < 12) return "Good Morning"
    if (hour < 18) return "Good Afternoon"
    return "Good Evening"
  }

  function formatToday() {
    return new Date().toLocaleDateString("en-SG", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    })
  }

  const isCritical = inventory.some((i) => i.status === "critical")
  const criticalType = inventory.find((i) => i.status === "critical")

  return (
    <AdminLayout currentPath="/admin/dashboard" centreName={centreName} centreId={centreId}>
      <div className="relative flex items-start justify-between">
        <PageHeader greeting={getGreeting()} date={formatToday()} />
        <button type="button" onClick={() => { setShowRefreshed(true); router.refresh(); setTimeout(() => setShowRefreshed(false), 3000) }}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          title="Refresh dashboard">
          <RefreshCw className="h-4 w-4" />
        </button>
        {showRefreshed && (
          <div className="absolute top-0 right-0 mt-1 mr-1 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white shadow-lg">
            Dashboard refreshed
          </div>
        )}
      </div>

      {isCritical && criticalType && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">Critical: {criticalType.blood_type} blood at {criticalType.capacity_pct}% nationally</p>
            <p className="text-sm text-red-600">Fast pass will be issued for emergency donations.</p>
          </div>
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Active Donors" value={donorCount.toLocaleString()} subtext="Registered" icon={<Users className="h-5 w-5" />} />
        <StatsCard label="Fast-Passes Today" value={queue.filter((q) => q.status === "fast_pass").length.toString()} subtext={isCritical ? "Critical trigger active" : "Normal"} icon={<Zap className="h-5 w-5" />} />
        <StatsCard label="Donations Today" value={apptCount.toString()} subtext="All appointments" icon={<Droplets className="h-5 w-5" />} />
        <StatsCard label="Queue Wait Time" value={waitDisplay} subtext={surgeDisplay} icon={<Clock className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>National Blood Supply</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inventory.map((item) => (
                <div key={item.blood_type} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-10 text-sm font-bold text-black">{item.blood_type}</span>
                    <div className="h-2 w-32 rounded-full bg-gray-100 sm:w-48">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          item.status === "critical" ? "bg-red-500" : item.status === "low" ? "bg-amber-500" : item.status === "moderate" ? "bg-yellow-500" : "bg-green-500",
                        )}
                        style={{ width: `${item.capacity_pct}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{item.units} units</span>
                    <Badge
                      variant={item.status === "critical" ? "danger" : item.status === "low" || item.status === "moderate" ? "warning" : "success"}
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

        <Card>
          <CardHeader>
            <CardTitle>Fast-Pass Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {queue.length > 0 ? (
                queue.map((donor, i) => (
                  <div key={i} className="flex items-center gap-4 rounded-lg border border-gray-100 p-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-sm font-bold text-red-600">
                      {donor.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-black">{donor.name}</p>
                      <p className="text-xs text-gray-900">{donor.centre}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{donor.blood_type}</p>
                      <p className="text-xs text-gray-900">{donor.time}</p>
                    </div>
                    <Badge variant={donor.status === "fast_pass" ? "danger" : "warning"}>
                      {donor.status === "fast_pass" ? "Fast-Pass" : "Scheduled"}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-900">No appointments scheduled today.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
