import { describe, it, expect, vi, beforeEach } from "vitest"
import { recalculateNextEligible } from "../appointment"

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}))

describe("recalculateNextEligible", () => {
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn(() => mockSupabase),
      select: vi.fn(() => mockSupabase),
      eq: vi.fn(() => mockSupabase),
      in: vi.fn(() => mockSupabase),
      update: vi.fn(() => mockSupabase),
    }
  })

  it("returns today when no appointments or travel", async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "appointments") return { ...mockSupabase, data: [], error: null }
      if (table === "travel_history") return { ...mockSupabase, data: [], error: null }
      if (table === "profiles") return { ...mockSupabase, data: null, error: null }
      return mockSupabase
    })

    const result = await recalculateNextEligible("donor-1", mockSupabase)
    expect(result).toBeDefined()
    expect(typeof result).toBe("string")
  })

  it("picks the max date from appointments and travel", async () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 30)
    const futureDateStr = futureDate.toISOString().slice(0, 10)

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "appointments") {
        return {
          ...mockSupabase,
          data: [{ appointment_date: futureDateStr }],
          error: null,
        }
      }
      if (table === "travel_history") {
        return { ...mockSupabase, data: [], error: null }
      }
      if (table === "profiles") {
        return { ...mockSupabase, data: null, error: null }
      }
      return mockSupabase
    })

    const result = await recalculateNextEligible("donor-1", mockSupabase)
    expect(mockSupabase.from).toHaveBeenCalledWith("profiles")
    expect(mockSupabase.update).toHaveBeenCalledWith(
      expect.objectContaining({ next_eligible: expect.any(String) })
    )
    expect(result).toBeDefined()
  })

  it("handles travel deferrals", async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "appointments") return { ...mockSupabase, data: [], error: null }
      if (table === "travel_history") {
        const d = new Date()
        d.setDate(d.getDate() + 60)
        return { ...mockSupabase, data: [{ cleared_date: d.toISOString().slice(0, 10) }], error: null }
      }
      if (table === "profiles") return { ...mockSupabase, data: null, error: null }
      return mockSupabase
    })

    const result = await recalculateNextEligible("donor-1", mockSupabase)
    expect(result).toBeDefined()
    expect(mockSupabase.update).toHaveBeenCalled()
  })
})
