"use client"

import { useState } from "react"
import { PageHeader } from "@/components/feature/page-header"
import { StatsCard } from "@/components/feature/stats-card"
import { AlertBanner } from "@/components/feature/alert-banner"
import { BloodInventory } from "@/components/feature/blood-inventory"
import { AppointmentCard } from "@/components/feature/appointment-card"
import { EmergencyContacts } from "@/components/feature/emergency-contacts"
import { TravelHistory } from "@/components/feature/travel-history"
import UserLayout from "@/components/layout/user-layout"
import { Droplets, Award, Calendar, Heart } from "lucide-react"
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
  const [selectedCentreId, setSelectedCentreId] = useState(centres[0]?.id || "")
  const selectedCentre = centres.find((c) => c.id === selectedCentreId) || centres[0]
  const filteredInventory = inventory.filter((i) => i.centre_id === selectedCentre?.id)

  const upcomingAppointments = appointments.filter((a) => a.status === "scheduled" || a.status === "fast_pass")
  const pastAppointments = appointments.filter((a) => a.status === "completed" || a.status === "cancelled")
  const isCritical = filteredInventory.some((i) => i.blood_type === profile.blood_type && i.status === "critical")

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-SG", {
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
      <PageHeader greeting={`${getGreeting()}, ${profile.full_name.split(" ")[0]}`} date={formatToday()} />

      {isCritical && <AlertBanner bloodType={profile.blood_type} className="mb-6" />}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Total Donations" value={String(profile.donations_count)} subtext="Lifetime" icon={<Droplets className="h-5 w-5" />} />
        <StatsCard label="Blood Type" value={profile.blood_type} subtext={isCritical ? "Critical demand" : "Stable supply"} icon={<Heart className="h-5 w-5" />} />
        <StatsCard label="Reward Points" value={String(profile.points)} subtext={`${profile.tier} Tier`} icon={<Award className="h-5 w-5" />} />
        <StatsCard label="Next Eligible" value={formatDate(profile.next_eligible)} subtext="Donation date" icon={<Calendar className="h-5 w-5" />} />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-black">Blood Supply</h3>
            <select
              value={selectedCentreId}
              onChange={(e) => setSelectedCentreId(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-black focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            >
              {centres.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <BloodInventory inventory={filteredInventory} centreName={selectedCentre?.name} />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-black">Upcoming Appointments</h3>
          {upcomingAppointments.length > 0 ? (
            <div className="space-y-3">
              {upcomingAppointments.map((apt) => (
                <AppointmentCard key={apt.id} appointment={apt} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-900">No upcoming appointments.</p>
          )}

          {pastAppointments.length > 0 && (
            <>
              <h3 className="text-lg font-semibold text-black pt-2">Past Appointments</h3>
              <div className="space-y-3">
                {pastAppointments.slice(0, 2).map((apt) => (
                  <AppointmentCard key={apt.id} appointment={apt} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <EmergencyContacts contacts={contacts} />
        <TravelHistory records={travel} />
      </div>
    </UserLayout>
  )
}
