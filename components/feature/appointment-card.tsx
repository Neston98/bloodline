import { Calendar, Clock, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { formatDate, formatTime, statusPillColor } from "@/utils/formatters"
import type { Appointment } from "@/types"

interface AppointmentCardProps {
  appointment: Appointment
}

export function AppointmentCard({ appointment }: AppointmentCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
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
          <Badge className={statusPillColor(appointment.status)}>
            {appointment.status === "fast_pass" ? "Fast-Pass" : appointment.status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
