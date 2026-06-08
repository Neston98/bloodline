"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Droplets, Shield, Mail, Lock, Eye, EyeOff, User, AlertTriangle } from "lucide-react"
import type { BloodType } from "@/types"

const bloodTypes: BloodType[] = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"]

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    nric: "",
    bloodType: "" as BloodType | "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (!form.bloodType) {
      setError("Please select your blood type")
      return
    }

    setLoading(true)

    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.fullName,
          nric: form.nric,
          blood_type: form.bloodType,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    router.push("/auth/login?registered=true")
  }

  async function handleSingpassRegister() {
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
            <Droplets className="h-8 w-8 text-blood" />
            <span className="text-2xl font-bold text-white">BloodLine</span>
          </Link>
          <h1 className="text-3xl font-bold leading-tight text-white">
            Join the cause,
            <br />
            <span className="text-blood">save lives.</span>
          </h1>
          <p className="mt-3 leading-relaxed text-white/80">
            Register as a blood donor and get access to real-time inventory,
            fast-track booking, and donation rewards.
          </p>
          <div className="mt-10 space-y-3">
            <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
              <Shield className="h-5 w-5 text-blood" />
              <span className="text-sm text-white/70">
                Secured by Singpass
              </span>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
              <Droplets className="h-5 w-5 text-blood" />
              <span className="text-sm text-white/70">
                Free donor perks &amp; rewards
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col justify-center bg-white px-8 py-12 md:w-1/2 md:px-16 lg:px-24">
        <div className="mx-auto w-full max-w-sm">
          <h2 className="text-2xl font-bold text-charcoal">
            Create your account
          </h2>
          <p className="mt-1 text-sm text-charcoal/80">
            Already registered?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-blood hover:underline"
            >
              Sign in
            </Link>
          </p>
          <button
            onClick={handleSingpassRegister}
            disabled={loading}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-lg border-2 border-charcoal bg-charcoal px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-charcoal-100 disabled:opacity-50"
          >
            <Shield className="h-5 w-5" />
            Register with Singpass
          </button>
          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-warm-200" />
            <span className="text-xs font-medium uppercase tracking-wider text-charcoal/40">
              or register with email
            </span>
            <div className="h-px flex-1 bg-warm-200" />
          </div>
          <form onSubmit={handleRegister} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-charcoal"
              >
                Full name
              </label>
              <div className="relative mt-1">
                <User className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-charcoal/40" />
                <input
                  id="fullName"
                  type="text"
                  required
                  value={form.fullName}
                  onChange={(e) => updateField("fullName", e.target.value)}
                  className="w-full rounded-lg border border-warm-200 bg-white py-2.5 pr-4 pl-10 text-sm text-charcoal placeholder:text-charcoal/40 focus:border-blood focus:outline-none focus:ring-1 focus:ring-blood"
                  placeholder="Donor Name"
                />
              </div>
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
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="w-full rounded-lg border border-warm-200 bg-white py-2.5 pr-4 pl-10 text-sm text-charcoal placeholder:text-charcoal/40 focus:border-blood focus:outline-none focus:ring-1 focus:ring-blood"
                  placeholder="donor@example.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="nric"
                  className="block text-sm font-medium text-charcoal"
                >
                  NRIC
                </label>
                <input
                  id="nric"
                  type="text"
                  required
                  value={form.nric}
                  onChange={(e) => updateField("nric", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-warm-200 bg-white py-2.5 px-3 text-sm text-charcoal placeholder:text-charcoal/40 focus:border-blood focus:outline-none focus:ring-1 focus:ring-blood"
                  placeholder="S****123A"
                />
              </div>
              <div>
                <label
                  htmlFor="bloodType"
                  className="block text-sm font-medium text-charcoal"
                >
                  Blood type
                </label>
                <select
                  id="bloodType"
                  required
                  value={form.bloodType}
                  onChange={(e) => updateField("bloodType", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-warm-200 bg-white py-2.5 px-3 text-sm text-charcoal focus:border-blood focus:outline-none focus:ring-1 focus:ring-blood"
                >
                  <option value="">Select</option>
                  {bloodTypes.map((bt) => (
                    <option key={bt} value={bt}>
                      {bt}
                    </option>
                  ))}
                </select>
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
                  minLength={6}
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  className="w-full rounded-lg border border-warm-200 bg-white py-2.5 pr-10 pl-10 text-sm text-charcoal placeholder:text-charcoal/40 focus:border-blood focus:outline-none focus:ring-1 focus:ring-blood"
                  placeholder="Min. 6 characters"
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
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-charcoal"
              >
                Confirm password
              </label>
              <div className="relative mt-1">
                <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-charcoal/40" />
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  minLength={6}
                  value={form.confirmPassword}
                  onChange={(e) =>
                    updateField("confirmPassword", e.target.value)
                  }
                  className="w-full rounded-lg border border-warm-200 bg-white py-2.5 pr-4 pl-10 text-sm text-charcoal placeholder:text-charcoal/40 focus:border-blood focus:outline-none focus:ring-1 focus:ring-blood"
                  placeholder="Repeat your password"
                />
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
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
