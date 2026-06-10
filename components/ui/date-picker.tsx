"use client"

import { useState, useRef, useEffect } from "react"

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const days = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  minDate?: string
  direction?: "down" | "up"
  align?: "left" | "right"
  highlightDates?: string[]
  placeholder?: string
  inputCls?: string
  /** Override calendar dropdown width (default: 17rem / 272px) */
  calendarWidth?: number
}

const CELL = 36

export function DatePicker({ value, onChange, minDate, direction = "down", align = "left", highlightDates, placeholder, inputCls, calendarWidth }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const today = new Date()
  const selected = value ? new Date(value + "T12:00:00") : null
  const [viewMonth, setViewMonth] = useState(selected ? selected.getMonth() : today.getMonth())
  const [viewYear, setViewYear] = useState(selected ? selected.getFullYear() : today.getFullYear())

  useEffect(() => {
    if (gridRef.current) {
      const todayBtn = gridRef.current.querySelector(`[data-td]`)
      if (todayBtn) (todayBtn as HTMLElement).scrollIntoView({ block: "nearest" })
    }
  }, [open])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const cw = calendarWidth ?? 272

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()

  function isHighlighted(day: number) {
    if (!highlightDates?.length) return false
    const d = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return highlightDates.includes(d)
  }

  function isDisabled(day: number) {
    if (!minDate) return false
    const d = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return d < minDate
  }

  function pick(day: number) {
    if (isDisabled(day)) return
    onChange(`${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`)
    setOpen(false)
  }

  function display(v: string) {
    if (!v) return ""
    const d = new Date(v + "T12:00:00")
    return d.toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })
  }

  return (
    <div className="relative" ref={ref}>
      <input
        readOnly
        value={display(value)}
        placeholder={placeholder}
        onClick={() => setOpen(!open)}
        className={inputCls}
      />
      {open && (
        <div style={{ position: "absolute", [direction === "up" ? "bottom" : "top"]: "100%", [align === "right" ? "right" : "left"]: 0, zIndex: 50, width: cw, marginBottom: direction === "up" ? "8px" : undefined, marginTop: direction === "down" ? "8px" : undefined }}
          className="rounded-xl border border-gray-200 bg-white p-3 shadow-xl dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-2 flex items-center justify-between px-1">
            <button type="button" onClick={() => { if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) } else setViewMonth(m => m - 1) }}
              className="flex h-7 w-7 items-center justify-center rounded text-gray-600 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors text-xs">&#x25C0;</button>
            <span className="text-sm font-semibold text-black dark:text-gray-100">{months[viewMonth]} {viewYear}</span>
            <button type="button" onClick={() => { if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) } else setViewMonth(m => m + 1) }}
              className="flex h-7 w-7 items-center justify-center rounded text-gray-600 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors text-xs">&#x25B6;</button>
          </div>
          <div className="flex mb-1" style={{ width: cw - 24 }}>
            {days.map(d => (
              <div key={d} className="flex-1 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">{d}</div>
            ))}
          </div>
          <div ref={gridRef} style={{ display: "flex", flexWrap: "wrap", width: cw - 24 }}>
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`e-${i}`} style={{ width: (cw - 24) / 7, height: CELL }} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const disabled = isDisabled(day)
              const highlighted = isHighlighted(day)
              const isSel = selected && selected.getDate() === day && selected.getMonth() === viewMonth && selected.getFullYear() === viewYear
              const isToday = today.getDate() === day && today.getMonth() === viewMonth && today.getFullYear() === viewYear

              if (disabled) {
                return (
                  <div key={day} style={{ width: (cw - 24) / 7, height: CELL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", opacity: 0.25 }}
                    className="text-gray-400 dark:text-gray-500">
                    {day}
                  </div>
                )
              }

              let bg = "transparent"
              if (isSel) bg = "#dc2626"
              else if (highlighted) bg = "#fef9c3"
              else if (isToday) bg = "#fef2f2"

              const darkBg = isSel ? "#dc2626" : isToday ? "#1c1a20" : "transparent"

              return (
                <button key={day} type="button" onClick={() => pick(day)}
                  style={{ width: (cw - 24) / 7, height: CELL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", border: "none", cursor: "pointer", transition: "background 0.15s", backgroundColor: bg, color: isSel ? "#fff" : highlighted ? "#92400e" : isToday ? "#dc2626" : "#000", fontWeight: isSel || isToday || highlighted ? "600" : "400" }}
                  onMouseEnter={(e) => { if (!isSel && !highlighted) e.currentTarget.style.backgroundColor = "#fef2f2" }}
                  onMouseLeave={(e) => { if (!isSel && !highlighted) e.currentTarget.style.backgroundColor = bg }}>
                  {day}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
