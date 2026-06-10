import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../card"

describe("Card", () => {
  it("renders children", () => {
    render(<Card><div data-testid="child">inside</div></Card>)
    expect(screen.getByTestId("child")).toBeInTheDocument()
  })

  it("applies default classes", () => {
    const { container } = render(<Card>content</Card>)
    expect(container.firstChild).toBeDefined()
  })
})

describe("CardHeader", () => {
  it("renders children", () => {
    render(<CardHeader><h2>Header</h2></CardHeader>)
    expect(screen.getByText("Header")).toBeInTheDocument()
  })
})

describe("CardTitle", () => {
  it("renders the title text", () => {
    render(<CardTitle>Donation Stats</CardTitle>)
    expect(screen.getByText("Donation Stats")).toBeInTheDocument()
  })
})

describe("CardDescription", () => {
  it("renders description text", () => {
    render(<CardDescription>Your recent donations</CardDescription>)
    expect(screen.getByText("Your recent donations")).toBeInTheDocument()
  })
})

describe("CardContent", () => {
  it("renders children", () => {
    render(<CardContent><p>Content here</p></CardContent>)
    expect(screen.getByText("Content here")).toBeInTheDocument()
  })
})

describe("CardFooter", () => {
  it("renders children", () => {
    render(<CardFooter><button>Action</button></CardFooter>)
    expect(screen.getByText("Action")).toBeInTheDocument()
  })
})
