import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Voucher } from "@/types"

interface VoucherListProps {
  vouchers: Voucher[]
  userPoints: number
}

export function VoucherList({ vouchers, userPoints }: VoucherListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Redeem Vouchers</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {vouchers.map((voucher) => (
            <div key={voucher.id} className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50 text-lg">
                  {voucher.logo}
                </div>
                <div>
                  <p className="text-sm font-medium text-black">{voucher.name}</p>
                  <p className="text-xs text-gray-900">{voucher.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{voucher.points_cost} pts</Badge>
                <Button size="sm" disabled={userPoints < voucher.points_cost || !voucher.available}>
                  Redeem
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
