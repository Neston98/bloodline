import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { Button } from "../button"

describe("Button", () => {
  it("renders children text", () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText("Click me")).toBeInTheDocument()
  })

  it("fires onClick handler", () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click me</Button>)
    fireEvent.click(screen.getByText("Click me"))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it("applies default variant classes", () => {
    render(<Button>Default</Button>)
    const el = screen.getByText("Default")
    expect(el.className).toContain("bg-red-600")
    expect(el.className).toContain("text-white")
  })

  it("applies outline variant classes", () => {
    render(<Button variant="outline">Outline</Button>)
    const el = screen.getByText("Outline")
    expect(el.className).toContain("border")
    expect(el.className).toContain("border-gray-300")
  })

  it("applies ghost variant classes", () => {
    render(<Button variant="ghost">Ghost</Button>)
    const el = screen.getByText("Ghost")
    expect(el.className).toContain("hover:bg-gray-100")
  })

  it("applies sm size", () => {
    render(<Button size="sm">Small</Button>)
    expect(screen.getByText("Small").className).toContain("h-8")
  })

  it("applies lg size", () => {
    render(<Button size="lg">Large</Button>)
    expect(screen.getByText("Large").className).toContain("h-12")
  })

  it("is disabled when disabled prop is set", () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByText("Disabled")).toBeDisabled()
  })

  it("merges custom className", () => {
    render(<Button className="my-class">Custom</Button>)
    expect(screen.getByText("Custom").className).toContain("my-class")
  })
})
