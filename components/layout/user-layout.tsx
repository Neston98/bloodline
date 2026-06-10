"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { LayoutDashboard, User, Calendar, Gift, LogOut, Droplets, Menu, X, Sun, Moon } from "lucide-react"
import { cn } from "@/utils/cn"
import { getDisplayTier } from "@/utils/formatters"
import type { Profile } from "@/types"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profile", label: "My Profile", icon: User },
  { href: "/appointments", label: "Appointments", icon: Calendar },
  { href: "/rewards", label: "Rewards", icon: Gift },
]

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)")
    setIsMobile(mq.matches)
    function onChange(e: MediaQueryListEvent) {
      setIsMobile(e.matches)
    }
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  return isMobile
}

function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"))
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    if (next) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
    try {
      localStorage.setItem("bloodline-theme", next ? "dark" : "light")
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {dark ? "Light Mode" : "Dark Mode"}
    </button>
  )
}

export default function UserLayout({
  currentPath,
  profile,
  children,
}: {
  currentPath: string
  profile: Profile
  children: React.ReactNode
}) {
  const isMobile = useIsMobile()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const isActive = (href: string) => currentPath.startsWith(href)

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [drawerOpen])

  const desktopSidebar = (
    <aside className="hidden md:flex md:w-64 shrink-0 flex-col border-r border-gray-800" style={{ backgroundColor: "#1E1E24" }}>
      <div className="flex items-center gap-2 border-b border-gray-800 px-6 py-5">
        <Droplets className="h-6 w-6 shrink-0 text-red-500" />
        <span className="text-lg font-bold text-white">BloodLine</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
              currentPath.startsWith(item.href)
                ? "bg-red-600/20 text-red-400 border-l-2 border-red-400"
                : "text-gray-400 border-l-2 border-transparent hover:text-white hover:bg-white/10 hover:border-gray-400",
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-gray-800 px-3 py-2">
        <ThemeToggle />
      </div>
      <div className="border-t border-gray-800 px-6 py-4">
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
  )

  return (
    <div className="flex h-screen overflow-hidden">
      {desktopSidebar}

      <div className="flex flex-1 flex-col overflow-hidden">
        {isMobile && (
          <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-red-500" />
              <span className="text-base font-bold text-black dark:text-white">BloodLine</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const isDark = document.documentElement.classList.toggle("dark")
                  try { localStorage.setItem("bloodline-theme", isDark ? "dark" : "light") } catch {}
                }}
                className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle dark mode"
              >
                <Sun className="h-5 w-5 hidden dark:block" />
                <Moon className="h-5 w-5 block dark:hidden" />
              </button>
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </header>
        )}

        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-charcoal">
          <div className="p-4 md:p-8">{children}</div>
        </main>
      </div>

      {isMobile && drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {isMobile && (
        <div
          className="fixed top-0 right-0 z-50 h-full w-72 transition-transform duration-300 ease-in-out"
          style={{ transform: drawerOpen ? "translateX(0)" : "translateX(100%)", backgroundColor: "#1E1E24" }}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
              <div className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-red-500" />
                <span className="text-base font-bold text-white">BloodLine</span>
              </div>
              <span
                onClick={() => setDrawerOpen(false)}
                className="flex cursor-pointer items-center justify-center rounded-lg p-1.5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setDrawerOpen(false) } }}
              >
                <X className="h-5 w-5 pointer-events-none" />
              </span>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setDrawerOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200",
                    isActive(item.href)
                      ? "bg-red-600/20 text-red-400 border-l-2 border-red-400"
                      : "text-gray-400 border-l-2 border-transparent hover:text-white hover:bg-white/10 hover:border-gray-400",
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {item.label}
                </Link>
              ))}
              <div className="border-t border-gray-700 pt-3 mt-3">
                <ThemeToggle />
              </div>
            </nav>

            <div className="border-t border-gray-800 px-5 py-4">
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
          </div>
        </div>
      )}
    </div>
  )
}
