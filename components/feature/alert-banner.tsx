import { AlertTriangle, Calendar } from "lucide-react"
import Link from "next/link"
import { cn } from "@/utils/cn"

interface AlertBannerProps {
  bloodType: string
  centres: string[]
  className?: string
  showScheduleButton?: boolean
}

export function AlertBanner({ bloodType, centres, className, showScheduleButton = true }: AlertBannerProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300",
        className,
      )}
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500 dark:text-red-400" />
      <div className="flex-1">
        <p>
          <strong>Urgent:</strong> Your blood type ({bloodType}) is in demand at{" "}
          {centres.length === 1 ? centres[0] : `${centres.length} centres`}.
          {centres.length > 1 && (
            <span className="block mt-1 text-xs text-red-600 dark:text-red-400">
              {centres.join(", ")}
            </span>
          )}
        </p>
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
          Fast pass will be issued if you donate within the next 3 days.
        </p>
        {showScheduleButton && (
          <div className="mt-3">
            <Link
              href="/appointments"
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3 text-xs font-medium text-white transition-colors hover:bg-red-700"
            >
              <Calendar className="h-4 w-4" />
              Schedule Appointment
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
