"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import UserLayout from "@/components/layout/user-layout"
import { AppointmentCard } from "@/components/feature/appointment-card"
import { AlertBanner } from "@/components/feature/alert-banner"
import { CheckCircle2, Zap, RefreshCw } from "lucide-react"
import { DatePicker } from "@/components/ui/date-picker"
import { checkFastPassEligibility, sendFastPassEmail, recalculateNextEligible } from "@/lib/appointment"
import type { Profile, Appointment, BloodCentre, BloodInventory } from "@/types"

const TIME_SLOTS = [
  "09:00–09:20", "09:20–09:40", "09:40–10:00",
  "10:00–10:20", "10:20–10:40", "10:40–11:00",
  "11:00–11:20", "11:20–11:40", "11:40–12:00",
  "13:00–13:20", "13:20–13:40", "13:40–14:00",
  "14:00–14:20", "14:20–14:40", "14:40–15:00",
  "15:00–15:20", "15:20–15:40", "15:40–16:00",
  "16:00–16:20", "16:20–16:40", "16:40–17:00",
]

export function AppointmentsView({ profile, appointments: initialAppts, centres, inventory }: { profile: Profile; appointments: Appointment[]; centres: BloodCentre[]; inventory: BloodInventory[] }) {
  const router = useRouter()
  const [selectedCentre, setSelectedCentre] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [booking, setBooking] = useState(false)
  const [showRefreshed, setShowRefreshed] = useState(false)
  const [appointments, setAppointments] = useState(initialAppts)
  const [liveNextEligible, setLiveNextEligible] = useState(profile.next_eligible)
  const [travelConfirmed, setTravelConfirmed] = useState(false)

  useEffect(() => {
    setAppointments(initialAppts)
  }, [initialAppts])

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await recalculateNextEligible(user.id)
      const { data } = await supabase.from("profiles").select("next_eligible").eq("id", user.id).maybeSingle()
      if (data?.next_eligible) setLiveNextEligible(data.next_eligible)
    }
    init()
  }, [])

  const [fastPassEligible, setFastPassEligible] = useState(false)
  const [isFastPass, setIsFastPass] = useState(false)

  const fastPassWindow = (() => {
    const dates: string[] = []
    for (let i = 0; i < 4; i++) {
      const d = new Date()
      d.setDate(d.getDate() + i)
      dates.push(d.toISOString().slice(0, 10))
    }
    return dates
  })()

  useEffect(() => {
    setTravelConfirmed(false)
  }, [selectedCentre, selectedDate, selectedTime])

  const isDeferred = !!(
    selectedDate &&
    liveNextEligible &&
    selectedDate < liveNextEligible
  )

  const criticalCentres = centres
    .filter((c) => inventory.some(
      (i) => i.centre_id === c.id && i.blood_type === profile.blood_type && (i.status === "critical" || i.status === "low"),
    ))
    .map((c) => c.name)
    .filter((n, i, arr) => arr.indexOf(n) === i)

  const upcoming = appointments.filter((a) => a.status === "scheduled" || a.status === "fast_pass")
  const past = appointments.filter((a) => a.status === "completed" || a.status === "cancelled")

  function isAppointmentFastPass(apt: Appointment) {
    if (apt.status !== "scheduled" && apt.status !== "fast_pass") return false
    const inv = inventory.find((i) => i.centre_id === apt.centre_id && i.blood_type === profile.blood_type)
    if (!inv || (inv.status !== "critical" && inv.status !== "low")) return false
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const apptDate = new Date(apt.appointment_date); apptDate.setHours(0, 0, 0, 0)
    const diffDays = Math.round((apptDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays >= 0 && diffDays <= 3
  }

  useEffect(() => {
    if (selectedCentre && selectedDate) {
      checkFastPassEligibility(selectedCentre, profile.blood_type, selectedDate).then(setFastPassEligible)
    } else {
      setFastPassEligible(false)
    }
  }, [selectedCentre, selectedDate, profile.blood_type])

  const handleBook = async () => {
    if (!selectedCentre || !selectedDate || !selectedTime) return
    if (isDeferred) return
    if (!travelConfirmed) return
    setBooking(true)
    const centre = centres.find((c) => c.id === selectedCentre)
    if (!centre) return
    const [start, end] = selectedTime.split("–")
    const declarationTs = new Date().toISOString()
    const bookedDate = selectedDate
    const bookedTime = selectedTime

    const isFast = await checkFastPassEligibility(selectedCentre, profile.blood_type, selectedDate)

    const supabase = createClient()
    const { data: inserted, error } = await supabase
      .from("appointments")
      .insert({
        donor_id: profile.id,
        centre_id: selectedCentre,
        centre_name: centre.name,
        appointment_date: selectedDate,
        time_start: start,
        time_end: end,
        blood_type: profile.blood_type,
        status: "scheduled",
        travel_declaration: declarationTs,
      })
      .select("id")
      .single()

    if (error) { console.error("[BloodLine] book appointment insert:", error.message); setBooking(false); return }

    setSelectedCentre("")
    setSelectedDate("")
    setSelectedTime("")

    if (inserted?.id) {
      await recalculateNextEligible(profile.id)
      const { data: freshProfile } = await supabase.from("profiles").select("next_eligible").eq("id", profile.id).maybeSingle()
      if (freshProfile?.next_eligible) setLiveNextEligible(freshProfile.next_eligible)
    }

    const newAppt: Appointment = {
      id: inserted?.id || `apt-${Date.now()}`,
      donor_id: profile.id,
      centre_id: selectedCentre,
      centre_name: centre.name,
      appointment_date: bookedDate,
      time_start: start,
      time_end: end,
      blood_type: profile.blood_type,
      status: "scheduled",
      created_at: new Date().toISOString(),
    }

    if (isFast && inserted?.id) {
      try {
        await sendFastPassEmail({
          email: profile.email,
          donorName: profile.full_name,
          donorNric: profile.nric,
          donorPhone: profile.mobile || "",
          bloodType: profile.blood_type,
          centreName: centre.name,
          date: bookedDate,
          time: bookedTime,
          appointmentId: inserted.id,
          donorId: profile.id,
        })
      } catch (e) {
        console.error("[BloodLine] Fast-Pass email failed:", e)
      }
    }

    setIsFastPass(isFast)
    setAppointments((prev) => [newAppt, ...prev])
    setShowSuccess(true)
    setBooking(false)
    setTimeout(() => setShowSuccess(false), 4000)
  }

  const handleCancel = async (appointmentId: string) => {
    const supabase = createClient()
    const { error } = await supabase.from("appointments").update({ status: "cancelled" }).eq("id", appointmentId)
    if (error) {
      console.error("[BloodLine] cancel appointment error:", error.message)
      return
    }
    setAppointments((prev) => prev.map((a) => a.id === appointmentId ? { ...a, status: "cancelled" as const } : a))
    await recalculateNextEligible(profile.id)
    const supabase2 = createClient()
    const { data: freshProfile } = await supabase2.from("profiles").select("next_eligible").eq("id", profile.id).maybeSingle()
    if (freshProfile?.next_eligible) setLiveNextEligible(freshProfile.next_eligible)
    router.refresh()
  }

  const handleEditTime = async (id: string, timeStart: string, timeEnd: string) => {
    const supabase = createClient()
    const { error } = await supabase.from("appointments").update({ time_start: timeStart, time_end: timeEnd }).eq("id", id)
    if (error) { console.error("[BloodLine] edit time error:", error.message); return }
    setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, time_start: timeStart, time_end: timeEnd } : a))
  }

  return (
    <UserLayout currentPath="/appointments" profile={profile}>
      <div className="relative mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-black">Appointments</h1>
            <p className="mt-1 text-sm text-gray-900">Manage and schedule your blood donation appointments</p>
          </div>
          <button type="button" onClick={() => { setShowRefreshed(true); router.refresh(); setTimeout(() => setShowRefreshed(false), 3000) }}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            title="Refresh appointments">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        {showRefreshed && (
          <div className="absolute top-0 right-0 mt-1 mr-1 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white shadow-lg">
            Appointments refreshed
          </div>
        )}
      </div>

      {criticalCentres.length > 0 && <AlertBanner bloodType={profile.blood_type} centres={criticalCentres} className="mb-6" showScheduleButton={false} />}

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
              <DatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                minDate={liveNextEligible}
                direction="down"
                highlightDates={fastPassWindow}
                placeholder="Select donation date"
                inputCls="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black h-10 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              {isDeferred && (
                <p className="mt-1 text-xs text-red-600">
                  You are deferred from donating until {liveNextEligible}. Please select a date on or after this date.
                </p>
              )}
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
          <label className="mt-4 flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 cursor-pointer">
            <input
              type="checkbox"
              checked={travelConfirmed}
              onChange={(e) => setTravelConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            <span className="text-sm text-gray-900 leading-relaxed">
              I confirm that I have not travelled outside of Singapore in the last 14 days
            </span>
          </label>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <Button onClick={handleBook} disabled={!selectedCentre || !selectedDate || !selectedTime || isDeferred || booking || !travelConfirmed}>
              Confirm Booking
            </Button>
            {fastPassEligible && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                <Zap className="h-3.5 w-3.5" />
                Fast-Pass available
              </span>
            )}
            {showSuccess && (
              <div className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                {isFastPass ? "Fast-Pass issued! Check your email for the QR code." : "Appointment booked successfully!"}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-black">Upcoming Appointments</h2>
        {upcoming.length > 0 ? (
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
            {upcoming.map((apt) => (
              <AppointmentCard key={apt.id} appointment={apt} onCancel={handleCancel} onEditTime={handleEditTime} isFastPass={isAppointmentFastPass(apt)} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-900">No upcoming appointments. Schedule one above!</p>
        )}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-black">Past Appointments</h2>
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
          {past.slice(0, 8).map((apt) => (
            <AppointmentCard key={apt.id} appointment={apt} />
          ))}
        </div>
      </div>
    </UserLayout>
  )
}
