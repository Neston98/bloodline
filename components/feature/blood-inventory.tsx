import { cn } from "@/utils/cn"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { BloodInventory } from "@/types"

interface BloodInventoryProps {
  inventory: BloodInventory[]
  centreName?: string
}

function barColor(status: BloodInventory["status"]) {
  if (status === "critical") return "bg-red-600"
  if (status === "low") return "bg-amber-600"
  if (status === "moderate") return "bg-yellow-500"
  return "bg-green-600"
}

export function BloodInventory({ inventory, centreName }: BloodInventoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Blood Supply {centreName ? `– ${centreName}` : ""}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {inventory.map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-10 shrink-0 text-sm font-bold text-black">{item.blood_type}</span>
                <div className="h-2 w-52 rounded-full bg-gray-100">
                  <div
                    className={cn("h-full rounded-full transition-all", barColor(item.status))}
                    style={{ width: `${Math.max(2, item.capacity_pct ?? 0)}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{item.units} units</span>
                <Badge
                  variant={
                    item.status === "critical"
                      ? "danger"
                      : item.status === "low" || item.status === "moderate"
                        ? "warning"
                        : "success"
                  }
                >
                  {item.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
