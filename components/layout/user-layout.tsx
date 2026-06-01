import Link from "next/link"
import { LayoutDashboard, User, Calendar, Gift, LogOut, Droplets } from "lucide-react"
import { cn } from "@/utils/cn"
import type { Profile } from "@/types"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profile", label: "My Profile", icon: User },
  { href: "/appointments", label: "Appointments", icon: Calendar },
  { href: "/rewards", label: "Rewards", icon: Gift },
]

export default function UserLayout({
  currentPath,
  profile,
  children,
}: {
  currentPath: string
  profile: Profile
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-col border-r bg-white">
        <div className="flex items-center gap-2 border-b px-6 py-5">
          <Droplets className="h-6 w-6 text-red-500" />
          <span className="text-lg font-bold text-black">BloodLine</span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                currentPath === item.href
                  ? "bg-red-50 text-red-700"
                  : "text-gray-800 hover:bg-gray-50",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {profile.initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-black">{profile.full_name}</p>
              <p className="text-xs text-gray-900">{profile.tier}</p>
            </div>
          </div>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-50"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 bg-gray-50 p-8">{children}</main>
    </div>
  )
}
