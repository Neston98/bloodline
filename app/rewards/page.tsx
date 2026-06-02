import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { VoucherList } from "@/components/feature/voucher-list"
import { MilestoneList } from "@/components/feature/milestone-list"
import UserLayout from "@/components/layout/user-layout"
import { Award, Droplets, Star, TrendingUp, Gift } from "lucide-react"
import { calculateTier, pointsToNextTier, calculateTierProgress, getNextTierName, getTierGradient, getTierIndicator, getDisplayTier, getTierPoints } from "@/utils/formatters"
import type { Profile, Voucher, DonorMilestone, Milestone } from "@/types"

const MOCK_PROFILE: Profile = {
  id: "donor-1", full_name: "Alex Tan", initials: "AT", nric: "S****1234A",
  blood_type: "O+", date_of_birth: "1990-05-15", age: 35, mobile: "+65 9123 4567",
  email: "alex.tan@email.com", address: "123 Orchard Road, #12-34, Singapore 123456",
  weight_kg: 72, last_hb: "14.8", last_hb_meta: "g/dL on 28 May 2026",
  donations_count: 12, points: 2400, lifetime_points: 2400, tier: "Gold", next_eligible: "2025-07-15",
  created_at: "2022-01-10",
}

const ALL_MILESTONES: Milestone[] = [
  { id: "m-1", name: "First Drop", icon: "💧", description: "Completed your first blood donation", condition: "1 donation" },
  { id: "m-2", name: "Helping Hands", icon: "🤲", description: "Donated 5 times", condition: "5 donations" },
  { id: "m-3", name: "Lifesaver", icon: "🩸", description: "Donated 10 times", condition: "10 donations" },
  { id: "m-4", name: "Dedicated", icon: "🏅", description: "Donated 25 times", condition: "25 donations" },
  { id: "m-5", name: "Half Century", icon: "🎯", description: "Donated 50 times", condition: "50 donations" },
  { id: "m-6", name: "Elite Circle", icon: "⭐", description: "Donated 100 times", condition: "100 donations" },
  { id: "m-7", name: "On a Streak", icon: "🔥", description: "Donated 3 times in a calendar year", condition: "3 donations/year" },
  { id: "m-8", name: "Silver Arm", icon: "🥈", description: "Donated consecutively for 5 years", condition: "5 consecutive years" },
  { id: "m-9", name: "Golden Heart", icon: "💛", description: "Donated consecutively for 10 years", condition: "10 consecutive years" },
  { id: "m-10", name: "Crisis Responder", icon: "⚡", description: "Donated during a national blood shortage", condition: "Emergency donation" },
  { id: "m-11", name: "Platinum Donor", icon: "💎", description: "Reached the Platinum loyalty tier", condition: "3000 points" },
  { id: "m-12", name: "Diamond Donor", icon: "👑", description: "Reached the Diamond loyalty tier", condition: "5000 points" },
]

function deriveDonorMilestones(profile: Profile): DonorMilestone[] {
  const pts = getTierPoints(profile)
  const donations = profile.donations_count
  const yearsActive = Math.floor(
    (Date.now() - new Date(profile.created_at).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  )

  return ALL_MILESTONES.map((m, i) => {
    let earned = false
    let earnedAt: string | null = null

    switch (m.id) {
      case "m-1": // First Drop
        earned = donations >= 1
        earnedAt = earned ? (profile.created_at ?? "2022-01-15") : null
        break
      case "m-2": // Helping Hands
        earned = donations >= 5
        break
      case "m-3": // Lifesaver
        earned = donations >= 10
        break
      case "m-4": // Dedicated
        earned = donations >= 25
        break
      case "m-5": // Half Century
        earned = donations >= 50
        break
      case "m-6": // Elite Circle
        earned = donations >= 100
        break
      case "m-7": // On a Streak
        earned = donations >= 3
        break
      case "m-8": // Silver Arm
        earned = yearsActive >= 5
        break
      case "m-9": // Golden Heart
        earned = yearsActive >= 10
        break
      case "m-10": // Crisis Responder
        earned = true // everyone gets this by default in mock
        break
      case "m-11": // Platinum Donor
        earned = pts >= 3000
        break
      case "m-12": // Diamond Donor
        earned = pts >= 5000
        break
    }

    return {
      id: `dm-${i + 1}`,
      donor_id: profile.id,
      milestone_id: m.id,
      earned,
      earned_at: earned ? (earnedAt ?? "2025-01-01") : null,
      milestone: m,
    }
  })
}

const MOCK_VOUCHERS: Voucher[] = [
  { id: "v-1", name: "NTUC Fairprice $10 Voucher", logo: "", description: "Redeem at any FairPrice outlet", points_cost: 500, available: true },
  { id: "v-2", name: "Grab Food $5 Voucher", logo: "", description: "Discount on your next GrabFood order", points_cost: 300, available: true },
  { id: "v-3", name: "CDC Vouchers $10", logo: "", description: "Community Development Council voucher", points_cost: 400, available: true },
  { id: "v-4", name: "HSA Health Screening", logo: "", description: "Free basic health screening at any HSA centre", points_cost: 800, available: true },
  { id: "v-5", name: "GrabPay $20 Credits", logo: "", description: "Credits for GrabPay wallet top-up", points_cost: 1000, available: false },
]

async function fetchOrFallback<T>(fetch: () => Promise<T | null | undefined>, fallback: T): Promise<T> {
  try {
    const result = await fetch()
    return result ?? fallback
  } catch {
    return fallback
  }
}

export default async function RewardsPage() {
  const profile = await fetchOrFallback(async () => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).single()
    return data as Profile
  }, MOCK_PROFILE)

  const vouchers = await fetchOrFallback(async () => {
    const supabase = await createClient()
    const { data } = await supabase.from("vouchers").select("*")
    return data as Voucher[]
  }, MOCK_VOUCHERS)

  const donorMilestones = await fetchOrFallback(async () => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from("donor_milestones").select("*, milestone:milestone_id(*)").eq("donor_id", user!.id)
    return data as DonorMilestone[]
  }, deriveDonorMilestones(profile))

  const tierPts = getTierPoints(profile)
  const tier = getDisplayTier(profile)
  const nextTier = getNextTierName(tierPts)
  const ptsToNext = pointsToNextTier(tierPts)
  const progressPct = calculateTierProgress(tierPts)
  const tierGradient = getTierGradient(tier)
  const tierIndicator = getTierIndicator(tier)

  return (
    <UserLayout currentPath="/rewards" profile={profile}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black">Rewards & Loyalty</h1>
        <p className="mt-1 text-sm text-gray-900">Track your progress, earn points, and redeem rewards</p>
      </div>

      <Card className="mb-8 overflow-hidden">
        <div className="p-6 text-white" style={{ background: tierGradient }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Award className="h-6 w-6" />
                <span className="text-sm font-medium uppercase tracking-wider opacity-80">Current Tier</span>
              </div>
              <p className="mt-1 text-3xl font-bold">{tier}</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-80">Lifetime Points Balance</p>
              <p className="text-3xl font-bold">{getTierPoints(profile)}</p>
            </div>
          </div>
        </div>
        <CardContent className="p-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-gray-900">
              {nextTier ? `${ptsToNext} points to ${nextTier}` : "Maximum tier reached!"}
            </span>
            <span className="font-medium text-black">{Math.round(progressPct)}%</span>
          </div>
          <Progress value={progressPct} indicatorClassName={tierIndicator} />
        </CardContent>
      </Card>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <Droplets className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-900">Donations</p>
              <p className="text-lg font-bold text-black">{profile.donations_count}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Gift className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-900">Points per Visit</p>
              <p className="text-lg font-bold text-black">200</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Star className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-900">Current Tier</p>
              <p className="text-lg font-bold text-black">{tier}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-900">Progress</p>
              <p className="text-lg font-bold text-black">{Math.round(progressPct)}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <VoucherList vouchers={vouchers} userPoints={profile.points} lifetimePoints={getTierPoints(profile)} />
        <MilestoneList donorMilestones={donorMilestones} />
      </div>
    </UserLayout>
  )
}
