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

# Email (Nodemailer via Gmail App Password)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password
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

## 5. Grant service_role access

Admin pages use the service role key (bypasses RLS). You must grant read access:

```sql
GRANT SELECT ON ALL TABLES IN SCHEMA public TO service_role;
```

## 6. Seed the database

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

## 7. Create a test donor user

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
  lifetime_points = 2400,
  next_eligible = CURRENT_DATE
WHERE id = (SELECT id FROM auth.users WHERE email = 'donor@test.com' LIMIT 1);
```

## 8. Create an admin user

Admins use Supabase Auth (same as donors) but with `role: 'admin'` in their user metadata.

Run this in the Supabase **SQL Editor** to create an admin directly:

```sql
-- 1. Find the centre UUID
SELECT id, name FROM blood_centres;

-- 2. Create the auth user and set admin metadata
--    Paste the centre UUID from step 1 into centre_id below.
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@bloodline.sg',
  crypt('your-password-here', gen_salt('bf')),
  now(),
  jsonb_build_object(
    'role', 'admin',
    'centre_id', '<paste-centre-uuid-here>',
    'full_name', 'Centre Admin',
    'initials', 'CA'
  ),
  now(),
  now(),
  '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@bloodline.sg');

-- 3. Set profiles.role
UPDATE profiles SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@bloodline.sg' LIMIT 1);
```

Repeat for each admin. Each admin must be assigned to a blood centre via `centre_id` in their metadata.

## 9. Create test donor user via SQL (alternative to Auth dashboard)

If the Auth dashboard **Users** page won't let you add users, run this in the SQL Editor:

```sql
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'donor@test.com',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"role": "donor"}'::jsonb,
  now(),
  now(),
  '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'donor@test.com');

-- Then set the profile fields
UPDATE profiles SET
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
  lifetime_points = 2400,
  next_eligible = CURRENT_DATE
WHERE id = (SELECT id FROM auth.users WHERE email = 'donor@test.com' LIMIT 1);
```

## 10. Running the app

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Architecture Notes

- **Pages use mock data by default** — when Supabase is configured, they automatically switch to live database queries
- **Row Level Security (RLS)** is enabled on all tables — donors can only see their own data, admins can see all
- **Auth is handled by Supabase Auth** for both donors and admins (email/password). Admin role is checked via `user.user_metadata.role`
- **The proxy.ts file** handles auth redirects — unauthenticated users are sent to login, non-admin users are blocked from `/admin/*`
- **Admin centre_id** is stored in `user.user_metadata.centre_id` and injected into admin dashboard URLs
- **`donations` table** is defined in the schema but unused by any code. `donations_count` is stored directly on `profiles`. You can safely drop the `donations` table.
- **`InventoryStatus` CHECK mismatch**: The schema CHECK constraint uses values `'critical', 'low', 'good', 'sufficient'` but the code types use `"critical" | "low" | "moderate" | "healthy"`. The mismatch is intentional — the actual DB has the CHECK values; the code computes `capacity_pct` and `status` from `units` at runtime, never reading the DB columns directly. See `lib/inventory.ts`.
- **Fast-pass email** uses Nodemailer with Gmail SMTP. You must enable 2FA on the sending Gmail account and generate an App Password (16 lowercase letters). Set `GMAIL_USER`, `GMAIL_APP_PASSWORD`, and `EMAIL_FROM` in `.env.local`.
- **QLN (Quick Login Note)**: `/admin/login` uses `supabase.auth.signInWithPassword()` + `user_metadata.role` check — no custom RPC or localStorage.
