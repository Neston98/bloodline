"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import UserLayout from "@/components/layout/user-layout"
import { CheckCircle2, ArrowLeft, ArrowRight, Zap } from "lucide-react"
import type { Profile, BloodCentre } from "@/types"

const TIME_SLOTS = [
  { label: "09:00–10:00", available: true },
  { label: "10:00–11:00", available: true },
  { label: "11:00–12:00", available: true },
  { label: "13:00–14:00", available: false },
  { label: "14:00–15:00", available: true },
  { label: "15:00–16:00", available: true },
  { label: "16:00–17:00", available: true },
]

export function NewAppointmentView({ profile, centres }: { profile: Profile; centres: BloodCentre[] }) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [selectedCentre, setSelectedCentre] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [booked, setBooked] = useState(false)

  const centre = centres.find((c) => c.id === selectedCentre)
  const canGoNext2 = selectedCentre && selectedDate

  const handleConfirm = async () => {
    if (!selectedCentre || !selectedDate || !selectedTime) return
    const supabase = createClient()
    const [start, end] = selectedTime.split("–")
    const { error } = await supabase.from("appointments").insert({
      donor_id: profile.id,
      centre_id: selectedCentre,
      appointment_date: selectedDate,
      time_start: start,
      time_end: end,
      blood_type: profile.blood_type,
      status: "scheduled",
    })
    if (error) console.error("[BloodLine] book appointment insert:", error.message)
    setBooked(true)
    setTimeout(() => router.push("/appointments"), 2000)
  }

  return (
    <UserLayout currentPath="/appointments" profile={profile}>
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-black">Schedule New Appointment</h1>
        <p className="mt-1 text-sm text-gray-900">Book your next blood donation slot</p>
      </div>

      <div className="mb-8 flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                step >= s ? "bg-red-600 text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {s}
            </div>
            <span className={`text-sm ${step >= s ? "text-black font-medium" : "text-gray-600"}`}>
              {s === 1 ? "Centre" : s === 2 ? "Date & Time" : "Confirm"}
            </span>
            {s < 3 && <div className="mx-2 h-px w-8 bg-gray-200" />}
          </div>
        ))}
      </div>

      {booked ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <h2 className="text-xl font-bold text-black">Appointment Confirmed!</h2>
            <p className="text-sm text-gray-900">
              {centre?.name} on {selectedDate} at {selectedTime}
            </p>
            <p className="text-xs text-gray-600">Redirecting to appointments...</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 ? "Select Blood Centre" : step === 2 ? "Select Date & Time" : "Confirm Booking"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {step === 1 && (
              <div className="space-y-3">
                {centres.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCentre(c.id)}
                    className={`w-full rounded-lg border p-4 text-left transition-colors ${
                      selectedCentre === c.id
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <p className="font-medium text-black">{c.name}</p>
                    <p className="mt-1 text-sm text-gray-900">{c.address}</p>
                    <p className="text-xs text-gray-600">{c.opening_hours}</p>
                  </button>
                ))}
                <div className="flex justify-end pt-4">
                  <Button onClick={() => setStep(2)} disabled={!selectedCentre}>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-900">Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">Available Time Slots</label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {TIME_SLOTS.map((slot) => (
                      <button
                        key={slot.label}
                        onClick={() => slot.available && setSelectedTime(slot.label)}
                        disabled={!slot.available}
                        className={`rounded-lg border p-3 text-sm transition-colors ${
                          !slot.available
                            ? "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-500"
                            : selectedTime === slot.label
                              ? "border-red-500 bg-red-50 text-red-700"
                              : "border-gray-200 text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        {slot.label}
                        {!slot.available && (
                          <span className="mt-1 block text-xs text-gray-500">Full</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                {selectedCentre && (
                  <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                    <Zap className="h-4 w-4" />
                    Fast-Pass eligible — skip the queue at this centre!
                  </div>
                )}
                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={() => setStep(3)} disabled={!canGoNext2}>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && centre && (
              <div className="space-y-6">
                <div className="rounded-lg border bg-gray-50 p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-900">Blood Centre</span>
                    <span className="text-sm font-medium text-black">{centre.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-900">Address</span>
                    <span className="text-sm font-medium text-black">{centre.address}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-900">Date</span>
                    <span className="text-sm font-medium text-black">{selectedDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-900">Time</span>
                    <span className="text-sm font-medium text-black">{selectedTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-900">Blood Type</span>
                    <Badge>{profile.blood_type}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-800">
                  <Zap className="h-4 w-4" />
                  Fast-Pass status: You are eligible for priority queue at this centre.
                </div>
                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={handleConfirm}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Confirm Booking
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </UserLayout>
  )
}
