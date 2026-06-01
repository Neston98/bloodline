"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Droplet, Shield, Mail, Lock, Eye, EyeOff, AlertTriangle } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  async function handleSingpassLogin() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <div className="flex flex-col justify-center bg-charcoal px-8 py-12 md:w-1/2 md:px-16 lg:px-24">
        <div className="mx-auto max-w-sm">
          <Link href="/" className="mb-10 flex items-center gap-3">
            <Droplet className="h-8 w-8 text-blood" />
            <span className="text-2xl font-bold text-white">BloodLine</span>
          </Link>
          <h1 className="text-3xl font-bold leading-tight text-white">
            Welcome back,
            <br />
            <span className="text-blood">donor.</span>
          </h1>
          <p className="mt-3 leading-relaxed text-white/80">
            Log in to check your eligibility, book a donation slot, and track
            your impact on Singapore&apos;s blood supply.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-3">
            {["O-", "A+", "B+"].map((t) => (
              <div
                key={t}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-center text-sm font-semibold text-white/85"
              >
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-col justify-center bg-white px-8 py-12 md:w-1/2 md:px-16 lg:px-24">
        <div className="mx-auto w-full max-w-sm">
          <h2 className="text-2xl font-bold text-charcoal">Sign in</h2>
          <p className="mt-1 text-sm text-charcoal/80">
            New here?{" "}
            <Link
              href="/auth/register"
              className="font-medium text-blood hover:underline"
            >
              Create an account
            </Link>
          </p>
          <button
            onClick={handleSingpassLogin}
            disabled={loading}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-lg border-2 border-charcoal bg-charcoal px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-charcoal-100 disabled:opacity-50"
          >
            <Shield className="h-5 w-5" />
            Login with Singpass
          </button>
          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-warm-200" />
            <span className="text-xs font-medium uppercase tracking-wider text-charcoal/40">
              or with email
            </span>
            <div className="h-px flex-1 bg-warm-200" />
          </div>
          <form onSubmit={handleEmailLogin} className="mt-6 space-y-4">
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
                  placeholder="donor@example.com"
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
                  placeholder="Enter your password"
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
              className="flex w-full items-center justify-center rounded-lg bg-blood px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blood-dark disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
