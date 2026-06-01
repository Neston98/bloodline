# BloodLine

Singapore's national blood donation coordination platform. Connects donors with blood banks in real time.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Icons**: lucide-react
- **Backend/Database**: Supabase (PostgreSQL + Auth + RLS)
- **Auth**: Supabase Auth (email/password + Singpass OAuth)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/
├── page.tsx              # Landing page (public)
├── layout.tsx            # Root layout with fonts
├── globals.css           # Tailwind + custom theme
├── proxy.ts              # Auth middleware / proxy
├── (auth)/
│   ├── login/            # User login (Singpass + email)
│   ├── register/         # User registration
│   ├── callback/         # OAuth callback handler
│   └── signout/          # Sign out handler
├── dashboard/            # Donor home/dashboard
├── profile/              # Donor profile & medical details
├── appointments/         # Appointment management
│   └── new/              # New appointment booking
├── rewards/              # Points, vouchers, milestones
└── admin/
    ├── login/            # Admin login page
    ├── dashboard/        # Admin dashboard & metrics
    ├── donors/           # Admin donor management
    └── centres/          # Blood centre inventory mgmt

components/
├── ui/                   # Reusable UI primitives
├── layout/               # Sidebars & page layouts
└── feature/              # Domain-specific components

lib/
├── supabase/             # Supabase clients & middleware
└── supabase-schema.sql   # Database migration script

types/                    # TypeScript type definitions
utils/                    # Helpers (cn, formatters)

_legacy/                  # Original prototype files
```

## Supabase Setup

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for complete setup instructions.

## Development

All pages use mock data by default so the app works immediately without Supabase. When you connect Supabase, pages automatically fetch live data.

```bash
npm run dev     # Development server
npm run build   # Production build
npm run start   # Start production server
npm run lint    # Run ESLint
```
