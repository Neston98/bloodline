"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { PageHeader } from "@/components/feature/page-header"
import { StatsCard } from "@/components/feature/stats-card"
import { AlertBanner } from "@/components/feature/alert-banner"
import { BloodInventory } from "@/components/feature/blood-inventory"
import { AppointmentCard } from "@/components/feature/appointment-card"
import { EmergencyContacts } from "@/components/feature/emergency-contacts"
import { TravelHistory } from "@/components/feature/travel-history"
import UserLayout from "@/components/layout/user-layout"
import { Droplets, Award, Calendar, Heart, RefreshCw } from "lucide-react"
import { getDisplayTier } from "@/utils/formatters"
import type { Profile, Appointment, BloodCentre, BloodInventory as BI, EmergencyContact, TravelRecord } from "@/types"

export function DashboardView({
  profile,
  appointments,
  inventory,
  contacts,
  travel,
  centres,
}: {
  profile: Profile
  appointments: Appointment[]
  inventory: BI[]
  contacts: EmergencyContact[]
  travel: TravelRecord[]
  centres: BloodCentre[]
}) {
  const router = useRouter()
  const [selectedCentreId, setSelectedCentreId] = useState(centres[0]?.id || "")
  const [showRefreshed, setShowRefreshed] = useState(false)
  const [liveAppts, setLiveAppts] = useState(appointments)

  useEffect(() => {
    setLiveAppts(appointments)
  }, [appointments])

  const handleEditTime = async (id: string, timeStart: string, timeEnd: string) => {
    const supabase = createClient()
    const { error } = await supabase.from("appointments").update({ time_start: timeStart, time_end: timeEnd }).eq("id", id)
    if (error) { console.error("[BloodLine] edit time error:", error.message); return }
    setLiveAppts((prev) => prev.map((a) => a.id === id ? { ...a, time_start: timeStart, time_end: timeEnd } : a))
  }
  const selectedCentre = centres.find((c) => c.id === selectedCentreId) || centres[0]
  const filteredInventory = inventory.filter((i) => i.centre_id === selectedCentre?.id)

  const upcomingAppointments = liveAppts.filter((a) => a.status === "scheduled" || a.status === "fast_pass")
  const pastAppointments = liveAppts.filter((a) => a.status === "completed" || a.status === "cancelled")
  const criticalCentres = inventory
    .filter((i) => i.blood_type === profile.blood_type && (i.status === "critical" || i.status === "low"))
    .map((i) => centres.find((c) => c.id === i.centre_id)?.name || "Unknown")
    .filter((n, idx, arr) => arr.indexOf(n) === idx)

  function isAppointmentFastPass(apt: Appointment) {
    if (apt.status !== "scheduled" && apt.status !== "fast_pass") return false
    const inv = inventory.find((i) => i.centre_id === apt.centre_id && i.blood_type === profile.blood_type)
    if (!inv || (inv.status !== "critical" && inv.status !== "low")) return false
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const apptDate = new Date(apt.appointment_date); apptDate.setHours(0, 0, 0, 0)
    const diffDays = Math.round((apptDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays >= 0 && diffDays <= 3
  }

  function formatDate(date: string | null | undefined) {
    if (!date) return "Today"
    const d = new Date(date)
    if (isNaN(d.getTime())) return "Today"
    return d.toLocaleDateString("en-SG", {
      day: "numeric", month: "short", year: "numeric",
    })
  }

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

  return (
    <UserLayout currentPath="/dashboard" profile={profile}>
      <div className="relative flex items-start justify-between">
        <PageHeader greeting={`${getGreeting()}, ${profile.full_name.split(" ")[0]}`} date={formatToday()} />
        <button type="button" onClick={() => { setShowRefreshed(true); router.refresh(); setTimeout(() => setShowRefreshed(false), 3000) }}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors"
          title="Refresh dashboard">
          <RefreshCw className="h-4 w-4" />
        </button>
        {showRefreshed && (
          <div className="absolute top-0 right-0 mt-1 mr-1 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white shadow-lg animate-in fade-in">
            Dashboard refreshed
          </div>
        )}
      </div>

      {criticalCentres.length > 0 && <AlertBanner bloodType={profile.blood_type} centres={criticalCentres} className="mb-6" />}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Total Donations" value={String(profile.donations_count)} subtext="Lifetime" icon={<Droplets className="h-5 w-5" />} />
        <StatsCard label="Blood Type" value={profile.blood_type} subtext={criticalCentres.length > 0 ? "In demand" : "Stable supply"} icon={<Heart className="h-5 w-5" />} />
        <StatsCard label="Reward Points" value={String(profile.points)} subtext={`${getDisplayTier(profile)} Tier`} icon={<Award className="h-5 w-5" />} />
        <StatsCard label="Next Eligible" value={formatDate(profile.next_eligible)} subtext="Donation date" icon={<Calendar className="h-5 w-5" />} />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-black dark:text-gray-100">Blood Supply</h3>
            <select
              value={selectedCentreId}
              onChange={(e) => setSelectedCentreId(e.target.value)}
              className="w-full sm:w-auto rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-black focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              {centres.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <BloodInventory inventory={filteredInventory} centreName={selectedCentre?.name} userBloodType={profile.blood_type} />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-black dark:text-gray-100">Upcoming Appointments</h3>
          {upcomingAppointments.length > 0 ? (
            <div className="space-y-3">
              {upcomingAppointments.map((apt) => (
                <AppointmentCard key={apt.id} appointment={apt} onEditTime={handleEditTime} isFastPass={isAppointmentFastPass(apt)} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-900 dark:text-gray-300">No upcoming appointments.</p>
          )}

          {pastAppointments.length > 0 && (
            <>
              <h3 className="text-lg font-semibold text-black dark:text-gray-100 pt-2">Past Appointments</h3>
              <div className="space-y-3">
                {pastAppointments.slice(0, 2).map((apt) => (
                <AppointmentCard key={apt.id} appointment={apt} />
                ))}
                <button
                  type="button"
                  onClick={() => router.push("/appointments")}
                  className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                  See more
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <EmergencyContacts contacts={contacts} donorId={profile.id} />
        <TravelHistory records={travel} donorId={profile.id} />
      </div>
    </UserLayout>
  )
}
