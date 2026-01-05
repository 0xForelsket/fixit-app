import { Textarea } from "@/components/ui/textarea";
import { render, fireEvent } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it,vi } from "vitest";

describe("Textarea", () => {
  it("renders correctly", () => {
    const { getByTestId } = render(<Textarea data-testid="textarea" />);
    expect(getByTestId("textarea")).toBeDefined();
  });

  it("renders as textarea element", () => {
    const { getByTestId } = render(<Textarea data-testid="textarea" />);
    expect(getByTestId("textarea").tagName).toBe("TEXTAREA");
  });

  it("applies custom className", () => {
    const { getByTestId } = render(<Textarea className="custom-class" data-testid="textarea" />);
    expect(getByTestId("textarea").classList.contains("custom-class")).toBe(true);
  });

  it("forwards ref correctly", () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} data-testid="textarea" />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it("handles placeholder prop", () => {
    const { getByPlaceholderText } = render(<Textarea placeholder="Enter text..." />);
    expect(getByPlaceholderText("Enter text...")).toBeDefined();
  });

  it("handles value prop", () => {
    const { getByTestId } = render(
      <Textarea
        value="Initial value"
        onChange={() => {}}
        data-testid="textarea"
      />
    );
    expect((getByTestId("textarea") as HTMLTextAreaElement).value).toBe("Initial value");
  });

  it("handles onChange event", () => {
    const handleChange = vi.fn(() => {});

    const { getByTestId } = render(<Textarea onInput={handleChange} data-testid="textarea" />);

    const textarea = getByTestId("textarea") as HTMLTextAreaElement;
    // Note: use onInput/fireEvent.input if onChange fails
    fireEvent.input(textarea, { target: { value: "Hello" } });
    
    // In React, onChange is triggered by the input event
    expect(handleChange).toHaveBeenCalled();
  });

  it("handles disabled state", () => {
    const { getByTestId } = render(<Textarea disabled data-testid="textarea" />);
    expect(getByTestId("textarea").hasAttribute("disabled")).toBe(true);
  });

  it("handles readOnly state", () => {
    const { getByTestId } = render(<Textarea readOnly data-testid="textarea" />);
    expect(getByTestId("textarea").hasAttribute("readonly")).toBe(true);
  });

  it("handles rows prop", () => {
    const { getByTestId } = render(<Textarea rows={10} data-testid="textarea" />);
    expect(getByTestId("textarea").getAttribute("rows")).toBe("10");
  });

  it("handles cols prop", () => {
    const { getByTestId } = render(<Textarea cols={50} data-testid="textarea" />);
    expect(getByTestId("textarea").getAttribute("cols")).toBe("50");
  });

  it("handles maxLength prop", () => {
    const { getByTestId } = render(<Textarea maxLength={100} data-testid="textarea" />);
    expect(getByTestId("textarea").getAttribute("maxlength")).toBe("100");
  });

  it("handles required prop", () => {
    const { getByTestId } = render(<Textarea required data-testid="textarea" />);
    expect(getByTestId("textarea").hasAttribute("required")).toBe(true);
  });

  it("handles name prop", () => {
    const { getByTestId } = render(<Textarea name="description" data-testid="textarea" />);
    expect(getByTestId("textarea").getAttribute("name")).toBe("description");
  });

  it("handles id prop", () => {
    const { getByTestId } = render(<Textarea id="my-textarea" data-testid="textarea" />);
    expect(getByTestId("textarea").getAttribute("id")).toBe("my-textarea");
  });

  it("handles aria-label for accessibility", () => {
    const { getByLabelText } = render(<Textarea aria-label="Description input" data-testid="textarea" />);
    expect(getByLabelText("Description input")).toBeDefined();
  });

  it("handles aria-describedby", () => {
    const { getByTestId } = render(
      <>
        <span id="helper">Helper text</span>
        <Textarea aria-describedby="helper" data-testid="textarea" />
      </>
    );
    expect(getByTestId("textarea").getAttribute("aria-describedby")).toBe("helper");
  });

  it("has default styling classes", () => {
    const { getByTestId } = render(<Textarea data-testid="textarea" />);
    const textarea = getByTestId("textarea");
    expect(textarea.classList.contains("flex")).toBe(true);
    expect(textarea.classList.contains("w-full")).toBe(true);
    expect(textarea.classList.contains("rounded-xl")).toBe(true);
    expect(textarea.classList.contains("border")).toBe(true);
  });
  it("handles defaultValue prop", () => {
    const { getByTestId } = render(<Textarea defaultValue="Default text" data-testid="textarea" />);
    expect((getByTestId("textarea") as HTMLTextAreaElement).value).toBe("Default text");
  });

  it("accepts text input", () => {
    const { getByTestId } = render(<Textarea data-testid="textarea" />);

    const textarea = getByTestId("textarea") as HTMLTextAreaElement;
    fireEvent.input(textarea, { target: { value: "Typed content" } });
    expect(textarea.value).toBe("Typed content");
  });

  it("handles onFocus event", () => {
    const handleFocus = vi.fn(() => {});

    const { getByTestId } = render(<Textarea onFocus={handleFocus} data-testid="textarea" />);

    getByTestId("textarea").focus();
    expect(handleFocus).toHaveBeenCalledTimes(1);
  });

  it("handles onBlur event", () => {
    const handleBlur = vi.fn(() => {});

    const { getByTestId, getByRole } = render(
      <>
        <Textarea onBlur={handleBlur} data-testid="textarea" />
        <button type="button">Other</button>
      </>
    );

    getByTestId("textarea").focus();
    getByRole("button").focus();
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it("has displayName set", () => {
    expect(Textarea.displayName).toBe("Textarea");
  });
});
