import { Textarea } from "@/components/ui/textarea";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, mock } from "bun:test";

describe("Textarea", () => {
  it("renders correctly", () => {
    render(<Textarea data-testid="textarea" />);
    expect(screen.getByTestId("textarea")).toBeInTheDocument();
  });

  it("renders as textarea element", () => {
    render(<Textarea data-testid="textarea" />);
    expect(screen.getByTestId("textarea").tagName).toBe("TEXTAREA");
  });

  it("applies custom className", () => {
    render(<Textarea className="custom-class" data-testid="textarea" />);
    expect(screen.getByTestId("textarea")).toHaveClass("custom-class");
  });

  it("forwards ref correctly", () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} data-testid="textarea" />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it("handles placeholder prop", () => {
    render(<Textarea placeholder="Enter text..." />);
    expect(screen.getByPlaceholderText("Enter text...")).toBeInTheDocument();
  });

  it("handles value prop", () => {
    render(
      <Textarea
        value="Initial value"
        onChange={() => {}}
        data-testid="textarea"
      />
    );
    expect(screen.getByTestId("textarea")).toHaveValue("Initial value");
  });

  it("handles onChange event", async () => {
    const handleChange = mock(() => {});
    const user = userEvent.setup();

    render(<Textarea onChange={handleChange} data-testid="textarea" />);

    await user.type(screen.getByTestId("textarea"), "Hello");
    expect(handleChange).toHaveBeenCalled();
  });

  it("handles disabled state", () => {
    render(<Textarea disabled data-testid="textarea" />);
    expect(screen.getByTestId("textarea")).toBeDisabled();
  });

  it("handles readOnly state", () => {
    render(<Textarea readOnly data-testid="textarea" />);
    expect(screen.getByTestId("textarea")).toHaveAttribute("readonly");
  });

  it("handles rows prop", () => {
    render(<Textarea rows={10} data-testid="textarea" />);
    expect(screen.getByTestId("textarea")).toHaveAttribute("rows", "10");
  });

  it("handles cols prop", () => {
    render(<Textarea cols={50} data-testid="textarea" />);
    expect(screen.getByTestId("textarea")).toHaveAttribute("cols", "50");
  });

  it("handles maxLength prop", () => {
    render(<Textarea maxLength={100} data-testid="textarea" />);
    expect(screen.getByTestId("textarea")).toHaveAttribute("maxlength", "100");
  });

  it("handles required prop", () => {
    render(<Textarea required data-testid="textarea" />);
    expect(screen.getByTestId("textarea")).toBeRequired();
  });

  it("handles name prop", () => {
    render(<Textarea name="description" data-testid="textarea" />);
    expect(screen.getByTestId("textarea")).toHaveAttribute(
      "name",
      "description"
    );
  });

  it("handles id prop", () => {
    render(<Textarea id="my-textarea" data-testid="textarea" />);
    expect(screen.getByTestId("textarea")).toHaveAttribute("id", "my-textarea");
  });

  it("handles aria-label for accessibility", () => {
    render(<Textarea aria-label="Description input" data-testid="textarea" />);
    expect(screen.getByLabelText("Description input")).toBeInTheDocument();
  });

  it("handles aria-describedby", () => {
    render(
      <>
        <span id="helper">Helper text</span>
        <Textarea aria-describedby="helper" data-testid="textarea" />
      </>
    );
    expect(screen.getByTestId("textarea")).toHaveAttribute(
      "aria-describedby",
      "helper"
    );
  });

  it("has default styling classes", () => {
    render(<Textarea data-testid="textarea" />);
    const textarea = screen.getByTestId("textarea");
    expect(textarea).toHaveClass("flex");
    expect(textarea).toHaveClass("w-full");
    expect(textarea).toHaveClass("rounded-xl");
    expect(textarea).toHaveClass("border");
  });
  it("handles defaultValue prop", () => {
    render(<Textarea defaultValue="Default text" data-testid="textarea" />);
    expect(screen.getByTestId("textarea")).toHaveValue("Default text");
  });

  it("accepts text input", async () => {
    const user = userEvent.setup();
    render(<Textarea data-testid="textarea" />);

    const textarea = screen.getByTestId("textarea");
    await user.type(textarea, "Typed content");
    expect(textarea).toHaveValue("Typed content");
  });

  it("handles onFocus event", async () => {
    const handleFocus = mock(() => {});
    const user = userEvent.setup();

    render(<Textarea onFocus={handleFocus} data-testid="textarea" />);

    await user.click(screen.getByTestId("textarea"));
    expect(handleFocus).toHaveBeenCalledTimes(1);
  });

  it("handles onBlur event", async () => {
    const handleBlur = mock(() => {});
    const user = userEvent.setup();

    render(
      <>
        <Textarea onBlur={handleBlur} data-testid="textarea" />
        <button type="button">Other</button>
      </>
    );

    await user.click(screen.getByTestId("textarea"));
    await user.click(screen.getByRole("button"));
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it("has displayName set", () => {
    expect(Textarea.displayName).toBe("Textarea");
  });
});
