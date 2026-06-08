import Link from "next/link"
import { LayoutDashboard, User, Calendar, Gift, LogOut, Droplets } from "lucide-react"
import { cn } from "@/utils/cn"
import { getDisplayTier } from "@/utils/formatters"
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
    <div className="flex h-screen overflow-hidden">
      <aside className="flex w-16 shrink-0 flex-col border-r border-gray-800 md:w-64" style={{ backgroundColor: "#1E1E24" }}>
        <div className="flex items-center justify-center border-b border-gray-800 px-2 py-5 md:justify-start md:gap-2 md:px-6">
          <Droplets className="h-6 w-6 shrink-0 text-red-500" />
          <span className="hidden text-lg font-bold text-white md:block">BloodLine</span>
        </div>
        <nav className="flex-1 space-y-1 px-2 py-4 md:px-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-all duration-200 md:justify-start md:px-3",
                currentPath === item.href
                  ? "bg-red-600/20 text-red-400 border-l-2 border-red-400"
                  : "text-gray-400 border-l-2 border-transparent hover:text-white hover:bg-white/10 hover:border-gray-400",
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="hidden md:inline">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="hidden border-t border-gray-800 px-6 py-4 md:block">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {profile.initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{profile.full_name}</p>
              <p className="text-xs text-gray-400">{getDisplayTier(profile)}</p>
            </div>
          </div>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-gray-50 p-8">{children}</main>
    </div>
  )
}
