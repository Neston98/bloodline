import { CheckCircle2, Circle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DonorMilestone } from "@/types"

interface MilestoneListProps {
  donorMilestones: DonorMilestone[]
}

export function MilestoneList({ donorMilestones }: MilestoneListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Donation Milestones</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {donorMilestones.map((dm) => (
            <div
              key={dm.id}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              {dm.earned ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
              ) : (
                <Circle className="h-5 w-5 shrink-0 text-gray-500" />
              )}
              <div className="flex items-center gap-2">
                <span className="text-lg">{dm.milestone?.icon}</span>
                <div>
                  <p className="text-sm font-medium text-black">{dm.milestone?.name}</p>
                  <p className="text-xs text-gray-900">{dm.milestone?.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
