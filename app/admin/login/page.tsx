"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/utils/cn"
import { Droplets, Shield, Lock, Mail, Eye, EyeOff, AlertTriangle, ArrowLeft } from "lucide-react"
import type { BloodCentre } from "@/types"

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
}

const statusDot: Record<string, string> = {
  critical: "bg-status-critical",
  low: "bg-status-low",
  moderate: "bg-status-moderate",
  healthy: "bg-status-healthy",
}

export default function AdminLoginPage() {
  const supabase = createClient()
  const [centres, setCentres] = useState<BloodCentre[]>([])
  const [centreId, setCentreId] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from("blood_centres").select("*").order("name").then(({ data }) => {
      if (data) setCentres(data)
    })
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!centreId) {
      setError("Please select a blood centre")
      return
    }

    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError("Invalid login credentials")
      setLoading(false)
      return
    }

    const role = data.user?.user_metadata?.role

    if (role !== "admin") {
      await supabase.auth.signOut()
      setError("This account does not have admin access")
      setLoading(false)
      return
    }

    window.location.href = `/admin/dashboard?centre_id=${encodeURIComponent(centreId)}`
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <div className="flex flex-col justify-center bg-charcoal px-8 py-12 md:w-1/2 md:px-16 lg:px-24">
        <div className="mx-auto max-w-sm">
          <Link href="/" className="mb-10 flex items-center gap-3">
            <Droplets className="h-8 w-8 text-blood" />
            <span className="text-2xl font-bold text-white">BloodLine</span>
          </Link>
          <h1 className="text-3xl font-bold leading-tight text-white">
            Blood Centre
            <br />
            <span className="text-blood">Admin Portal</span>
          </h1>
          <p className="mt-3 leading-relaxed text-white/80">
            Manage inventory, appointments, and donor records for your blood
            centre.
          </p>
          <div className="mt-10 space-y-2">
            {centres.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">
                  {getInitials(c.name)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">
                      {c.name}
                    </span>
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        statusDot[c.status] || "bg-gray-400",
                      )}
                    />
                  </div>
                  <div className="text-xs text-white/40">{c.address}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-col justify-center bg-white px-8 py-12 md:w-1/2 md:px-16 lg:px-24">
        <div className="mx-auto w-full max-w-sm">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-1 text-sm font-medium text-charcoal/50 transition-colors hover:text-charcoal"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to BloodLine
          </Link>
          <h2 className="text-2xl font-bold text-charcoal">Centre sign in</h2>
          <p className="mt-1 text-sm text-charcoal/80">
            Authorised personnel only.
          </p>
          <form onSubmit={handleLogin} className="mt-8 space-y-4">
            <div>
              <label
                htmlFor="centre"
                className="block text-sm font-medium text-charcoal"
              >
                Blood centre
              </label>
              <select
                id="centre"
                required
                value={centreId}
                onChange={(e) => setCentreId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-warm-200 bg-white py-2.5 px-3 text-sm text-charcoal focus:border-blood focus:outline-none focus:ring-1 focus:ring-blood"
              >
                <option value="">Select a blood centre</option>
                {centres.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-charcoal"
              >
                Email
              </label>
              <div className="relative mt-1">
                <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-charcoal/40" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-warm-200 bg-white py-2.5 pr-4 pl-10 text-sm text-charcoal placeholder:text-charcoal/40 focus:border-blood focus:outline-none focus:ring-1 focus:ring-blood"
                  placeholder="admin@bloodline.sg"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-charcoal"
              >
                Password
              </label>
              <div className="relative mt-1">
                <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-charcoal/40" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-warm-200 bg-white py-2.5 pr-10 pl-10 text-sm text-charcoal placeholder:text-charcoal/40 focus:border-blood focus:outline-none focus:ring-1 focus:ring-blood"
                  placeholder="Enter admin password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-charcoal/40 hover:text-charcoal/80"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-blood">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blood px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blood-dark disabled:opacity-50"
            >
              <Shield className="h-4 w-4" />
              {loading ? "Signing in..." : "Sign in to admin portal"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
