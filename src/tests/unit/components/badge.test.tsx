import { Badge } from "@/components/ui/badge";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("Badge", () => {
  it("renders children", () => {
    const { getByText } = render(<Badge>Test Badge</Badge>);

    expect(getByText("Test Badge")).toBeDefined();
  });

  describe("Variants", () => {
    it("renders default variant", () => {
      const { container } = render(<Badge variant="default">Default</Badge>);

      expect(
        container.firstElementChild?.classList.contains("bg-primary")
      ).toBe(true);
    });

    it("renders secondary variant", () => {
      const { container } = render(
        <Badge variant="secondary">Secondary</Badge>
      );

      expect(
        container.firstElementChild?.classList.contains("bg-secondary")
      ).toBe(true);
    });

    it("renders destructive variant", () => {
      const { container } = render(
        <Badge variant="destructive">Destructive</Badge>
      );

      expect(
        container.firstElementChild?.classList.contains("bg-destructive")
      ).toBe(true);
    });

    it("renders outline variant", () => {
      const { container } = render(<Badge variant="outline">Outline</Badge>);

      expect(
        container.firstElementChild?.classList.contains("text-foreground")
      ).toBe(true);
    });

    it("renders success variant", () => {
      const { container } = render(<Badge variant="success">Success</Badge>);

      expect(
        container.firstElementChild?.classList.contains("bg-success-500/15")
      ).toBe(true);
      expect(
        container.firstElementChild?.classList.contains("text-success-700")
      ).toBe(true);
    });

    it("renders warning variant", () => {
      const { container } = render(<Badge variant="warning">Warning</Badge>);

      expect(
        container.firstElementChild?.classList.contains("bg-warning-500/15")
      ).toBe(true);
      expect(
        container.firstElementChild?.classList.contains("text-warning-700")
      ).toBe(true);
    });

    it("renders danger variant", () => {
      const { container } = render(<Badge variant="danger">Danger</Badge>);

      expect(
        container.firstElementChild?.classList.contains("bg-danger-500/15")
      ).toBe(true);
      expect(
        container.firstElementChild?.classList.contains("text-danger-700")
      ).toBe(true);
    });

    it("renders critical variant with animation", () => {
      const { container } = render(<Badge variant="critical">Critical</Badge>);

      expect(
        container.firstElementChild?.classList.contains("animate-gentle-pulse")
      ).toBe(true);
      expect(
        container.firstElementChild?.classList.contains("from-danger-500")
      ).toBe(true);
    });

    it("uses default variant when not specified", () => {
      const { container } = render(<Badge>Default</Badge>);

      expect(
        container.firstElementChild?.classList.contains("bg-primary")
      ).toBe(true);
    });
  });

  describe("Styling", () => {
    it("applies base badge styles", () => {
      const { container } = render(<Badge>Badge</Badge>);

      expect(
        container.firstElementChild?.classList.contains("inline-flex")
      ).toBe(true);
      expect(
        container.firstElementChild?.classList.contains("items-center")
      ).toBe(true);
    });

    it("applies custom className", () => {
      const { container } = render(
        <Badge className="custom-class">Badge</Badge>
      );

      expect(
        container.firstElementChild?.classList.contains("custom-class")
      ).toBe(true);
    });

    it("merges custom className with variant styles", () => {
      const { container } = render(
        <Badge variant="success" className="extra-styling">
          Merged
        </Badge>
      );

      expect(
        container.firstElementChild?.classList.contains("bg-success-500/15")
      ).toBe(true);
      expect(
        container.firstElementChild?.classList.contains("extra-styling")
      ).toBe(true);
    });
  });

  describe("Props Passthrough", () => {
    it("passes through additional HTML attributes", () => {
      const { getByTestId } = render(
        <Badge data-testid="test-badge" id="my-badge">
          Props
        </Badge>
      );

      const badge = getByTestId("test-badge");
      expect(badge.getAttribute("id")).toBe("my-badge");
    });

    it("passes through onClick handler", () => {
      const { container } = render(<Badge onClick={() => {}}>Clickable</Badge>);

      expect(container.firstChild).toBeDefined();
    });
  });
});
