"use client"

import { useEffect } from "react"

export default function DashboardRedirect() {
  useEffect(() => {
    const raw = localStorage.getItem("admin-session")
    if (!raw) {
      window.location.href = "/admin/login"
      return
    }

    try {
      const session = JSON.parse(raw)
      if (session?.centre_id) {
        const params = new URLSearchParams(window.location.search)
        if (!params.has("centre_id")) {
          window.location.replace(`/admin/dashboard?centre_id=${encodeURIComponent(session.centre_id)}`)
          return
        }
      }
    } catch {
      localStorage.removeItem("admin-session")
      window.location.href = "/admin/login"
    }
  }, [])

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mx-auto mb-4 h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-red-600" />
        <p className="text-sm text-gray-500">Loading dashboard...</p>
      </div>
    </div>
  )
}
