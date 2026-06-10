import { cn } from "@/utils/cn"
import { Card, CardContent } from "@/components/ui/card"

interface StatsCardProps {
  label: string
  value: string
  subtext?: string
  icon: React.ReactNode
  className?: string
}

export function StatsCard({ label, value, subtext, icon, className }: StatsCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardContent className="flex items-start gap-4 p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm text-gray-900 dark:text-gray-300">{label}</p>
          <p className="text-xl font-bold text-black dark:text-gray-100">{value}</p>
          {subtext && <p className="text-xs text-gray-400 mt-0.5 dark:text-gray-500">{subtext}</p>}
        </div>
      </CardContent>
    </Card>
  )
}
