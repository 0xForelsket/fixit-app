import { Input } from "@/components/ui/input";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

describe("Input", () => {
  it("renders as an input element", () => {
    render(<Input />);

    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("renders with placeholder", () => {
    render(<Input placeholder="Enter text" />);

    expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
  });

  describe("Input Types", () => {
    it("renders without type attribute by default", () => {
      render(<Input data-testid="input" />);

      // Input component passes type through, no default value set
      expect(screen.getByTestId("input")).not.toHaveAttribute("type");
    });

    it("renders with explicit text type", () => {
      render(<Input type="text" data-testid="input" />);

      expect(screen.getByTestId("input")).toHaveAttribute("type", "text");
    });

    it("renders password input", () => {
      render(<Input type="password" data-testid="password" />);

      expect(screen.getByTestId("password")).toHaveAttribute(
        "type",
        "password"
      );
    });

    it("renders email input", () => {
      render(<Input type="email" data-testid="email" />);

      expect(screen.getByTestId("email")).toHaveAttribute("type", "email");
    });

    it("renders number input", () => {
      render(<Input type="number" data-testid="number" />);

      expect(screen.getByTestId("number")).toHaveAttribute("type", "number");
    });

    it("renders search input", () => {
      render(<Input type="search" data-testid="search" />);

      expect(screen.getByTestId("search")).toHaveAttribute("type", "search");
    });
  });

  describe("User Interaction", () => {
    it("handles typing", async () => {
      const user = userEvent.setup();
      render(<Input />);

      const input = screen.getByRole("textbox");
      await user.type(input, "Hello World");

      expect(input).toHaveValue("Hello World");
    });

    it("handles onChange events", async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      render(<Input onChange={handleChange} />);

      const input = screen.getByRole("textbox");
      await user.type(input, "a");

      expect(handleChange).toHaveBeenCalled();
    });

    it("handles onFocus events", async () => {
      const handleFocus = vi.fn();
      const user = userEvent.setup();
      render(<Input onFocus={handleFocus} />);

      const input = screen.getByRole("textbox");
      await user.click(input);

      expect(handleFocus).toHaveBeenCalled();
    });

    it("handles onBlur events", async () => {
      const handleBlur = vi.fn();
      const user = userEvent.setup();
      render(<Input onBlur={handleBlur} />);

      const input = screen.getByRole("textbox");
      await user.click(input);
      await user.tab();

      expect(handleBlur).toHaveBeenCalled();
    });
  });

  describe("Disabled State", () => {
    it("can be disabled", () => {
      render(<Input disabled />);

      expect(screen.getByRole("textbox")).toBeDisabled();
    });

    it("prevents typing when disabled", async () => {
      const user = userEvent.setup();
      render(<Input disabled />);

      const input = screen.getByRole("textbox");
      await user.type(input, "test");

      expect(input).toHaveValue("");
    });

    it("applies disabled styling", () => {
      const { container } = render(<Input disabled />);

      expect(container.firstChild).toHaveClass("disabled:cursor-not-allowed");
      expect(container.firstChild).toHaveClass("disabled:opacity-50");
    });
  });

  describe("Styling", () => {
    it("applies base input styles", () => {
      const { container } = render(<Input />);

      expect(container.firstChild).toHaveClass("flex");
      expect(container.firstChild).toHaveClass("h-10");
      expect(container.firstChild).toHaveClass("w-full");
      expect(container.firstChild).toHaveClass("rounded-md");
      expect(container.firstChild).toHaveClass("border");
    });

    it("applies custom className", () => {
      const { container } = render(<Input className="custom-input" />);

      expect(container.firstChild).toHaveClass("custom-input");
    });

    it("merges custom className with default styles", () => {
      const { container } = render(<Input className="extra-class" />);

      expect(container.firstChild).toHaveClass("flex");
      expect(container.firstChild).toHaveClass("extra-class");
    });
  });

  describe("Accessibility", () => {
    it("supports aria-label", () => {
      render(<Input aria-label="Search field" />);

      expect(screen.getByRole("textbox")).toHaveAttribute(
        "aria-label",
        "Search field"
      );
    });

    it("supports aria-describedby", () => {
      render(<Input aria-describedby="help-text" />);

      expect(screen.getByRole("textbox")).toHaveAttribute(
        "aria-describedby",
        "help-text"
      );
    });

    it("supports aria-invalid", () => {
      render(<Input aria-invalid="true" />);

      expect(screen.getByRole("textbox")).toHaveAttribute(
        "aria-invalid",
        "true"
      );
    });

    it("supports required attribute", () => {
      render(<Input required />);

      expect(screen.getByRole("textbox")).toBeRequired();
    });

    it("supports readonly attribute", () => {
      render(<Input readOnly />);

      expect(screen.getByRole("textbox")).toHaveAttribute("readonly");
    });
  });

  describe("Props Passthrough", () => {
    it("passes through id attribute", () => {
      render(<Input id="my-input" />);

      expect(screen.getByRole("textbox")).toHaveAttribute("id", "my-input");
    });

    it("passes through name attribute", () => {
      render(<Input name="username" />);

      expect(screen.getByRole("textbox")).toHaveAttribute("name", "username");
    });

    it("passes through maxLength attribute", () => {
      render(<Input maxLength={10} />);

      expect(screen.getByRole("textbox")).toHaveAttribute("maxLength", "10");
    });

    it("passes through autoComplete attribute", () => {
      render(<Input autoComplete="off" />);

      expect(screen.getByRole("textbox")).toHaveAttribute(
        "autoComplete",
        "off"
      );
    });

    it("supports defaultValue", () => {
      render(<Input defaultValue="initial" />);

      expect(screen.getByRole("textbox")).toHaveValue("initial");
    });

    it("supports controlled value", () => {
      render(<Input value="controlled" onChange={() => {}} />);

      expect(screen.getByRole("textbox")).toHaveValue("controlled");
    });
  });
});
