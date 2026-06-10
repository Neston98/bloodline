"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { CheckCircle2, Copy, X, AlertCircle } from "lucide-react"
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
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200 text-xs font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-400">
        {initials}
      </div>
    )
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-gray-200 dark:bg-gray-700 dark:ring-gray-600">
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
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-5 py-3 shadow-lg dark:border-green-800 dark:bg-green-900/30">
      <CheckCircle2 className="h-5 w-5 text-green-600" />
      <span className="text-sm font-medium text-green-800 dark:text-green-300">{text}</span>
      <button onClick={onClose} className="ml-2 text-green-400 hover:text-green-600 dark:text-green-500 dark:hover:text-green-300">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

function ErrorToast({ text, onClose }: { text: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-3 shadow-lg dark:border-red-800 dark:bg-red-900/30">
      <AlertCircle className="h-5 w-5 text-red-600" />
      <span className="text-sm font-medium text-red-800 dark:text-red-300">{text}</span>
      <button onClick={onClose} className="ml-2 text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-300">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export function VoucherList({ vouchers, userPoints }: VoucherListProps) {
  const [isAuth, setIsAuth] = useState(false)
  const [loading, setLoading] = useState(true)
  const [redeemingId, setRedeemingId] = useState<string | null>(null)
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [sessionDeductions, setSessionDeductions] = useState(0)
  const [localSpent, setLocalSpent] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [errorToast, setErrorToast] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        setIsAuth(true)
        const { data } = await supabase
          .from("reward_redemptions")
          .select("*")
          .eq("donor_id", user.id)
          .order("redeemed_at", { ascending: false })

        if (data) {
          const mapped: Redemption[] = data.map((r) => ({
            id: r.id,
            voucherName: r.voucher_name,
            code: r.id.slice(0, 13),
            pointsCost: r.points_spent,
            redeemedAt: new Date(r.redeemed_at).toLocaleString("en-SG", {
              day: "numeric", month: "short", year: "numeric",
              hour: "2-digit", minute: "2-digit",
            }),
          }))
          setRedemptions(mapped)
        }
      } else {
        const savedRedeem = localStorage.getItem("voucher-redemptions")
        if (savedRedeem) {
          const parsed: Redemption[] = JSON.parse(savedRedeem)
          setRedemptions(parsed)
          const totalSpent = parsed.reduce((sum, r) => sum + r.pointsCost, 0)
          setLocalSpent(totalSpent)
        }
      }

      localStorage.removeItem("voucher-mock-points")
      setLoading(false)
    }
    init()
  }, [])

  const effectivePoints = isAuth
    ? userPoints - sessionDeductions
    : userPoints - localSpent

  async function handleRedeem(voucher: Voucher) {
    setRedeemingId(voucher.id)

    const prefix = voucher.name.includes("NTUC") ? "FP" :
      voucher.name.includes("CDC") ? "CDC" :
      voucher.name.includes("HSA") ? "HSA" :
      voucher.name.includes("GrabPay") ? "GP" : "GF"

    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (user && !userError) {
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donorId: user.id,
          voucherId: voucher.id,
          voucherName: voucher.name,
          pointsCost: voucher.points_cost,
        }),
      })

      if (!res.ok) {
        const { error } = await res.json()
        setErrorToast(`Redemption failed: ${error}`)
        setRedeemingId(null)
        return
      }

      setSessionDeductions((p) => p + voucher.points_cost)

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
    } else {
      const savedRedeem = localStorage.getItem("voucher-redemptions")
      const existing = savedRedeem ? JSON.parse(savedRedeem) : []
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
      const updated = [redemption, ...existing]
      localStorage.setItem("voucher-redemptions", JSON.stringify(updated))
      setLocalSpent((p) => p + voucher.points_cost)
      setRedemptions(updated)
      setToast(`Redeemed ${voucher.name} — Code: ${code}`)
      setRedeemingId(null)
    }
  }

  function copyCode(code: string, id: string) {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-6">
      {toast && <Toast text={toast} onClose={() => setToast(null)} />}
      {errorToast && <ErrorToast text={errorToast} onClose={() => setErrorToast(null)} />}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Redeem Vouchers</CardTitle>
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5 dark:bg-amber-900/30">
              <span className="text-xs text-amber-700 dark:text-amber-400">Balance:</span>
              <span className="text-sm font-bold text-amber-800 dark:text-amber-300">{effectivePoints} pts</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {vouchers.map((voucher) => (
              <div key={voucher.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 dark:border-transparent">
                <div className="flex items-center gap-3">
                  <LogoImage name={voucher.name} />
                  <div>
                    <p className="text-sm font-medium text-black dark:text-gray-100">{voucher.name}</p>
                    <p className="text-xs text-gray-900 dark:text-gray-300">{voucher.description}</p>
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
                <div key={r.id} className="flex items-center justify-between rounded-lg border border-green-100 bg-green-50/50 p-3 dark:border-green-800 dark:bg-green-900/20">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <LogoImage name={r.voucherName} />
                    <div>
                      <p className="text-sm font-medium text-black dark:text-gray-100">{r.voucherName}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <code className="rounded bg-white px-2 py-0.5 text-xs font-mono text-green-700 ring-1 ring-green-200 dark:bg-gray-800 dark:text-green-300 dark:ring-green-700">
                          {r.code}
                        </code>
                        <button
                          onClick={() => copyCode(r.code, r.id)}
                          className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                          title="Copy code"
                        >
                          {copiedId === r.id ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{r.redeemedAt}</p>
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
