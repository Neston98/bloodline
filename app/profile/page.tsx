import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmergencyContacts } from "@/components/feature/emergency-contacts"
import { getTierColor, getTierBg, getDisplayTier } from "@/utils/formatters"
import UserLayout from "@/components/layout/user-layout"
import {
  ShieldCheck, Phone, Mail, MapPin, Weight, Droplets, Award,
  Calendar, Heart, ChevronRight, User,
} from "lucide-react"
import type { Profile, EmergencyContact } from "@/types"

const MOCK_PROFILE: Profile = {
  id: "donor-1",
  full_name: "Alex Tan",
  initials: "AT",
  nric: "S****1234A",
  blood_type: "O+",
  date_of_birth: "1990-05-15",
  age: 35,
  mobile: "+65 9123 4567",
  email: "alex.tan@email.com",
  address: "123 Orchard Road, #12-34, Singapore 123456",
  weight_kg: 72,
  last_hb: "14.8",
  last_hb_meta: "g/dL on 28 May 2026",
  donations_count: 12,
  points: 2450,
  lifetime_points: 2450,
  tier: "Gold",
  next_eligible: "2025-07-15",
  created_at: "2022-01-10",
}

const MOCK_CONTACTS: EmergencyContact[] = [
  { id: "ec-1", donor_id: "donor-1", name: "Sarah Tan", relation: "Spouse", phone: "+65 9876 5432" },
  { id: "ec-2", donor_id: "donor-1", name: "James Tan", relation: "Brother", phone: "+65 8765 4321" },
]

async function fetchOrFallback<T>(fetch: () => Promise<T | null | undefined>, fallback: T): Promise<T> {
  try {
    const result = await fetch()
    return result ?? fallback
  } catch {
    return fallback
  }
}

export default async function ProfilePage() {
  const profile = await fetchOrFallback(async () => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).single()
    return data as Profile
  }, MOCK_PROFILE)

  const contacts = await fetchOrFallback(async () => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from("emergency_contacts").select("*").eq("donor_id", user!.id)
    return data as EmergencyContact[]
  }, MOCK_CONTACTS)

  const displayTier = getDisplayTier(profile)

  return (
    <UserLayout currentPath="/profile" profile={profile}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black dark:text-gray-100">My Profile</h1>
        <p className="mt-1 text-sm text-gray-900 dark:text-gray-300">Manage your personal information and donor details</p>
      </div>

      <div className="mb-6 overflow-hidden rounded-xl border bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="p-6" style={{ background: "linear-gradient(to right, #991b1b, #7f1d1d)" }}>
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-2xl font-bold text-white">
              {profile.initials}
            </div>
            <div className="text-white">
              <h2 className="text-xl font-bold">{profile.full_name}</h2>
              <p className="text-sm text-white/80">Donor ID: {profile.id}</p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="default" className="bg-white text-red-700">
                  {profile.blood_type}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-white/80">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Singpass Verified
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="divide-y">
          <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
            <InfoRow icon={<User className="h-4 w-4" />} label="NRIC" value={profile.nric} />
            <InfoRow icon={<Calendar className="h-4 w-4" />} label="Date of Birth" value={`${profile.date_of_birth} (Age ${profile.age})`} />
            <InfoRow icon={<Phone className="h-4 w-4" />} label="Mobile" value={profile.mobile} />
            <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={profile.email} />
            <InfoRow icon={<MapPin className="h-4 w-4" />} label="Address" value={profile.address} />
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-red-500" />
              Medical Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Droplets className="h-4 w-4 text-red-500" />
                Blood Type
              </div>
              <span className="text-sm font-semibold text-black dark:text-gray-100">{profile.blood_type}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Weight className="h-4 w-4" />
                Weight
              </div>
              <span className="text-sm font-semibold text-black dark:text-gray-100">{profile.weight_kg} kg</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Heart className="h-4 w-4 text-red-500" />
                Last Hb Reading
              </div>
              <span className="text-sm font-semibold text-black dark:text-gray-100">
                {profile.last_hb} {profile.last_hb_meta}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" />
              Donation Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Donations</span>
              <span className="text-sm font-semibold text-black dark:text-gray-100">{profile.donations_count}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
              <span className="text-sm text-gray-600 dark:text-gray-400">First Donation</span>
              <span className="text-sm font-semibold text-black dark:text-gray-100">15 Jan 2022</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
              <span className="text-sm text-gray-600 dark:text-gray-400">Last Donation</span>
              <span className="text-sm font-semibold text-black dark:text-gray-100">15 Mar 2025</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
              <span className="text-sm text-gray-600 dark:text-gray-400">Next Eligible</span>
              <span className="text-sm font-semibold text-black dark:text-gray-100">{formatDate(profile.next_eligible)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
              <span className="text-sm text-gray-600 dark:text-gray-400">Points</span>
              <span className="text-sm font-semibold text-black dark:text-gray-100">{profile.points}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
              <span className="text-sm text-gray-600 dark:text-gray-400">Current Tier</span>
              <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold" style={{ backgroundColor: getTierBg(displayTier), color: getTierColor(displayTier), border: `2px solid ${getTierColor(displayTier)}` }}>{displayTier}</span>
            </div>
            <a
              href="/rewards"
              className="mt-2 flex items-center justify-between rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30"
            >
              <span>View Rewards & Redemption</span>
              <ChevronRight className="h-4 w-4" />
            </a>
          </CardContent>
        </Card>
      </div>

      <EmergencyContacts contacts={contacts} donorId={profile.id} />
    </UserLayout>
  )
}

function formatDate(date: string | null | undefined) {
  if (!date) return "Today"
  const d = new Date(date)
  if (isNaN(d.getTime())) return "Today"
  return d.toLocaleDateString("en-SG", {
    day: "numeric", month: "short", year: "numeric",
  })
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-300">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-900 dark:text-gray-300">{label}</p>
        <p className="text-sm font-medium text-black dark:text-gray-100 truncate">{value}</p>
      </div>
    </div>
  )
}
