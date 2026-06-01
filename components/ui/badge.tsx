import { cn } from "@/utils/cn"

interface BadgeProps {
  children: React.ReactNode
  variant?: "default" | "success" | "warning" | "danger" | "outline"
  className?: string
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variant === "default" && "bg-gray-100 text-gray-900",
        variant === "success" && "bg-green-100 text-green-700",
        variant === "warning" && "bg-amber-100 text-amber-700",
        variant === "danger" && "bg-red-100 text-red-700",
        variant === "outline" && "border border-gray-300 text-gray-600",
        className,
      )}
    >
      {children}
    </span>
  )
}
