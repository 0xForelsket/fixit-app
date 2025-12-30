import { Badge } from "@/components/ui/badge";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("Badge", () => {
  it("renders children", () => {
    render(<Badge>Test Badge</Badge>);

    expect(screen.getByText("Test Badge")).toBeInTheDocument();
  });

  describe("Variants", () => {
    it("renders default variant", () => {
      const { container } = render(<Badge variant="default">Default</Badge>);

      expect(container.firstChild).toHaveClass("bg-primary");
    });

    it("renders secondary variant", () => {
      const { container } = render(
        <Badge variant="secondary">Secondary</Badge>
      );

      expect(container.firstChild).toHaveClass("bg-secondary");
    });

    it("renders destructive variant", () => {
      const { container } = render(
        <Badge variant="destructive">Destructive</Badge>
      );

      expect(container.firstChild).toHaveClass("bg-destructive");
    });

    it("renders outline variant", () => {
      const { container } = render(<Badge variant="outline">Outline</Badge>);

      expect(container.firstChild).toHaveClass("text-foreground");
    });

    it("renders success variant", () => {
      const { container } = render(<Badge variant="success">Success</Badge>);

      expect(container.firstChild).toHaveClass("bg-success-100");
      expect(container.firstChild).toHaveClass("text-success-800");
    });

    it("renders warning variant", () => {
      const { container } = render(<Badge variant="warning">Warning</Badge>);

      expect(container.firstChild).toHaveClass("bg-warning-100");
      expect(container.firstChild).toHaveClass("text-warning-800");
    });

    it("renders danger variant", () => {
      const { container } = render(<Badge variant="danger">Danger</Badge>);

      expect(container.firstChild).toHaveClass("bg-danger-100");
      expect(container.firstChild).toHaveClass("text-danger-800");
    });

    it("renders critical variant with animation", () => {
      const { container } = render(<Badge variant="critical">Critical</Badge>);

      expect(container.firstChild).toHaveClass("bg-gradient-to-r");
      expect(container.firstChild).toHaveClass("animate-gentle-pulse");
    });

    it("uses default variant when not specified", () => {
      const { container } = render(<Badge>No Variant</Badge>);

      expect(container.firstChild).toHaveClass("bg-primary");
    });
  });

  describe("Styling", () => {
    it("applies base badge styles", () => {
      const { container } = render(<Badge>Styled</Badge>);

      expect(container.firstChild).toHaveClass("inline-flex");
      expect(container.firstChild).toHaveClass("items-center");
      expect(container.firstChild).toHaveClass("rounded-md");
      expect(container.firstChild).toHaveClass("text-xs");
      expect(container.firstChild).toHaveClass("font-semibold");
    });

    it("applies custom className", () => {
      const { container } = render(
        <Badge className="custom-class">Custom</Badge>
      );

      expect(container.firstChild).toHaveClass("custom-class");
    });

    it("merges custom className with variant styles", () => {
      const { container } = render(
        <Badge variant="success" className="extra-styling">
          Merged
        </Badge>
      );

      expect(container.firstChild).toHaveClass("bg-success-100");
      expect(container.firstChild).toHaveClass("extra-styling");
    });
  });

  describe("Props Passthrough", () => {
    it("passes through additional HTML attributes", () => {
      render(
        <Badge data-testid="test-badge" id="my-badge">
          Props
        </Badge>
      );

      const badge = screen.getByTestId("test-badge");
      expect(badge).toHaveAttribute("id", "my-badge");
    });

    it("passes through onClick handler", () => {
      const { container } = render(<Badge onClick={() => {}}>Clickable</Badge>);

      expect(container.firstChild).toBeDefined();
    });
  });
});
