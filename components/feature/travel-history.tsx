import { Globe, ShieldCheck, ShieldAlert } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate } from "@/utils/formatters"
import type { TravelRecord } from "@/types"

interface TravelHistoryProps {
  records: TravelRecord[]
}

export function TravelHistory({ records }: TravelHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Travel History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {records.map((record) => (
            <div key={record.id} className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <Globe className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-black">
                    {record.city}, {record.country}
                  </p>
                  <p className="text-xs text-gray-900">
                    Returned {formatDate(record.return_date)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {record.status === "cleared" ? (
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                ) : (
                  <ShieldAlert className="h-4 w-4 text-amber-500" />
                )}
                <Badge
                  variant={record.status === "cleared" ? "success" : "warning"}
                >
                  {record.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
