import { Calendar, Clock, MapPin, Zap, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDate, formatTime, statusPillColor } from "@/utils/formatters"
import { cn } from "@/utils/cn"
import type { Appointment } from "@/types"

interface AppointmentCardProps {
  appointment: Appointment
  onCancel?: (id: string) => void
  isFastPass?: boolean
}

export function AppointmentCard({ appointment, onCancel, isFastPass }: AppointmentCardProps) {
  const isUpcoming = appointment.status === "scheduled" || appointment.status === "fast_pass"
  return (
    <Card className={cn(isFastPass && "ring-1 ring-amber-400 bg-amber-50/30")}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            {isFastPass && (
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  <Zap className="h-3 w-3" />
                  Fast-Pass
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-black">
                {formatDate(appointment.appointment_date)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-900">
              <Clock className="h-4 w-4" />
              <span>
                {formatTime(appointment.time_start)} – {formatTime(appointment.time_end)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-900">
              <MapPin className="h-4 w-4" />
              <span>{appointment.centre_name}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={statusPillColor(appointment.status)}>
              {appointment.status}
            </Badge>
            {isUpcoming && onCancel && (
              <Button size="sm" variant="ghost" onClick={() => { if (window.confirm("Cancel this appointment?")) onCancel(appointment.id) }}
                className="h-7 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700">
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
