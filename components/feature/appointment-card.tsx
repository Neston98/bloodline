"use client"

import { useState } from "react"
import { Calendar, Clock, MapPin, Zap, XCircle, Pencil, Check, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDate, formatTime, statusPillColor } from "@/utils/formatters"
import { cn } from "@/utils/cn"
import type { Appointment } from "@/types"

const TIME_SLOTS = [
  "09:00–09:20", "09:20–09:40", "09:40–10:00",
  "10:00–10:20", "10:20–10:40", "10:40–11:00",
  "11:00–11:20", "11:20–11:40", "11:40–12:00",
  "13:00–13:20", "13:20–13:40", "13:40–14:00",
  "14:00–14:20", "14:20–14:40", "14:40–15:00",
  "15:00–15:20", "15:20–15:40", "15:40–16:00",
  "16:00–16:20", "16:20–16:40", "16:40–17:00",
]

interface AppointmentCardProps {
  appointment: Appointment
  onCancel?: (id: string) => void
  onEditTime?: (id: string, timeStart: string, timeEnd: string) => void
  isFastPass?: boolean
}

export function AppointmentCard({ appointment, onCancel, onEditTime, isFastPass }: AppointmentCardProps) {
  const [editing, setEditing] = useState(false)
  const [editTime, setEditTime] = useState("")
  const isUpcoming = appointment.status === "scheduled" || appointment.status === "fast_pass"
  const canEditTime = isUpcoming && new Date(appointment.appointment_date) > new Date(new Date().toDateString())

  function handleSaveTime() {
    if (!editTime) return
    const [start, end] = editTime.split("–")
    onEditTime?.(appointment.id, start, end)
    setEditing(false)
  }

  return (
    <Card className={cn(isFastPass && "ring-1 ring-amber-400 bg-amber-50/30 dark:bg-amber-900/20")}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            {isFastPass && (
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                  <Zap className="h-3 w-3" />
                  Fast-Pass
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-black dark:text-gray-100">
                {formatDate(appointment.appointment_date)}
              </span>
            </div>
            {editing ? (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <select
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm text-black focus:border-red-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="">Select time</option>
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
                <Button size="sm" variant="ghost" onClick={handleSaveTime} disabled={!editTime} className="h-7 px-1.5">
                  <Check className="h-3.5 w-3.5 text-green-600" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="h-7 px-1.5">
                  <X className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-300">
                <Clock className="h-4 w-4" />
                <span>
                  {formatTime(appointment.time_start)} – {formatTime(appointment.time_end)}
                </span>
                {canEditTime && onEditTime && (
                  <button onClick={() => { setEditTime(`${appointment.time_start}–${appointment.time_end}`); setEditing(true) }}
                    className="ml-1 text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300 transition-colors">
                    <Pencil className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-300">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate">{appointment.centre_name}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={statusPillColor(appointment.status)}>
              {appointment.status}
            </Badge>
            {isUpcoming && onCancel && !editing && (
              <Button size="sm" variant="ghost" onClick={() => { if (window.confirm("Cancel this appointment?")) onCancel(appointment.id) }}
                className="h-7 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/30">
                <XCircle className="mr-1 h-3 w-3" />
                Cancel
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
