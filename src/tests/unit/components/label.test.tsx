import { Label } from "@/components/ui/label";
import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "bun:test";

describe("Label", () => {
  it("renders children correctly", () => {
    render(<Label>Username</Label>);
    expect(screen.getByText("Username")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<Label className="custom-label">Label</Label>);
    expect(screen.getByText("Label")).toHaveClass("custom-label");
  });

  it("forwards ref correctly", () => {
    const ref = createRef<HTMLLabelElement>();
    render(<Label ref={ref}>Label</Label>);
    expect(ref.current).toBeInstanceOf(HTMLLabelElement);
  });

  it("renders as label element", () => {
    render(<Label data-testid="label">Label</Label>);
    expect(screen.getByTestId("label").tagName).toBe("LABEL");
  });

  it("handles htmlFor prop", () => {
    render(
      <>
        <Label htmlFor="email">Email</Label>
        <input id="email" type="email" />
      </>
    );
    expect(screen.getByText("Email")).toHaveAttribute("for", "email");
  });

  it("associates with input via htmlFor", () => {
    render(
      <>
        <Label htmlFor="username">Username</Label>
        <input id="username" type="text" />
      </>
    );
    // Clicking the label should focus the input
    expect(screen.getByLabelText("Username")).toBeInTheDocument();
  });

  it("passes through additional props", () => {
    render(<Label data-testid="test-label">Label</Label>);
    expect(screen.getByTestId("test-label")).toBeInTheDocument();
  });

  it("handles id prop", () => {
    render(<Label id="my-label">Label</Label>);
    expect(screen.getByText("Label")).toHaveAttribute("id", "my-label");
  });

  it("has default styling classes", () => {
    render(<Label data-testid="label">Label</Label>);
    const label = screen.getByTestId("label");
    expect(label).toHaveClass("text-[11px]");
    expect(label).toHaveClass("font-black");
  });
  it("renders with complex children", () => {
    render(
      <Label>
        Email <span className="required">*</span>
      </Label>
    );
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("handles aria attributes", () => {
    render(
      <Label aria-describedby="help-text" data-testid="label">
        Field
      </Label>
    );
    expect(screen.getByTestId("label")).toHaveAttribute(
      "aria-describedby",
      "help-text"
    );
  });

  it("can wrap form controls", () => {
    render(
      <Label>
        <span>Accept terms</span>
        <input type="checkbox" data-testid="checkbox" />
      </Label>
    );
    expect(screen.getByTestId("checkbox")).toBeInTheDocument();
    expect(screen.getByText("Accept terms")).toBeInTheDocument();
  });
});
