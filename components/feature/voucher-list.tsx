"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { CheckCircle2, Copy, X } from "lucide-react"
import type { Voucher } from "@/types"

interface VoucherListProps {
  vouchers: Voucher[]
  userPoints: number
  lifetimePoints: number
}

interface Redemption {
  id: string
  voucherName: string
  code: string
  pointsCost: number
  redeemedAt: string
}

function generateCode(prefix: string) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += "-"
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return `${prefix}-${code}`
}

function getLogoUrl(name: string) {
  if (name.includes("NTUC")) return "https://www.google.com/s2/favicons?domain=fairprice.com.sg&sz=64"
  if (name.includes("GrabPay")) return "https://assets.zonalogo.com/transportation/food.grab.com/logo-1772935679731-39.svg"
  if (name.includes("Grab")) return "https://assets.zonalogo.com/transportation/food.grab.com/logo-1772935679731-39.svg"
  if (name.includes("CDC")) return "https://www.google.com/s2/favicons?domain=cdc.gov.sg&sz=64"
  if (name.includes("HSA")) return "https://isomer-user-content.by.gov.sg/409/04b32cb4-10de-4e75-b71a-dda525b234c1/HSAlogo_resized.png"
  if (name.includes("Health")) return "https://isomer-user-content.by.gov.sg/409/04b32cb4-10de-4e75-b71a-dda525b234c1/HSAlogo_resized.png"
  return "https://www.google.com/s2/favicons?domain=fairprice.com.sg&sz=64"
}

function LogoImage({ name }: { name: string }) {
  const [errored, setErrored] = useState(false)
  const url = getLogoUrl(name)

  if (errored) {
    const initials = name.includes("NTUC") ? "NT" :
      name.includes("Grab") ? "GF" :
      name.includes("CDC") ? "CD" :
      name.includes("HSA") || name.includes("Health") ? "HS" : "NT"
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200 text-xs font-bold text-gray-600">
        {initials}
      </div>
    )
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-gray-200">
      <img src={url} alt="" className="h-7 w-7 object-contain" onError={() => setErrored(true)} />
    </div>
  )
}

function Toast({ text, onClose }: { text: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-5 py-3 shadow-lg">
      <CheckCircle2 className="h-5 w-5 text-green-600" />
      <span className="text-sm font-medium text-green-800">{text}</span>
      <button onClick={onClose} className="ml-2 text-green-400 hover:text-green-600">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export function VoucherList({ vouchers, userPoints }: VoucherListProps) {
  const [mounted, setMounted] = useState(false)
  const [redeemingId, setRedeemingId] = useState<string | null>(null)
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [mockPoints, setMockPoints] = useState<number>(userPoints)
  const [toast, setToast] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    const savedRedeem = localStorage.getItem("voucher-redemptions")
    if (savedRedeem) setRedemptions(JSON.parse(savedRedeem))
    const savedPoints = localStorage.getItem("voucher-mock-points")
    if (savedPoints) setMockPoints(parseInt(savedPoints, 10))
    setMounted(true)
  }, [])

  const hasMountedRef = useRef(false)

  useEffect(() => {
    if (hasMountedRef.current) {
      localStorage.setItem("voucher-redemptions", JSON.stringify(redemptions))
    }
  }, [redemptions])

  useEffect(() => {
    if (hasMountedRef.current) {
      localStorage.setItem("voucher-mock-points", String(mockPoints))
    } else {
      hasMountedRef.current = true
    }
  }, [mockPoints])

  const effectivePoints = mounted ? mockPoints : userPoints

  async function handleRedeem(voucher: Voucher) {
    setRedeemingId(voucher.id)

    const prefix = voucher.name.includes("NTUC") ? "FP" :
      voucher.name.includes("CDC") ? "CDC" :
      voucher.name.includes("HSA") ? "HSA" :
      voucher.name.includes("GrabPay") ? "GP" : "GF"

    let succeeded = false

    try {
      const supabase = createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (!userError && user) {
        const { error: redemptionError } = await supabase
          .from("reward_redemptions")
          .insert({
            donor_id: user.id,
            voucher_id: voucher.id,
            voucher_name: voucher.name,
            points_spent: voucher.points_cost,
          })

        if (redemptionError) throw redemptionError

        const { error: pointsError } = await supabase.rpc("deduct_points", {
          p_donor_id: user.id,
          p_points: voucher.points_cost,
        })

        if (pointsError) {
          const isRpcMissing = pointsError.message?.includes("function") || pointsError.message?.includes("not found")
          if (isRpcMissing) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("points")
              .eq("id", user.id)
              .single()

            if (profile) {
              const { error: updateError } = await supabase
                .from("profiles")
                .update({ points: Math.max(profile.points - voucher.points_cost, 0) })
                .eq("id", user.id)

              if (updateError) throw updateError
            }
          } else {
            throw pointsError
          }
        }

        succeeded = true
      }
    } catch {
      // Supabase unavailable — use mock fallback
    }

    setMockPoints((p) => p - voucher.points_cost)

    const code = generateCode(prefix)
    const redemption: Redemption = {
      id: `${voucher.id}-${Date.now()}`,
      voucherName: voucher.name,
      code,
      pointsCost: voucher.points_cost,
      redeemedAt: new Date().toLocaleString("en-SG", {
        day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      }),
    }

    setRedemptions((prev) => [redemption, ...prev])
    setToast(`Redeemed ${voucher.name} — Code: ${code}`)
    setRedeemingId(null)
  }

  function copyCode(code: string, id: string) {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-6">
      {toast && <Toast text={toast} onClose={() => setToast(null)} />}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Redeem Vouchers</CardTitle>
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5">
              <span className="text-xs text-amber-700">Balance:</span>
              <span className="text-sm font-bold text-amber-800">{effectivePoints} pts</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {vouchers.map((voucher) => (
              <div key={voucher.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <LogoImage name={voucher.name} />
                  <div>
                    <p className="text-sm font-medium text-black">{voucher.name}</p>
                    <p className="text-xs text-gray-900">{voucher.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{voucher.points_cost} pts</Badge>
                  <Button
                    size="sm"
                    disabled={
                      effectivePoints < voucher.points_cost ||
                      !voucher.available ||
                      redeemingId === voucher.id
                    }
                    onClick={() => handleRedeem(voucher)}
                  >
                    {redeemingId === voucher.id ? "..." : "Redeem"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {redemptions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>My Redemptions</CardTitle>
              <Badge variant="default">{redemptions.length} voucher{redemptions.length !== 1 ? "s" : ""}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {redemptions.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border border-green-100 bg-green-50/50 p-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <LogoImage name={r.voucherName} />
                    <div>
                      <p className="text-sm font-medium text-black">{r.voucherName}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <code className="rounded bg-white px-2 py-0.5 text-xs font-mono text-green-700 ring-1 ring-green-200">
                          {r.code}
                        </code>
                        <button
                          onClick={() => copyCode(r.code, r.id)}
                          className="text-gray-400 hover:text-gray-600"
                          title="Copy code"
                        >
                          {copiedId === r.id ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500">{r.redeemedAt}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="ml-3 shrink-0">-{r.pointsCost} pts</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}