import { describe, it, expect } from "vitest"
import { cn } from "../cn"

describe("cn", () => {
  it("joins truthy class names", () => {
    expect(cn("a", "b", "c")).toBe("a b c")
  })

  it("filters out falsy values", () => {
    expect(cn("a", false, undefined, null, "b")).toBe("a b")
  })

  it("returns empty string for all falsy", () => {
    expect(cn(false, undefined, null)).toBe("")
  })

  it("returns empty string for no args", () => {
    expect(cn()).toBe("")
  })

  it("handles single string", () => {
    expect(cn("only-one")).toBe("only-one")
  })
})
