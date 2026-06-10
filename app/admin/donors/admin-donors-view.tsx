"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { cn } from "@/utils/cn"
import { Phone, Mail, Clock, CheckCircle2, RefreshCw } from "lucide-react"
import type { BloodType } from "@/types"

export interface DonorAppointment {
  id: string
  time_start: string
  time_end: string
  donor_name: string
  donor_initials: string
  blood_type: BloodType
  status: "fast_pass" | "scheduled" | "completed" | "cancelled"
  admin_approved?: boolean
  travel_declaration?: string
  phone: string
  email: string
  emergency_contacts: Array<{ name: string; relation: string; phone: string }>
}

export function AdminDonorsView({
  centreName,
  centreId,
  dateFrom,
  dateTo,
  appointments,
}: {
  centreName: string
  centreId: string
  dateFrom: string
  dateTo: string
  appointments: DonorAppointment[]
}) {
  const router = useRouter()
  const [showRefreshed, setShowRefreshed] = useState(false)
  const [selectedId, setSelectedId] = useState(appointments.find((a) => a.status !== "cancelled")?.id || appointments[0]?.id || "")
  const [appts, setAppts] = useState(appointments.filter((a) => a.status !== "cancelled"))
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [travelDeclText, setTravelDeclText] = useState("")
  const selected = appts.find((a) => a.id === selectedId) ?? appts[0]

  useEffect(() => {
    const filtered = appointments.filter((a) => a.status !== "cancelled")
    setAppts(filtered)
    setSelectedId(filtered.find((a) => a.status !== "cancelled")?.id || filtered[0]?.id || "")
  }, [dateFrom, dateTo, appointments])

  useEffect(() => {
    if (selected?.travel_declaration) {
      setTravelDeclText(new Date(selected.travel_declaration).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }))
    } else {
      setTravelDeclText("")
    }
  }, [selected])

  async function handleMarkCompleted(apt: DonorAppointment) {
    setCompletingId(apt.id)
    try {
      const res = await fetch("/api/admin/appointments/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: apt.id }),
      })
      if (!res.ok) {
        const err = await res.json()
        console.error("[BloodLine] mark completed error:", err.error)
      } else {
        setAppts((prev) => prev.map((a) => a.id === apt.id ? { ...a, status: "completed" as const, admin_approved: true } : a))
      }
    } catch (e) {
      console.error("[BloodLine] mark completed error:", e)
    }
    setCompletingId(null)
  }

  return (
    <AdminLayout currentPath="/admin/donors" centreName={centreName} centreId={centreId}>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">Donors</h1>
          <p className="mt-1 text-sm text-gray-900">{centreName}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-gray-900">{new Date().toLocaleDateString("en-SG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
          <span className="text-sm font-medium text-gray-900">{appts.length} appointments at this centre</span>
          <button type="button" onClick={() => { setShowRefreshed(true); router.refresh(); setTimeout(() => setShowRefreshed(false), 3000) }}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            title="Refresh donors">
            <RefreshCw className="h-4 w-4" />
          </button>
          {showRefreshed && (
            <div className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white shadow-lg">
              Donors refreshed
            </div>
          )}
          <DatePicker
            value={dateFrom}
            onChange={(d) => router.push(`/admin/donors?centre_id=${encodeURIComponent(centreId)}&date_from=${d}&date_to=${dateTo}`)}
            inputCls="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            direction="down"
            align="right"
            calendarWidth={240}
            placeholder="From date"
          />
          <span className="text-sm text-gray-500">–</span>
          <DatePicker
            value={dateTo}
            onChange={(d) => router.push(`/admin/donors?centre_id=${encodeURIComponent(centreId)}&date_from=${dateFrom}&date_to=${d}`)}
            inputCls="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-black focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            direction="down"
            align="right"
            calendarWidth={240}
            placeholder="To date"
          />
        </div>
      </div>

      {appts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-900">
              {dateFrom === dateTo
                ? "No appointments scheduled for this date."
                : "No appointments scheduled for this date range."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>{dateFrom === dateTo ? "Appointments" : `Appointments (${dateFrom} – ${dateTo})`}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {appts.map((apt) => (
                    <button
                      key={apt.id}
                      onClick={() => setSelectedId(apt.id)}
                      className={cn(
                        "flex w-full items-center gap-4 rounded-lg border p-3 text-left transition-colors",
                        selectedId === apt.id
                          ? "border-red-200 bg-red-50"
                          : "border-gray-100 bg-white hover:bg-gray-50",
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-900">{apt.time_start} – {apt.time_end}</p>
                        <p className={cn("text-sm font-medium", selectedId === apt.id ? "text-red-700" : "text-black")}>
                          {apt.donor_name}
                        </p>
                      </div>
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold",
                        apt.blood_type === "O-" ? "bg-red-100 text-red-700" :
                        apt.blood_type === "O+" ? "bg-orange-100 text-orange-700" :
                        apt.blood_type === "A+" || apt.blood_type === "A-" ? "bg-blue-100 text-blue-700" :
                        apt.blood_type === "B+" || apt.blood_type === "B-" ? "bg-purple-100 text-purple-700" :
                        "bg-green-100 text-green-700",
                      )}>
                        {apt.blood_type}
                      </span>
                      <Badge variant={apt.status === "fast_pass" ? "danger" : apt.status === "cancelled" ? "default" : apt.status === "completed" ? "success" : "warning"}>
                        {apt.status === "fast_pass" ? "Fast-Pass" : apt.status === "cancelled" ? "Cancelled" : apt.status === "completed" ? "Completed" : "Scheduled"}
                      </Badge>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {selected && (
              <Card>
                <CardHeader>
                  <CardTitle>Donor Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center gap-4 border-b border-gray-100 pb-5">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-xl font-bold text-red-600">
                      {selected.donor_initials}
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-black">{selected.donor_name}</p>
                      <div className="mt-1 flex items-center justify-center gap-2">
                        <span className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold",
                          selected.blood_type === "O-" ? "bg-red-100 text-red-700" :
                          selected.blood_type === "O+" ? "bg-orange-100 text-orange-700" :
                          selected.blood_type === "A+" || selected.blood_type === "A-" ? "bg-blue-100 text-blue-700" :
                          selected.blood_type === "B+" || selected.blood_type === "B-" ? "bg-purple-100 text-purple-700" :
                          "bg-green-100 text-green-700",
                        )}>
                          {selected.blood_type}
                        </span>
                        <Badge variant={selected.status === "fast_pass" ? "danger" : selected.status === "cancelled" ? "default" : selected.status === "completed" ? "success" : "warning"}>
                          {selected.status === "fast_pass" ? "Fast-Pass" : selected.status === "cancelled" ? "Cancelled" : selected.status === "completed" ? "Completed" : "Scheduled"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-gray-600" />
                      <div>
                        <p className="text-xs text-gray-900">Phone</p>
                        <p className="text-sm font-medium text-black">{selected.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-gray-600" />
                      <div>
                        <p className="text-xs text-gray-900">Email</p>
                        <p className="text-sm font-medium text-black">{selected.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-gray-600" />
                      <div>
                        <p className="text-xs text-gray-900">Appointment</p>
                        <p className="text-sm font-medium text-black">Today, {selected.time_start} – {selected.time_end}</p>
                      </div>
                    </div>
                    {selected.travel_declaration && (
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-4 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-[8px] text-green-700 font-bold">✓</span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-900">Travel Declaration</p>
                          <p className="text-sm font-medium text-green-700">
                            Confirmed {travelDeclText}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {(selected.status === "scheduled" || selected.status === "fast_pass") && (
                    <div className="mt-4">
                      <Button
                        onClick={() => handleMarkCompleted(selected)}
                        disabled={completingId === selected.id}
                        className="w-full"
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        {completingId === selected.id ? "Completing..." : "Mark as Completed"}
                      </Button>
                    </div>
                  )}

                  <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-900">Emergency Contacts</p>
                    <div className="space-y-3">
                      {selected.emergency_contacts.map((ec, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 text-xs font-bold text-amber-600">
                            {ec.name.split(" ").map((n) => n[0]).join("")}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-black">{ec.name}</p>
                            <p className="text-xs text-gray-900">{ec.relation} · {ec.phone}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
