"use client"

import Link from "next/link"
import { cn } from "@/utils/cn"
import { Droplet, LayoutDashboard, Users, Building, LogOut } from "lucide-react"
import type { ReactNode } from "react"

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Donors", href: "/admin/donors", icon: Users },
  { label: "Blood Centres", href: "/admin/centres", icon: Building },
]

interface AdminLayoutProps {
  currentPath: string
  centreName?: string
  children: ReactNode
}

function AdminLayout({ currentPath, centreName, children }: AdminLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0a]">
      <aside className="flex h-full w-16 flex-col border-r border-white/5 bg-[#1f1f24] md:w-64">
        <div className="flex items-center justify-center gap-2.5 border-b border-white/5 px-4 py-5 md:px-6 md:justify-start">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-red-600 to-red-500">
            <Droplet className="h-5 w-5 text-white" />
          </div>
          <span className="hidden text-lg font-bold text-white md:block">BloodLine</span>
        </div>

        <div className="hidden border-b border-white/5 px-6 py-4 md:block">
          <p className="text-sm font-medium text-white/80">{centreName || "Centre Admin"}</p>
          <p className="text-xs text-gray-400">Centre Admin</p>
        </div>

        <nav className="flex-1 space-y-1 px-2 py-4 md:px-3">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPath === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-center gap-3 rounded-lg px-2 py-2.5 text-sm font-medium transition-colors md:justify-start md:px-3",
                  isActive
                    ? "bg-red-500/15 text-red-400"
                    : "text-gray-400 hover:bg-white/5 hover:text-gray-200",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="hidden border-t border-white/5 px-6 py-4 md:block">
          <form action="/auth/signout" method="post">
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-white/5 hover:text-gray-200">
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-8">{children}</main>
    </div>
  )
}

export { AdminLayout, type AdminLayoutProps }
