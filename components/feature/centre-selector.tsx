"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { MapPin } from "lucide-react"

interface BloodCentre {
  id: string
  name: string
}

export function CentreSelector({ centres }: { centres: BloodCentre[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const selected = searchParams.get("centre") || centres[0]?.id || ""

  return (
    <div className="flex items-center gap-2">
      <MapPin className="h-4 w-4 text-gray-600 dark:text-gray-400" />
      <select
        value={selected}
        onChange={(e) => {
          const params = new URLSearchParams(searchParams.toString())
          params.set("centre", e.target.value)
          router.push(`${pathname}?${params.toString()}`)
        }}
        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-black focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
      >
        {centres.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  )
}
