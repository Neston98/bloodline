import { AlertTriangle } from "lucide-react"
import { cn } from "@/utils/cn"

interface AlertBannerProps {
  bloodType: string
  centres: string[]
  className?: string
}

export function AlertBanner({ bloodType, centres, className }: AlertBannerProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800",
        className,
      )}
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
      <p>
        <strong>Urgent:</strong> Your blood type ({bloodType}) is in demand at{" "}
        {centres.length === 1 ? centres[0] : `${centres.length} centres`}.
        {centres.length > 1 && (
          <span className="block mt-1 text-xs text-red-600">
            {centres.join(", ")}
          </span>
        )}
        {" "}Please consider scheduling a donation.
      </p>
    </div>
  )
}
