# Supabase Setup Guide

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New project**
3. Fill in:
   - **Name**: `bloodline`
   - **Database Password**: create a strong password (save it)
   - **Region**: choose the closest to Singapore (e.g., `Singapore`)
4. Wait for the database to provision (~2 minutes)

## 2. Get API keys

1. In your Supabase project dashboard, go to **Project Settings → API**
2. Copy these values into your `.env.local` file (and `.env.example`):

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

## 3. Run the database migration

1. In the Supabase dashboard, go to **SQL Editor**
2. Open `lib/supabase-schema.sql` from this project and copy the entire contents
3. Paste into the SQL Editor and click **Run**
4. This creates all tables, RLS policies, and the auto-profile trigger

## 4. Enable authentication

1. Go to **Authentication → Providers**
2. **Email/Password** should be enabled by default (toggle it on if not)
3. (Optional) To add **Singpass** — Singpass uses OAuth 2.0. In production you'd integrate with Singpass's API. For development, the login page also supports email/password.
4. Go to **Authentication → Settings**
   - Set `Site URL` to `http://localhost:3000`
   - Add `http://localhost:3000/auth/callback` to **Redirect URLs**

## 5. Seed the database

After running the migration, run these inserts in the SQL Editor to populate initial data:

```sql
-- Blood centres
INSERT INTO blood_centres (name, address, opening_hours, status) VALUES
  ('Bloodbank@HSA', '11 Outram Road, Singapore 169078', '08:00 - 17:00', 'critical'),
  ('Bloodbank@Woodlands', '1 Woodlands Square, #02-38, Singapore 738099', '09:00 - 18:00', 'low'),
  ('Bloodbank@Dhoby Ghaut', '1 Orchard Road, #04-01, Singapore 238841', '08:00 - 17:00', 'good'),
  ('Bloodbank@Westgate Tower', '1 Jurong East, #01-01, Singapore 609431', '09:00 - 18:00', 'good'),
  ('Bloodbank@One Punggol', '1 Punggol Drive, #02-38, Singapore 828829', '08:00 - 17:00', 'good');

-- Blood inventory for each centre
INSERT INTO blood_inventory (centre_id, blood_type, units, capacity_pct, status)
SELECT id, bt.blood_type, bt.units, bt.capacity, bt.status
FROM blood_centres CROSS JOIN (
  VALUES
    ('O-', 4, 8, 'critical'),
    ('A-', 11, 22, 'low'),
    ('B-', 14, 28, 'low'),
    ('AB-', 16, 32, 'low'),
    ('O+', 31, 62, 'good'),
    ('A+', 36, 72, 'good'),
    ('B+', 34, 68, 'good'),
    ('AB+', 38, 76, 'good')
) AS bt(blood_type, units, capacity, status);

-- Vouchers
INSERT INTO vouchers (name, logo, description, points_cost) VALUES
  ('FairPrice', 'NTUC', '$5 e-voucher - 500 pts', 500),
  ('GrabFood', 'Grab', '$5 e-voucher - 500 pts', 500),
  ('CDC vouchers', 'CDC', '$10 govt voucher - 1000 pts', 1000),
  ('Health screening', 'HSA', 'CHAS subsidised - 800 pts', 800);

-- Milestones
INSERT INTO milestones (name, icon, description, condition) VALUES
  ('First drop', 'droplet', 'Completed 1st donation', '1 donation'),
  ('On a streak', 'fire', 'Donated 3 times in a year', '3 donations/year'),
  ('Decade honor', 'star', 'Donated for 10 years', '10 years active'),
  ('Crisis responder', 'shield', 'Donate during a critical alert', 'Emergency donation'),
  ('Platinum donor', 'trophy', 'Reach Platinum tier', '3000 points');
```

## 6. Create a test user

1. Go to **Authentication → Users** and click **Add User**
2. Create a test user:
   - Email: `donor@test.com`
   - Password: `password123`
3. The auto-profile trigger will create a profile with default values
4. You can update the profile directly in the SQL Editor:

```sql
UPDATE profiles
SET
  full_name = 'Bryan Tan',
  initials = 'BT',
  nric = 'S****123A',
  blood_type = 'O-',
  date_of_birth = '1990-03-14',
  age = 36,
  mobile = '+65 9754 6671',
  email = 'bryantan@gmail.com',
  address = 'Blk 412 Clementi Ave 1, #08-22, S120412',
  weight_kg = 72,
  donations_count = 12,
  points = 2400,
  next_eligible = CURRENT_DATE
WHERE id = (SELECT id FROM auth.users WHERE email = 'donor@test.com' LIMIT 1);
```

## 7. Set up the admin role

To give a user admin access:

```sql
UPDATE profiles SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@test.com' LIMIT 1);
```

## 8. Running the app

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Architecture Notes

- **Pages use mock data by default** — when Supabase is configured, they automatically switch to live database queries
- **Row Level Security (RLS)** is enabled on all tables — donors can only see their own data, admins can see all
- **Auth is handled by Supabase Auth** with email/password and OAuth (Singpass via Google OAuth for dev)
- **The proxy.ts file** handles auth redirects (protected routes redirect to login if unauthenticated)
