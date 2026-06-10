import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { Badge } from "../badge"

describe("Badge", () => {
  it("renders children text", () => {
    render(<Badge>Cleared</Badge>)
    expect(screen.getByText("Cleared")).toBeInTheDocument()
  })

  it("applies default variant classes", () => {
    render(<Badge>Default</Badge>)
    const el = screen.getByText("Default")
    expect(el.className).toContain("bg-gray-100")
    expect(el.className).toContain("text-gray-900")
  })

  it("applies success variant classes", () => {
    render(<Badge variant="success">Success</Badge>)
    const el = screen.getByText("Success")
    expect(el.className).toContain("bg-green-100")
    expect(el.className).toContain("text-green-700")
  })

  it("applies warning variant classes", () => {
    render(<Badge variant="warning">Warning</Badge>)
    const el = screen.getByText("Warning")
    expect(el.className).toContain("bg-amber-100")
  })

  it("applies danger variant classes", () => {
    render(<Badge variant="danger">Danger</Badge>)
    const el = screen.getByText("Danger")
    expect(el.className).toContain("bg-red-100")
  })

  it("applies outline variant classes", () => {
    render(<Badge variant="outline">Outline</Badge>)
    const el = screen.getByText("Outline")
    expect(el.className).toContain("border")
    expect(el.className).toContain("border-gray-300")
  })

  it("merges custom className", () => {
    render(<Badge className="custom-class">Custom</Badge>)
    expect(screen.getByText("Custom").className).toContain("custom-class")
  })
})
