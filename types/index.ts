export type BloodType =
  | "O-" | "A-" | "B-" | "AB-"
  | "O+" | "A+" | "B+" | "AB+"

export type InventoryStatus = "critical" | "low" | "moderate" | "healthy"

export interface BloodCentre {
  id: string
  name: string
  address: string
  opening_hours: string
  status: InventoryStatus
  created_at: string
}

export interface BloodInventory {
  id: string
  centre_id: string
  blood_type: BloodType
  units: number
  capacity_pct: number
  status: InventoryStatus
  updated_at: string
}

export interface Profile {
  id: string
  full_name: string
  initials: string
  nric: string
  blood_type: BloodType
  date_of_birth: string
  age: number
  mobile: string
  email: string
  address: string
  weight_kg: number
  last_hb: string
  last_hb_meta: string
  donations_count: number
  points: number
  lifetime_points?: number
  tier: string
  next_eligible: string
  created_at: string
}

export interface Appointment {
  id: string
  donor_id: string
  centre_id: string
  centre_name: string
  appointment_date: string
  time_start: string
  time_end: string
  blood_type: BloodType
  status: "scheduled" | "fast_pass" | "completed" | "cancelled"
  admin_approved?: boolean
  created_at: string
}

export interface EmergencyContact {
  id: string
  donor_id: string
  name: string
  relation: string
  phone: string
}

export interface TravelRecord {
  id: string
  donor_id: string
  country: string
  city: string
  return_date: string
  cleared_date: string
  status: "cleared" | "pending"
}

export interface Voucher {
  id: string
  name: string
  logo: string
  description: string
  points_cost: number
  available: boolean
}

export interface Milestone {
  id: string
  name: string
  icon: string
  description: string
  condition: string
}

export interface DonorMilestone {
  id: string
  donor_id: string
  milestone_id: string
  earned: boolean
  earned_at: string | null
  milestone?: Milestone
}

export interface RewardRedemption {
  id: string
  donor_id: string
  voucher_id: string
  voucher_name: string
  points_spent: number
  redeemed_at: string
}

export interface Donation {
  id: string
  donor_id: string
  centre_id: string
  centre_name: string
  donation_date: string
  blood_type: BloodType
  volume_ml: number
  notes: string
}
