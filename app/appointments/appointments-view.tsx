"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import UserLayout from "@/components/layout/user-layout"
import { AppointmentCard } from "@/components/feature/appointment-card"
import { CheckCircle2 } from "lucide-react"
import type { Profile, Appointment, BloodCentre } from "@/types"

const TIME_SLOTS = ["09:00–10:00", "10:00–11:00", "11:00–12:00", "13:00–14:00", "14:00–15:00", "15:00–16:00", "16:00–17:00"]

export function AppointmentsView({ profile, appointments: initialAppts, centres }: { profile: Profile; appointments: Appointment[]; centres: BloodCentre[] }) {
  const [selectedCentre, setSelectedCentre] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [appointments, setAppointments] = useState(initialAppts)

  const upcoming = appointments.filter((a) => a.status === "scheduled" || a.status === "fast_pass")
  const past = appointments.filter((a) => a.status === "completed" || a.status === "cancelled")

  const handleBook = async () => {
    if (!selectedCentre || !selectedDate || !selectedTime) return
    const centre = centres.find((c) => c.id === selectedCentre)!
    const [start, end] = selectedTime.split("–")
    const newAppt: Appointment = {
      id: `apt-${Date.now()}`,
      donor_id: profile.id,
      centre_id: selectedCentre,
      centre_name: centre.name,
      appointment_date: selectedDate,
      time_start: start,
      time_end: end,
      blood_type: profile.blood_type,
      status: "scheduled",
      created_at: new Date().toISOString(),
    }

    const supabase = createClient()
    const { error } = await supabase.from("appointments").insert({
      donor_id: profile.id,
      centre_id: selectedCentre,
      centre_name: centre.name,
      appointment_date: selectedDate,
      time_start: start,
      time_end: end,
      blood_type: profile.blood_type,
      status: "scheduled",
    })
    if (error) console.error("[BloodLine] book appointment insert:", error.message)

    setAppointments((prev) => [newAppt, ...prev])
    setShowSuccess(true)
    setSelectedCentre("")
    setSelectedDate("")
    setSelectedTime("")
    setTimeout(() => setShowSuccess(false), 4000)
  }

  return (
    <UserLayout currentPath="/appointments" profile={profile}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black">Appointments</h1>
        <p className="mt-1 text-sm text-gray-900">Manage and schedule your blood donation appointments</p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Quick Book Appointment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-900">Blood Centre</label>
              <select
                value={selectedCentre}
                onChange={(e) => setSelectedCentre(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black h-10 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              >
                <option value="" className="text-black">Select a centre</option>
                {centres.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-900">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black h-10 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-900">Time Slot</label>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black h-10 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              >
                <option value="" className="text-black">Select time</option>
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <Button onClick={handleBook} disabled={!selectedCentre || !selectedDate || !selectedTime}>
              Confirm Booking
            </Button>
            {showSuccess && (
              <div className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                Appointment booked successfully!
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-black">Upcoming Appointments</h2>
        {upcoming.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {upcoming.map((apt) => (
              <AppointmentCard key={apt.id} appointment={apt} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-900">No upcoming appointments. Schedule one above!</p>
        )}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-black">Past Appointments</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {past.map((apt) => (
            <AppointmentCard key={apt.id} appointment={apt} />
          ))}
        </div>
      </div>
    </UserLayout>
  )
}
