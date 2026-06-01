-- BloodLine Supabase Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/<id>/sql/new)

-- 1. Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  initials TEXT NOT NULL,
  nric TEXT UNIQUE NOT NULL,
  blood_type TEXT NOT NULL CHECK (blood_type IN ('O-','A-','B-','AB-','O+','A+','B+','AB+')),
  date_of_birth DATE NOT NULL,
  age INTEGER NOT NULL,
  mobile TEXT,
  email TEXT,
  address TEXT,
  weight_kg NUMERIC(5,1),
  last_hb TEXT,
  last_hb_meta TEXT,
  donations_count INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  next_eligible TEXT DEFAULT 'Today',
  created_at TIMESTAMPTZ DEFAULT now(),
  role TEXT DEFAULT 'donor' CHECK (role IN ('donor', 'admin'))
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- 3. Blood centres
CREATE TABLE blood_centres (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  opening_hours TEXT DEFAULT '08:00 - 17:00',
  status TEXT DEFAULT 'good' CHECK (status IN ('critical', 'low', 'good')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE blood_centres ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view centres"
  ON blood_centres FOR SELECT
  USING (true);

CREATE POLICY "Admins can update centres"
  ON blood_centres FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 4. Blood inventory (per centre)
CREATE TABLE blood_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  centre_id UUID REFERENCES blood_centres(id) ON DELETE CASCADE,
  blood_type TEXT NOT NULL CHECK (blood_type IN ('O-','A-','B-','AB-','O+','A+','B+','AB+')),
  units INTEGER DEFAULT 0,
  capacity_pct NUMERIC(5,1) DEFAULT 0,
  status TEXT DEFAULT 'good' CHECK (status IN ('critical', 'low', 'good')),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE blood_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view inventory"
  ON blood_inventory FOR SELECT
  USING (true);

CREATE POLICY "Admins can update inventory"
  ON blood_inventory FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 5. Appointments
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  centre_id UUID REFERENCES blood_centres(id),
  centre_name TEXT,
  appointment_date DATE NOT NULL,
  time_start TEXT NOT NULL,
  time_end TEXT NOT NULL,
  blood_type TEXT NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'fast_pass', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Donors can view own appointments"
  ON appointments FOR SELECT
  USING (auth.uid() = donor_id);

CREATE POLICY "Donors can create appointments"
  ON appointments FOR INSERT
  WITH CHECK (auth.uid() = donor_id);

CREATE POLICY "Admins can view all appointments"
  ON appointments FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 6. Emergency contacts
CREATE TABLE emergency_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relation TEXT NOT NULL,
  phone TEXT NOT NULL
);

ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Donors can manage own contacts"
  ON emergency_contacts FOR ALL
  USING (auth.uid() = donor_id)
  WITH CHECK (auth.uid() = donor_id);

-- 7. Travel history
CREATE TABLE travel_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  return_date DATE,
  cleared_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('cleared', 'pending'))
);

ALTER TABLE travel_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Donors can manage own travel"
  ON travel_history FOR ALL
  USING (auth.uid() = donor_id)
  WITH CHECK (auth.uid() = donor_id);

-- 8. Donations
CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  centre_id UUID REFERENCES blood_centres(id),
  centre_name TEXT,
  donation_date DATE NOT NULL,
  blood_type TEXT NOT NULL,
  volume_ml INTEGER DEFAULT 350,
  notes TEXT
);

ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Donors can view own donations"
  ON donations FOR SELECT
  USING (auth.uid() = donor_id);

-- 9. Vouchers (catalog)
CREATE TABLE vouchers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  logo TEXT NOT NULL,
  description TEXT NOT NULL,
  points_cost INTEGER NOT NULL,
  available BOOLEAN DEFAULT true
);

ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view vouchers"
  ON vouchers FOR SELECT
  USING (true);

-- 10. Milestones (catalog)
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  description TEXT NOT NULL,
  condition TEXT NOT NULL
);

ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view milestones"
  ON milestones FOR SELECT
  USING (true);

-- 11. Donor milestones (junction)
CREATE TABLE donor_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES milestones(id) ON DELETE CASCADE,
  earned BOOLEAN DEFAULT false,
  earned_at TIMESTAMPTZ
);

ALTER TABLE donor_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Donors can view own milestones"
  ON donor_milestones FOR SELECT
  USING (auth.uid() = donor_id);

-- 12. Reward redemptions
CREATE TABLE reward_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  voucher_id UUID REFERENCES vouchers(id),
  voucher_name TEXT,
  points_spent INTEGER NOT NULL,
  redeemed_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Donors can view own redemptions"
  ON reward_redemptions FOR SELECT
  USING (auth.uid() = donor_id);

-- 13. Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, initials, nric, blood_type, date_of_birth, age, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Donor'),
    COALESCE(NEW.raw_user_meta_data->>'initials', '??'),
    COALESCE(NEW.raw_user_meta_data->>'nric', 'S****000A'),
    COALESCE(NEW.raw_user_meta_data->>'blood_type', 'O+'),
    COALESCE((NEW.raw_user_meta_data->>'date_of_birth')::DATE, '1990-01-01'),
    COALESCE((NEW.raw_user_meta_data->>'age')::INTEGER, 30),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 14. Seed data (run after setting up auth)
-- Insert seed data via the Supabase dashboard SQL editor after running this
