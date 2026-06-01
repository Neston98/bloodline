import { AlertTriangle } from "lucide-react"
import { cn } from "@/utils/cn"

interface AlertBannerProps {
  bloodType: string
  className?: string
}

export function AlertBanner({ bloodType, className }: AlertBannerProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800",
        className,
      )}
    >
      <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
      <p>
        <strong>Urgent:</strong> Your blood type ({bloodType}) is currently in critical
        demand. Please consider scheduling a donation as soon as possible.
      </p>
    </div>
  )
}
