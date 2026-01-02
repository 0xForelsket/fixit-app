import { Label } from "@/components/ui/label";
import { render } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "bun:test";

describe("Label", () => {
  it("renders children correctly", () => {
    const { getByText } = render(<Label>Username</Label>);
    expect(getByText("Username")).toBeDefined();
  });

  it("applies custom className", () => {
    const { getByText } = render(<Label className="custom-label">Label</Label>);
    expect(getByText("Label").classList.contains("custom-label")).toBe(true);
  });

  it("forwards ref correctly", () => {
    const ref = createRef<HTMLLabelElement>();
    render(<Label ref={ref}>Label</Label>);
    expect(ref.current).toBeInstanceOf(HTMLLabelElement);
  });

  it("renders as label element", () => {
    const { getByTestId } = render(<Label data-testid="label">Label</Label>);
    expect(getByTestId("label").tagName).toBe("LABEL");
  });

  it("handles htmlFor prop", () => {
    const { getByText } = render(
      <>
        <Label htmlFor="email">Email</Label>
        <input id="email" type="email" />
      </>
    );
    expect(getByText("Email").getAttribute("for")).toBe("email");
  });

  it("associates with input via htmlFor", () => {
    const { getByLabelText } = render(
      <>
        <Label htmlFor="username">Username</Label>
        <input id="username" type="text" />
      </>
    );
    // Clicking the label should focus the input
    expect(getByLabelText("Username")).toBeDefined();
  });

  it("passes through additional props", () => {
    const { getByTestId } = render(<Label data-testid="test-label">Label</Label>);
    expect(getByTestId("test-label")).toBeDefined();
  });

  it("handles id prop", () => {
    const { getByText } = render(<Label id="my-label">Label</Label>);
    expect(getByText("Label").getAttribute("id")).toBe("my-label");
  });

  it("has default styling classes", () => {
    const { getByTestId } = render(<Label data-testid="label">Label</Label>);
    const label = getByTestId("label");
    expect(label.classList.contains("text-[11px]")).toBe(true);
    expect(label.classList.contains("font-black")).toBe(true);
  });
  it("renders with complex children", () => {
    const { getByText } = render(
      <Label>
        Email <span className="required">*</span>
      </Label>
    );
    expect(getByText("Email")).toBeDefined();
    expect(getByText("*")).toBeDefined();
  });

  it("handles aria attributes", () => {
    const { getByTestId } = render(
      <Label aria-describedby="help-text" data-testid="label">
        Field
      </Label>
    );
    expect(getByTestId("label").getAttribute("aria-describedby")).toBe("help-text");
  });

  it("can wrap form controls", () => {
    const { getByTestId, getByText } = render(
      <Label>
        <span>Accept terms</span>
        <input type="checkbox" data-testid="checkbox" />
      </Label>
    );
    expect(getByTestId("checkbox")).toBeDefined();
    expect(getByText("Accept terms")).toBeDefined();
  });
});
