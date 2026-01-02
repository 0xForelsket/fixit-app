import { Button } from "@/components/ui/button";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, mock } from "bun:test";

describe("Button", () => {
  it("renders with default props", () => {
    render(<Button>Click me</Button>);

    expect(
      screen.getByRole("button", { name: /click me/i })
    ).toBeInTheDocument();
  });

  it("renders as a button element by default", () => {
    render(<Button>Test</Button>);

    const button = screen.getByRole("button");
    expect(button.tagName).toBe("BUTTON");
  });

  it("handles click events", async () => {
    const handleClick = mock(() => {});
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click me</Button>);

    await user.click(screen.getByRole("button"));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("can be disabled", async () => {
    const handleClick = mock(() => {});
    const user = userEvent.setup();

    render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>
    );

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();

    await user.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("applies variant classes correctly", () => {
    const { rerender } = render(<Button variant="default">Default</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-primary");

    rerender(<Button variant="destructive">Destructive</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-danger-600");

    rerender(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole("button")).toHaveClass("border-2");

    rerender(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole("button")).toHaveClass("hover:bg-muted");
  });

  it("applies size classes correctly", () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByRole("button")).toHaveClass("h-9");

    rerender(<Button size="default">Default</Button>);
    expect(screen.getByRole("button")).toHaveClass("h-11");

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole("button")).toHaveClass("h-12");

    rerender(<Button size="icon">Icon</Button>);
    expect(screen.getByRole("button")).toHaveClass("h-10");
  });

  it("merges custom className", () => {
    render(<Button className="custom-class">Custom</Button>);

    expect(screen.getByRole("button")).toHaveClass("custom-class");
  });

  it("renders children correctly", () => {
    render(
      <Button>
        <span data-testid="icon">🔥</span>
        Button Text
      </Button>
    );

    expect(screen.getByTestId("icon")).toBeInTheDocument();
    expect(screen.getByText("Button Text")).toBeInTheDocument();
  });

  it("passes through additional props", () => {
    render(
      <Button type="submit" data-testid="submit-btn">
        Submit
      </Button>
    );

    const button = screen.getByTestId("submit-btn");
    expect(button).toHaveAttribute("type", "submit");
  });
});
