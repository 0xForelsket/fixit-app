import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("Card", () => {
  it("renders children correctly", () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText("Card content")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<Card className="custom-class">Content</Card>);
    expect(screen.getByText("Content")).toHaveClass("custom-class");
  });

  it("passes through additional props", () => {
    render(<Card data-testid="test-card">Content</Card>);
    expect(screen.getByTestId("test-card")).toBeInTheDocument();
  });

  it("has default styling classes", () => {
    render(<Card data-testid="card">Content</Card>);
    const card = screen.getByTestId("card");
    expect(card).toHaveClass("rounded-xl");
    expect(card).toHaveClass("border");
  });
});

describe("CardHeader", () => {
  it("renders children correctly", () => {
    render(<CardHeader>Header content</CardHeader>);
    expect(screen.getByText("Header content")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<CardHeader className="custom-header">Header</CardHeader>);
    expect(screen.getByText("Header")).toHaveClass("custom-header");
  });

  it("has default flex styling", () => {
    render(<CardHeader data-testid="header">Header</CardHeader>);
    expect(screen.getByTestId("header")).toHaveClass("flex");
    expect(screen.getByTestId("header")).toHaveClass("flex-col");
  });
});

describe("CardTitle", () => {
  it("renders as h3 element", () => {
    render(<CardTitle>Title</CardTitle>);
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(
      "Title"
    );
  });

  it("applies custom className", () => {
    render(<CardTitle className="custom-title">Title</CardTitle>);
    expect(screen.getByText("Title")).toHaveClass("custom-title");
  });

  it("has default styling classes", () => {
    render(<CardTitle>Title</CardTitle>);
    const title = screen.getByText("Title");
    expect(title).toHaveClass("text-2xl");
    expect(title).toHaveClass("font-semibold");
  });
});

describe("CardDescription", () => {
  it("renders as paragraph element", () => {
    render(<CardDescription>Description text</CardDescription>);
    const desc = screen.getByText("Description text");
    expect(desc.tagName).toBe("P");
  });

  it("applies custom className", () => {
    render(<CardDescription className="custom-desc">Desc</CardDescription>);
    expect(screen.getByText("Desc")).toHaveClass("custom-desc");
  });

  it("has muted foreground styling", () => {
    render(<CardDescription>Description</CardDescription>);
    expect(screen.getByText("Description")).toHaveClass("text-muted-foreground");
  });
});

describe("CardContent", () => {
  it("renders children correctly", () => {
    render(<CardContent>Content area</CardContent>);
    expect(screen.getByText("Content area")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<CardContent className="custom-content">Content</CardContent>);
    expect(screen.getByText("Content")).toHaveClass("custom-content");
  });

  it("has default padding", () => {
    render(<CardContent data-testid="content">Content</CardContent>);
    expect(screen.getByTestId("content")).toHaveClass("p-6");
  });
});

describe("CardFooter", () => {
  it("renders children correctly", () => {
    render(<CardFooter>Footer content</CardFooter>);
    expect(screen.getByText("Footer content")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<CardFooter className="custom-footer">Footer</CardFooter>);
    expect(screen.getByText("Footer")).toHaveClass("custom-footer");
  });

  it("has flex items-center styling", () => {
    render(<CardFooter data-testid="footer">Footer</CardFooter>);
    const footer = screen.getByTestId("footer");
    expect(footer).toHaveClass("flex");
    expect(footer).toHaveClass("items-center");
  });
});

describe("Card composition", () => {
  it("renders a complete card with all subcomponents", () => {
    render(
      <Card data-testid="full-card">
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card description text</CardDescription>
        </CardHeader>
        <CardContent>Main content goes here</CardContent>
        <CardFooter>Footer actions</CardFooter>
      </Card>
    );

    expect(screen.getByTestId("full-card")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Card Title" })
    ).toBeInTheDocument();
    expect(screen.getByText("Card description text")).toBeInTheDocument();
    expect(screen.getByText("Main content goes here")).toBeInTheDocument();
    expect(screen.getByText("Footer actions")).toBeInTheDocument();
  });
});
