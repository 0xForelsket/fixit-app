import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("Card", () => {
  it("renders children correctly", () => {
    const { getByText } = render(<Card>Card content</Card>);
    expect(getByText("Card content")).toBeDefined();
  });

  it("applies custom className", () => {
    const { getByText } = render(<Card className="custom-class">Content</Card>);
    expect(getByText("Content").classList.contains("custom-class")).toBe(true);
  });

  it("passes through additional props", () => {
    const { getByTestId } = render(<Card data-testid="test-card">Content</Card>);
    expect(getByTestId("test-card")).toBeDefined();
  });

  it("has default styling classes", () => {
    const { getByTestId } = render(<Card data-testid="card">Content</Card>);
    const card = getByTestId("card");
    expect(card.classList.contains("rounded-xl")).toBe(true);
    expect(card.classList.contains("border")).toBe(true);
  });
});

describe("CardHeader", () => {
  it("renders children correctly", () => {
    const { getByText } = render(<CardHeader>Header content</CardHeader>);
    expect(getByText("Header content")).toBeDefined();
  });

  it("applies custom className", () => {
    const { getByText } = render(<CardHeader className="custom-header">Header</CardHeader>);
    expect(getByText("Header").classList.contains("custom-header")).toBe(true);
  });

  it("has default flex styling", () => {
    const { getByTestId } = render(<CardHeader data-testid="header">Header</CardHeader>);
    expect(getByTestId("header").classList.contains("flex")).toBe(true);
    expect(getByTestId("header").classList.contains("flex-col")).toBe(true);
  });
});

describe("CardTitle", () => {
  it("renders as h3 element", () => {
    const { getByRole } = render(<CardTitle>Title</CardTitle>);
    const title = getByRole("heading", { level: 3 });
    expect(title.textContent).toBe("Title");
  });

  it("applies custom className", () => {
    const { getByText } = render(<CardTitle className="custom-title">Title</CardTitle>);
    expect(getByText("Title").classList.contains("custom-title")).toBe(true);
  });

  it("has default styling classes", () => {
    const { getByText } = render(<CardTitle>Title</CardTitle>);
    const title = getByText("Title");
    expect(title.classList.contains("text-2xl")).toBe(true);
    expect(title.classList.contains("font-semibold")).toBe(true);
  });
});

describe("CardDescription", () => {
  it("renders as paragraph element", () => {
    const { getByText } = render(<CardDescription>Description text</CardDescription>);
    const desc = getByText("Description text");
    expect(desc.tagName).toBe("P");
  });

  it("applies custom className", () => {
    const { getByText } = render(<CardDescription className="custom-desc">Desc</CardDescription>);
    expect(getByText("Desc").classList.contains("custom-desc")).toBe(true);
  });

  it("has muted foreground styling", () => {
    const { getByText } = render(<CardDescription>Description</CardDescription>);
    expect(getByText("Description").classList.contains("text-muted-foreground")).toBe(true);
  });
});

describe("CardContent", () => {
  it("renders children correctly", () => {
    const { getByText } = render(<CardContent>Content area</CardContent>);
    expect(getByText("Content area")).toBeDefined();
  });

  it("applies custom className", () => {
    const { getByText } = render(<CardContent className="custom-content">Content</CardContent>);
    expect(getByText("Content").classList.contains("custom-content")).toBe(true);
  });

  it("has default padding", () => {
    const { getByTestId } = render(<CardContent data-testid="content">Content</CardContent>);
    expect(getByTestId("content").classList.contains("p-6")).toBe(true);
  });
});

describe("CardFooter", () => {
  it("renders children correctly", () => {
    const { getByText } = render(<CardFooter>Footer content</CardFooter>);
    expect(getByText("Footer content")).toBeDefined();
  });

  it("applies custom className", () => {
    const { getByText } = render(<CardFooter className="custom-footer">Footer</CardFooter>);
    expect(getByText("Footer").classList.contains("custom-footer")).toBe(true);
  });

  it("has flex items-center styling", () => {
    const { getByTestId } = render(<CardFooter data-testid="footer">Footer</CardFooter>);
    const footer = getByTestId("footer");
    expect(footer.classList.contains("flex")).toBe(true);
    expect(footer.classList.contains("items-center")).toBe(true);
  });
});

describe("Card composition", () => {
  it("renders a complete card with all subcomponents", () => {
    const { getByTestId, getByRole, getByText } = render(
      <Card data-testid="full-card">
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card description text</CardDescription>
        </CardHeader>
        <CardContent>Main content goes here</CardContent>
        <CardFooter>Footer actions</CardFooter>
      </Card>
    );

    expect(getByTestId("full-card")).toBeDefined();
    expect(
      getByRole("heading", { level: 3, name: "Card Title" })
    ).toBeDefined();
    expect(getByText("Card description text")).toBeDefined();
    expect(getByText("Main content goes here")).toBeDefined();
    expect(getByText("Footer actions")).toBeDefined();
  });
});
