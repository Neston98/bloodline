"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/utils/cn"
import { Phone, Mail, Clock, ChevronDown } from "lucide-react"
import type { BloodType } from "@/types"

export interface DonorAppointment {
  id: string
  time_start: string
  time_end: string
  donor_name: string
  donor_initials: string
  blood_type: BloodType
  status: "fast_pass" | "scheduled" | "completed" | "cancelled"
  phone: string
  email: string
  emergency_contact: { name: string; relation: string; phone: string }
}

export function AdminDonorsView({
  centreName,
  centreId,
  appointments,
}: {
  centreName: string
  centreId: string
  appointments: DonorAppointment[]
}) {
  const [selectedId, setSelectedId] = useState(appointments[0]?.id || "")
  const selected = appointments.find((a) => a.id === selectedId) ?? appointments[0]

  return (
    <AdminLayout currentPath="/admin/donors" centreName={centreName} centreId={centreId}>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">Donors</h1>
          <p className="mt-1 text-sm text-gray-900">{centreName}</p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-900">{new Date().toLocaleDateString("en-SG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
          <span className="text-sm font-medium text-gray-900">{appointments.length} appointments at this centre</span>
          <div className="relative">
            <select className="appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-8 text-sm text-black focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500">
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
          </div>
        </div>
      </div>

      {appointments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-900">No appointments scheduled for today.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>{"Today's Appointments"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {appointments.map((apt) => (
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
                      <Badge variant={apt.status === "fast_pass" ? "danger" : "warning"}>
                        {apt.status === "fast_pass" ? "Fast-Pass" : "Scheduled"}
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
                        <Badge variant={selected.status === "fast_pass" ? "danger" : "warning"}>
                          {selected.status === "fast_pass" ? "Fast-Pass" : "Scheduled"}
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
                  </div>

                  <div className="mt-6 rounded-lg border border-gray-100 bg-gray-50 p-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-900">Emergency Contact</p>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 text-xs font-bold text-amber-600">
                        {selected.emergency_contact.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-black">{selected.emergency_contact.name}</p>
                        <p className="text-xs text-gray-900">{selected.emergency_contact.relation} · {selected.emergency_contact.phone}</p>
                      </div>
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
