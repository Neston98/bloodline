import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DonorMilestone } from "@/types"

interface MilestoneListProps {
  donorMilestones: DonorMilestone[]
}

function badgeBg(earned: boolean) {
  return earned
    ? "bg-gray-50 ring-1 ring-gray-200"
    : "bg-gray-100 ring-1 ring-gray-200 opacity-50"
}

function badgeIcon(earned: boolean) {
  return earned ? "text-3xl" : "text-3xl grayscale"
}

export function MilestoneList({ donorMilestones }: MilestoneListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Donation Milestones</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {donorMilestones.map((dm) => (
            <div
              key={dm.id}
              className={`flex flex-col items-center gap-2 rounded-xl p-4 text-center transition-all ${badgeBg(dm.earned)}`}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/60 ring-1 ring-white/80 shadow-inner">
                <span className={badgeIcon(dm.earned)}>{dm.milestone?.icon}</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-800">{dm.milestone?.name}</p>
                <p className="mt-0.5 text-[10px] leading-tight text-gray-600">{dm.milestone?.condition}</p>
              </div>
              {dm.earned && dm.earned_at && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                  {new Date(dm.earned_at).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}