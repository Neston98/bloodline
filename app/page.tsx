import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { computeCapacityPct, computeStatus, MAX_UNITS } from "@/lib/inventory"
import { Droplets, Shield, ArrowRight, AlertTriangle } from "lucide-react"
import type { BloodType, InventoryStatus, BloodInventory as BI } from "@/types"

interface InventoryItem {
  blood_type: BloodType
  units: number
  capacity_pct: number
  status: InventoryStatus
}

const FALLBACK_INVENTORY: InventoryItem[] = [
  { blood_type: "O-", units: 24, capacity_pct: 8, status: "critical" },
  { blood_type: "O+", units: 142, capacity_pct: 58, status: "healthy" },
  { blood_type: "A-", units: 18, capacity_pct: 12, status: "low" },
  { blood_type: "A+", units: 98, capacity_pct: 45, status: "healthy" },
  { blood_type: "B-", units: 12, capacity_pct: 7, status: "critical" },
  { blood_type: "B+", units: 76, capacity_pct: 38, status: "low" },
  { blood_type: "AB-", units: 6, capacity_pct: 22, status: "low" },
  { blood_type: "AB+", units: 32, capacity_pct: 65, status: "healthy" },
]

const steps = [
  {
    num: 1,
    title: "Login via Singpass",
    desc: "Secure authentication with your national digital identity. Quick, trusted, and verified.",
  },
  {
    num: 2,
    title: "System checks eligibility",
    desc: "Real-time health screening based on your profile, recent donations, and deferral records.",
  },
  {
    num: 3,
    title: "Fast-Pass issued",
    desc: "Skip the queue with a reserved 20-minute donation window at your preferred blood centre.",
  },
  {
    num: 4,
    title: "Arrive in 20-min window",
    desc: "Show up, donate, and save lives — no waiting, no hassle. In and out in under an hour.",
  },
]

async function fetchOrFallback<T>(fetch: () => Promise<T | null | undefined>, fallback: T, label = "query"): Promise<T> {
  try {
    const result = await fetch()
    if (result === null || result === undefined) {
      console.warn(`[BloodLine] ${label}: returned null, using fallback`)
    }
    return result ?? fallback
  } catch (e) {
    console.error(`[BloodLine] ${label}:`, e)
    return fallback
  }
}

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-charcoal">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Droplets className="h-6 w-6 text-blood" />
          <span className="text-lg font-bold tracking-tight text-white">
            BloodLine
          </span>
          <span className="ml-2 hidden rounded border border-white/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-white/85 sm:inline">
            Donor Portal
          </span>
        </Link>
        <div className="hidden items-center gap-8 text-sm font-medium text-white/70 md:flex">
          <a href="#how" className="transition-colors hover:text-white">
            How it works
          </a>
          <a href="#inventory" className="transition-colors hover:text-white">
            Blood supply
          </a>
          <Link
            href="/admin/login"
            className="transition-colors hover:text-white"
          >
            For blood banks
          </Link>
        </div>
        <Link
          href="/auth/login"
          className="flex items-center gap-2 rounded-lg bg-blood px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blood-dark"
        >
          <Shield className="h-4 w-4" />
          Login with Singpass
        </Link>
      </div>
    </nav>
  )
}

function HeroSection({ inventory }: { inventory: InventoryItem[] }) {
  const oMinus = inventory.find((i) => i.blood_type === "O-")
  const oMinusPct = oMinus?.capacity_pct ?? 8
  const totalCentres = "5"

  return (
    <section className="relative bg-charcoal pt-24">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blood/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blood/5 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-24 sm:px-6 lg:px-8">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blood/30 bg-blood/10 px-4 py-2 text-sm text-blood-light">
          <AlertTriangle className="h-4 w-4 text-blood" />
          <span>
            <strong>Live</strong> &mdash; O- blood at <strong>{oMinusPct}%</strong>{" "}
            nationally &mdash; donors urgently needed
          </span>
        </div>
        <h1 className="max-w-3xl text-4xl leading-tight font-bold tracking-tight text-white sm:text-5xl sm:leading-tight lg:text-6xl lg:leading-tight">
          The right blood, at the right place,{" "}
          <span className="text-blood">at the right time.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/85">
          BloodLine connects Singapore&apos;s donors with the national blood
          supply in real time. Check inventory, book a 20-minute donation
          window, and help keep our blood banks stocked &mdash; all through
          your Singpass.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 rounded-lg bg-blood px-6 py-3 text-base font-semibold text-white transition-all hover:bg-blood-dark hover:shadow-lg hover:shadow-blood/25"
          >
            <Shield className="h-5 w-5" />
            Login with Singpass
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#inventory"
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-6 py-3 text-base font-semibold text-white/80 transition-colors hover:border-white/40 hover:text-white"
          >
            Check blood supply
          </a>
        </div>
        <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
          <div className="rounded-xl border border-white/10 bg-white/5 px-5 py-4">
            <div className="text-2xl font-bold text-white">{oMinusPct}%</div>
            <div className="mt-1 text-sm text-white/80">O- capacity</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-5 py-4">
            <div className="text-2xl font-bold text-white">{totalCentres}</div>
            <div className="mt-1 text-sm text-white/80">Active centres</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-5 py-4">
            <div className="text-2xl font-bold text-white">12,400</div>
            <div className="mt-1 text-sm text-white/80">Registered donors</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-5 py-4">
            <div className="text-2xl font-bold text-white">20 min</div>
            <div className="mt-1 text-sm text-white/80">Donation window</div>
          </div>
        </div>
      </div>
    </section>
  )
}

function InventorySection({ inventory }: { inventory: InventoryItem[] }) {
  return (
    <section
      id="inventory"
      className="bg-warm py-20 sm:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-4 text-center">
          <span className="inline-block rounded-full bg-blood/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-blood">
            Live Feed
          </span>
        </div>
        <h2 className="text-center text-3xl font-bold tracking-tight text-charcoal sm:text-4xl">
          National Blood Supply
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-charcoal/80">
          Real-time inventory across all Singapore blood centres. Updated every
          5 minutes.
        </p>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {inventory.map((item) => (
            <div
              key={item.blood_type}
              className="flex items-center justify-between rounded-xl border border-warm-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="text-xl font-bold text-charcoal">
                {item.blood_type}
              </span>
              <span className="text-sm text-charcoal/80">
                {item.units} units
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorksSection() {
  return (
    <section id="how" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-bold tracking-tight text-charcoal sm:text-4xl">
          How it works
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-charcoal/80">
          From login to donation in four simple steps.
        </p>
        <div className="mt-16 grid gap-8 md:grid-cols-4">
          {steps.map((step, i) => (
            <div key={step.num} className="relative text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blood text-lg font-bold text-white">
                {step.num}
              </div>
              {i < steps.length - 1 && (
                <div className="absolute top-6 left-[calc(50%+2rem)] hidden h-0.5 w-[calc(100%-4rem)] bg-blood/20 md:block" />
              )}
              <h3 className="mt-5 text-lg font-semibold text-charcoal">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-charcoal/80">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTABand() {
  return (
    <section className="bg-blood py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Ready to donate? Singapore needs you.
        </h2>
        <p className="mt-4 text-lg text-red-100">
          Every donation can save up to three lives. Book your 20-minute window
          today.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-semibold text-blood transition-colors hover:bg-red-50"
          >
            <Shield className="h-5 w-5" />
            Login with Singpass
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="bg-charcoal py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-3">
            <Droplets className="h-6 w-6 text-blood" />
            <span className="text-lg font-bold text-white">BloodLine</span>
          </div>
          <p className="text-center text-sm text-white/40 sm:text-right">
            Built for Singapore &mdash; in partnership with HSA &mdash; Data
            sourced live from national blood banks
          </p>
        </div>
      </div>
    </footer>
  )
}

export default async function Home() {
  const inventory = await fetchOrFallback(async () => {
    const supabase = await createClient()
    const { data, error } = await supabase.from("blood_inventory").select("blood_type, units, centre_id")
    if (error) { console.error("[BloodLine] blood_inventory query:", error.message); return null }
    const raw = data as { blood_type: BloodType; units: number; centre_id: string }[]
    const centres = new Set(raw.map((r) => r.centre_id))
    const centreCount = centres.size || 1
    const nationalMax = MAX_UNITS * centreCount
    const grouped: Record<string, number> = {}
    for (const item of raw) {
      grouped[item.blood_type] = (grouped[item.blood_type] || 0) + item.units
    }
    return (Object.entries(grouped) as [BloodType, number][]).map(([blood_type, units]) => ({
      blood_type,
      units,
      capacity_pct: computeCapacityPct(units, nationalMax),
      status: computeStatus(computeCapacityPct(units, nationalMax)),
    }))
  }, FALLBACK_INVENTORY, "blood_inventory")

  return (
    <>
      <Navbar />
      <main>
        <HeroSection inventory={inventory} />
        <InventorySection inventory={inventory} />
        <HowItWorksSection />
        <CTABand />
      </main>
      <Footer />
    </>
  )
}
