import { describe, it, expect } from "vitest"
import {
  computeCapacityPct, computeStatus, enrichInventory, computeFromUnits, padBloodTypes,
} from "../inventory"

describe("computeCapacityPct", () => {
  it("returns 0 for 0 units", () => {
    expect(computeCapacityPct(0)).toBe(0)
  })
  it("returns 100 for max units", () => {
    expect(computeCapacityPct(800)).toBe(100)
  })
  it("calculates percentage correctly", () => {
    expect(computeCapacityPct(400)).toBe(50)
    expect(computeCapacityPct(200)).toBe(25)
    expect(computeCapacityPct(600)).toBe(75)
  })
  it("clamps to 0 for negative values", () => {
    expect(computeCapacityPct(-10)).toBe(0)
  })
  it("uses custom max", () => {
    expect(computeCapacityPct(50, 100)).toBe(50)
  })
  it("handles NaN gracefully", () => {
    expect(computeCapacityPct(NaN)).toBe(0)
  })
})

describe("computeStatus", () => {
  it("returns critical below 20", () => {
    expect(computeStatus(0)).toBe("critical")
    expect(computeStatus(19)).toBe("critical")
  })
  it("returns low between 20 and 39", () => {
    expect(computeStatus(20)).toBe("low")
    expect(computeStatus(39)).toBe("low")
  })
  it("returns moderate between 40 and 70", () => {
    expect(computeStatus(40)).toBe("moderate")
    expect(computeStatus(55)).toBe("moderate")
    expect(computeStatus(70)).toBe("moderate")
  })
  it("returns healthy above 70", () => {
    expect(computeStatus(71)).toBe("healthy")
    expect(computeStatus(100)).toBe("healthy")
  })
})

describe("computeFromUnits", () => {
  it("returns capacity_pct and status", () => {
    const result = computeFromUnits(100)
    expect(result.capacity_pct).toBe(13)
    expect(result.status).toBe("critical")
  })
})

describe("enrichInventory", () => {
  it("adds capacity_pct and status to each item", () => {
    const items = [{ blood_type: "O+", units: 400 }]
    const result = enrichInventory(items)
    expect(result[0]).toMatchObject({
      blood_type: "O+",
      units: 400,
      capacity_pct: 50,
      status: "moderate",
    })
  })
})

describe("padBloodTypes", () => {
  it("returns all 8 blood types", () => {
    const result = padBloodTypes([])
    expect(result).toHaveLength(8)
    expect(result.map((r) => r.blood_type)).toEqual([
      "O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+",
    ])
  })

  it("fills 0 units for missing types", () => {
    const result = padBloodTypes([{ blood_type: "O+", units: 200 }])
    const oNeg = result.find((r) => r.blood_type === "O-")
    expect(oNeg!.units).toBe(0)
    expect(oNeg!.capacity_pct).toBe(0)
  })

  it("preserves existing data", () => {
    const result = padBloodTypes([{ blood_type: "A+", units: 600 }])
    const aPos = result.find((r) => r.blood_type === "A+")
    expect(aPos!.units).toBe(600)
    expect(aPos!.capacity_pct).toBe(75)
    expect(aPos!.status).toBe("healthy")
  })
})
