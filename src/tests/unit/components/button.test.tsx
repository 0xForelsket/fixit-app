import { Button } from "@/components/ui/button";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

describe("Button", () => {
  it("renders with default props", () => {
    const { getByRole } = render(<Button>Click me</Button>);

    expect(getByRole("button", { name: /click me/i })).toBeDefined();
  });

  it("renders as a button element by default", () => {
    const { getByRole } = render(<Button>Test</Button>);

    const button = getByRole("button");
    expect(button.tagName).toBe("BUTTON");
  });

  it("handles click events", () => {
    const handleClick = vi.fn(() => {});

    const { getByRole } = render(
      <Button onClick={handleClick}>Click me</Button>
    );

    getByRole("button").click();

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("can be disabled", () => {
    const handleClick = vi.fn(() => {});

    const { getByRole } = render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>
    );

    const button = getByRole("button");
    expect(button.hasAttribute("disabled")).toBe(true);

    // Click on disabled button shouldn't trigger handler
    button.click();
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("applies variant classes correctly", () => {
    const { container, rerender } = render(
      <Button variant="default">Default</Button>
    );
    expect(container.firstElementChild?.classList.contains("bg-primary")).toBe(
      true
    );

    rerender(<Button variant="destructive">Destructive</Button>);
    expect(
      container.firstElementChild?.classList.contains("bg-danger-600")
    ).toBe(true);

    rerender(<Button variant="outline">Outline</Button>);
    expect(container.firstElementChild?.classList.contains("border-2")).toBe(
      true
    );

    rerender(<Button variant="ghost">Ghost</Button>);
    expect(
      container.firstElementChild?.classList.contains("hover:bg-muted")
    ).toBe(true);
  });

  it("applies size classes correctly", () => {
    const { container, rerender } = render(<Button size="sm">Small</Button>);
    expect(container.firstElementChild?.classList.contains("h-9")).toBe(true);

    rerender(<Button size="default">Default</Button>);
    expect(container.firstElementChild?.classList.contains("h-11")).toBe(true);

    rerender(<Button size="lg">Large</Button>);
    expect(container.firstElementChild?.classList.contains("h-12")).toBe(true);

    rerender(<Button size="icon">Icon</Button>);
    expect(container.firstElementChild?.classList.contains("h-10")).toBe(true);
  });

  it("merges custom className", () => {
    const { container } = render(
      <Button className="custom-class">Custom</Button>
    );

    expect(
      container.firstElementChild?.classList.contains("custom-class")
    ).toBe(true);
  });

  it("renders children correctly", () => {
    const { getByTestId, getByText } = render(
      <Button>
        <span data-testid="icon">🔥</span>
        Button Text
      </Button>
    );

    expect(getByTestId("icon")).toBeDefined();
    expect(getByText("Button Text")).toBeDefined();
  });

  it("passes through additional props", () => {
    const { getByTestId } = render(
      <Button type="submit" data-testid="submit-btn">
        Submit
      </Button>
    );

    const button = getByTestId("submit-btn");
    expect(button.getAttribute("type")).toBe("submit");
  });
});
