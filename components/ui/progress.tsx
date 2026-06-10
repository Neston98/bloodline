import { cn } from "@/utils/cn"

interface ProgressProps {
  value: number
  className?: string
  indicatorClassName?: string
}

export function Progress({ value, className, indicatorClassName }: ProgressProps) {
  return (
    <div className={cn("h-2 w-full rounded-full bg-gray-100 dark:bg-gray-700", className)}>
      <div
        className={cn("h-full rounded-full bg-red-500 transition-all", indicatorClassName)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}
