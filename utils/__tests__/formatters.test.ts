import { describe, it, expect } from "vitest"
import {
  formatDate, formatTime, bloodTypeColor, statusPillColor,
  calculateTier, getTierIndex, pointsToNextTier, getTierBenefits,
  getTierColor, getTierIndicator, getTierGradient, getTierBg,
  getNextTierName, calculateTierProgress, getDisplayTier, getTierPoints,
} from "../formatters"

describe("formatDate", () => {
  it("formats a date string in en-SG locale", () => {
    const result = formatDate("2025-06-10")
    expect(result).toContain("June")
    expect(result).toContain("2025")
  })
})

describe("formatTime", () => {
  it("converts 24h to 12h with am/pm", () => {
    expect(formatTime("09:00")).toBe("9:00am")
    expect(formatTime("12:00")).toBe("12:00pm")
    expect(formatTime("13:30")).toBe("1:30pm")
    expect(formatTime("00:15")).toBe("12:15am")
  })
})

describe("bloodTypeColor", () => {
  it("returns critical colors", () => {
    expect(bloodTypeColor("critical")).toContain("text-red-600")
  })
  it("returns low colors", () => {
    expect(bloodTypeColor("low")).toContain("text-amber-700")
  })
  it("returns good colors", () => {
    expect(bloodTypeColor("good")).toContain("text-green-700")
  })
  it("defaults to gray for unknown status", () => {
    expect(bloodTypeColor("unknown")).toContain("text-gray-600")
  })
})

describe("statusPillColor", () => {
  it("maps fast_pass status to red", () => {
    expect(statusPillColor("fast_pass")).toContain("bg-red-100")
  })
  it("maps scheduled status to amber", () => {
    expect(statusPillColor("scheduled")).toContain("bg-amber-100")
  })
  it("maps completed status to green", () => {
    expect(statusPillColor("completed")).toContain("bg-green-100")
  })
  it("maps cancelled status to gray", () => {
    expect(statusPillColor("cancelled")).toContain("bg-gray-100 text-gray-500")
  })
})

describe("calculateTier", () => {
  it("returns Iron for 0 points", () => {
    expect(calculateTier(0)).toBe("Iron")
  })
  it("returns Bronze for 100 points", () => {
    expect(calculateTier(100)).toBe("Bronze")
  })
  it("returns Silver for 500 points", () => {
    expect(calculateTier(500)).toBe("Silver")
  })
  it("returns Gold for 1500 points", () => {
    expect(calculateTier(1500)).toBe("Gold")
  })
  it("returns Platinum for 3000 points", () => {
    expect(calculateTier(3000)).toBe("Platinum")
  })
  it("returns Diamond for 5000 points", () => {
    expect(calculateTier(5000)).toBe("Diamond")
  })
  it("returns Diamond for points above max tier", () => {
    expect(calculateTier(9999)).toBe("Diamond")
  })
})

describe("getTierIndex", () => {
  it("returns index for each tier threshold", () => {
    expect(getTierIndex(0)).toBe(0)
    expect(getTierIndex(100)).toBe(1)
    expect(getTierIndex(500)).toBe(2)
    expect(getTierIndex(1500)).toBe(3)
    expect(getTierIndex(3000)).toBe(4)
    expect(getTierIndex(5000)).toBe(5)
  })
})

describe("pointsToNextTier", () => {
  it("returns points needed to reach next tier", () => {
    expect(pointsToNextTier(0)).toBe(100)
    expect(pointsToNextTier(50)).toBe(50)
    expect(pointsToNextTier(100)).toBe(400)
  })
  it("returns 0 at max tier", () => {
    expect(pointsToNextTier(5000)).toBe(0)
    expect(pointsToNextTier(9999)).toBe(0)
  })
})

describe("getTierBenefits", () => {
  it("returns Diamond benefits", () => {
    expect(getTierBenefits("Diamond")).toContain("Priority booking")
  })
  it("returns default for unknown tier", () => {
    expect(getTierBenefits("Unknown")).toBe("Basic donor benefits")
  })
})

describe("getTierColor", () => {
  it("returns hex color for existing tier", () => {
    expect(getTierColor("Gold")).toBe("#a16207")
  })
  it("returns fallback for unknown tier", () => {
    expect(getTierColor("Unknown")).toBe("#6b7280")
  })
})

describe("getTierIndicator", () => {
  it("returns indicator class for existing tier", () => {
    expect(getTierIndicator("Diamond")).toBe("bg-indigo-500")
  })
})

describe("getTierGradient", () => {
  it("returns gradient string for existing tier", () => {
    expect(getTierGradient("Silver")).toContain("linear-gradient")
  })
})

describe("getTierBg", () => {
  it("returns bg color for existing tier", () => {
    expect(getTierBg("Bronze")).toBe("#fef3c7")
  })
})

describe("getNextTierName", () => {
  it("returns next tier name", () => {
    expect(getNextTierName(0)).toBe("Bronze")
    expect(getNextTierName(200)).toBe("Silver")
  })
  it("returns null at max tier", () => {
    expect(getNextTierName(5000)).toBeNull()
  })
})

describe("calculateTierProgress", () => {
  it("returns 0 at bottom of a tier", () => {
    expect(calculateTierProgress(0)).toBe(0)
  })
  it("returns 100 at or above next tier", () => {
    expect(calculateTierProgress(5000)).toBe(100)
  })
  it("returns partial progress within a tier", () => {
    const progress = calculateTierProgress(250)
    expect(progress).toBeGreaterThan(0)
    expect(progress).toBeLessThan(100)
  })
})

describe("getDisplayTier", () => {
  it("uses tier from profile if set", () => {
    expect(getDisplayTier({ tier: "Gold", points: 50 })).toBe("Gold")
  })
  it("calculates from points if no tier", () => {
    expect(getDisplayTier({ tier: null, points: 500 })).toBe("Silver")
  })
  it("uses lifetime_points over points", () => {
    expect(getDisplayTier({ tier: null, points: 50, lifetime_points: 1500 })).toBe("Gold")
  })
})

describe("getTierPoints", () => {
  it("uses lifetime_points when available", () => {
    expect(getTierPoints({ lifetime_points: 3000, points: 100 })).toBe(3000)
  })
  it("falls back to points", () => {
    expect(getTierPoints({ points: 200 })).toBe(200)
  })
})
