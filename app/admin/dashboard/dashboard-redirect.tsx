"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export default function CentreRedirect() {
  useEffect(() => {
    async function redirect() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        window.location.href = "/admin/login"
        return
      }

      const centreId = session.user.user_metadata?.centre_id
      if (centreId) {
        const params = new URLSearchParams(window.location.search)
        if (!params.has("centre_id")) {
          const path = window.location.pathname
          window.location.replace(`${path}?centre_id=${encodeURIComponent(centreId)}`)
        }
      }
    }

    redirect()
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
