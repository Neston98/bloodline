import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { VoucherList } from "@/components/feature/voucher-list"
import { MilestoneList } from "@/components/feature/milestone-list"
import UserLayout from "@/components/layout/user-layout"
import { Award, Droplets, Star, TrendingUp, Gift } from "lucide-react"
import { calculateTier, pointsToNextTier } from "@/utils/formatters"
import type { Profile, Voucher, DonorMilestone, Milestone } from "@/types"

const MOCK_PROFILE: Profile = {
  id: "donor-1", full_name: "Alex Tan", initials: "AT", nric: "S****1234A",
  blood_type: "O+", date_of_birth: "1990-05-15", age: 35, mobile: "+65 9123 4567",
  email: "alex.tan@email.com", address: "123 Orchard Road, #12-34, Singapore 123456",
  weight_kg: 72, last_hb: "14.5", last_hb_meta: "g/dL on 15 Mar 2025",
  donations_count: 12, points: 2450, tier: "Gold", next_eligible: "2025-07-15",
  created_at: "2022-01-10",
}

const MOCK_MILESTONES: Milestone[] = [
  { id: "m-1", name: "First Drop", icon: "💧", description: "Completed your first blood donation", condition: "1 donation" },
  { id: "m-2", name: "On a Streak", icon: "🔥", description: "Donated 3 times in a calendar year", condition: "3 donations/year" },
  { id: "m-3", name: "Decade of Honor", icon: "🎖️", description: "10 years of being a blood donor", condition: "10 years active" },
  { id: "m-4", name: "Crisis Responder", icon: "⚡", description: "Donated during a national blood shortage", condition: "Emergency donation" },
  { id: "m-5", name: "Platinum Donor", icon: "💎", description: "Reached the Platinum loyalty tier", condition: "3000 points" },
]

const MOCK_DONOR_MILESTONES: DonorMilestone[] = [
  { id: "dm-1", donor_id: "donor-1", milestone_id: "m-1", earned: true, earned_at: "2022-01-15", milestone: MOCK_MILESTONES[0] },
  { id: "dm-2", donor_id: "donor-1", milestone_id: "m-2", earned: true, earned_at: "2024-06-10", milestone: MOCK_MILESTONES[1] },
  { id: "dm-3", donor_id: "donor-1", milestone_id: "m-3", earned: false, earned_at: null, milestone: MOCK_MILESTONES[2] },
  { id: "dm-4", donor_id: "donor-1", milestone_id: "m-4", earned: true, earned_at: "2023-09-20", milestone: MOCK_MILESTONES[3] },
  { id: "dm-5", donor_id: "donor-1", milestone_id: "m-5", earned: false, earned_at: null, milestone: MOCK_MILESTONES[4] },
]

const MOCK_VOUCHERS: Voucher[] = [
  { id: "v-1", name: "NTUC FairPrice $10 Voucher", logo: "🛒", description: "Redeem at any FairPrice outlet", points_cost: 500, available: true },
  { id: "v-2", name: "GrabFood $5 Voucher", logo: "🍔", description: "Discount on your next GrabFood order", points_cost: 300, available: true },
  { id: "v-3", name: "CDC $10 Voucher", logo: "🏥", description: "Community Development Council voucher", points_cost: 400, available: true },
  { id: "v-4", name: "Free Health Screening", logo: "🩺", description: "Basic health screening at any HSA centre", points_cost: 800, available: true },
  { id: "v-5", name: "$20 GrabPay Credits", logo: "💳", description: "Credits for GrabPay wallet top-up", points_cost: 1000, available: false },
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
  }, MOCK_DONOR_MILESTONES)

  const tier = profile.tier || calculateTier(profile.points)
  const nextTier = tier === "Platinum" ? null : tier === "Gold" ? "Platinum" : tier === "Silver" ? "Gold" : "Silver"
  const ptsToNext = pointsToNextTier(profile.points)
  const progressPct = tier === "Platinum" ? 100 : tier === "Gold" ? (profile.points / 3000) * 100 : (profile.points / 2000) * 100

  return (
    <UserLayout currentPath="/rewards" profile={profile}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black">Rewards & Loyalty</h1>
        <p className="mt-1 text-sm text-gray-900">Track your progress, earn points, and redeem rewards</p>
      </div>

      <Card className="mb-8 overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Award className="h-6 w-6" />
                <span className="text-sm font-medium uppercase tracking-wider opacity-80">Current Tier</span>
              </div>
              <p className="mt-1 text-3xl font-bold">{tier}</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-80">Points Balance</p>
              <p className="text-3xl font-bold">{profile.points}</p>
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
          <Progress value={progressPct} indicatorClassName={tier === "Platinum" ? "bg-amber-500" : "bg-orange-500"} />
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
        <VoucherList vouchers={vouchers} userPoints={profile.points} />
        <MilestoneList donorMilestones={donorMilestones} />
      </div>
    </UserLayout>
  )
}
