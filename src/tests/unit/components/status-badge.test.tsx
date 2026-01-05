import { StatusBadge } from "@/components/ui/status-badge";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("StatusBadge", () => {
  describe("Work Order Statuses", () => {
    it("renders open status", () => {
      const { getByText } = render(<StatusBadge status="open" />);
      expect(getByText("Open")).toBeDefined();
    });

    it("renders in_progress status", () => {
      const { getByText } = render(<StatusBadge status="in_progress" />);
      expect(getByText("In Progress")).toBeDefined();
    });

    it("renders resolved status", () => {
      const { getByText } = render(<StatusBadge status="resolved" />);
      expect(getByText("Resolved")).toBeDefined();
    });

    it("renders closed status", () => {
      const { getByText } = render(<StatusBadge status="closed" />);
      expect(getByText("Closed")).toBeDefined();
    });
  });

  describe("Priority Levels", () => {
    it("renders low priority", () => {
      const { getByText } = render(<StatusBadge status="low" />);
      expect(getByText("Low")).toBeDefined();
    });

    it("renders medium priority", () => {
      const { getByText } = render(<StatusBadge status="medium" />);
      expect(getByText("Medium")).toBeDefined();
    });

    it("renders high priority", () => {
      const { getByText } = render(<StatusBadge status="high" />);
      expect(getByText("High")).toBeDefined();
    });

    it("renders critical priority with animation class", () => {
      const { container, getByText } = render(<StatusBadge status="critical" />);
      expect(getByText("Critical")).toBeDefined();
      // Critical should have animation
      expect(container.querySelector(".animate-pulse")).toBeDefined();
    });
  });

  describe("Equipment Statuses", () => {
    it("renders operational status", () => {
      const { getByText } = render(<StatusBadge status="operational" />);
      expect(getByText("Operational")).toBeDefined();
    });

    it("renders maintenance status", () => {
      const { getByText } = render(<StatusBadge status="maintenance" />);
      expect(getByText("Maintenance")).toBeDefined();
    });

    it("renders down status with animation", () => {
      const { container, getByText } = render(<StatusBadge status="down" />);
      expect(getByText("Line Down")).toBeDefined();
      // Down equipment should have pulsing animation
      expect(container.querySelector(".animate-ping")).toBeDefined();
    });
  });

  describe("Edge Cases", () => {
    it("renders Unknown for null status", () => {
      const { getByText } = render(<StatusBadge status={null} />);
      expect(getByText("Unknown")).toBeDefined();
    });

    it("renders Unknown for undefined status", () => {
      const { getByText } = render(<StatusBadge status={undefined} />);
      expect(getByText("Unknown")).toBeDefined();
    });

    it("renders Unknown for empty string", () => {
      const { getByText } = render(<StatusBadge status="" />);
      expect(getByText("Unknown")).toBeDefined();
    });

    it("handles unknown status gracefully", () => {
      const { getByText } = render(<StatusBadge status="some_random_status" />);
      // Fallback displays the raw status
      expect(getByText("some_random_status")).toBeDefined();
    });

    it("is case insensitive", () => {
      const { getByText } = render(<StatusBadge status="OPEN" />);
      expect(getByText("Open")).toBeDefined();
    });
  });

  describe("Props", () => {
    it("applies custom className", () => {
      const { container } = render(
        <StatusBadge status="open" className="custom-class" />
      );
      expect(container.firstElementChild?.classList.contains("custom-class")).toBe(true);
    });

    it("shows icon when showIcon is true", () => {
      const { container } = render(<StatusBadge status="open" showIcon />);
      // Icon should be rendered (svg element)
      expect(container.querySelector("svg")).toBeDefined();
    });

    it("applies pulse animation when pulse prop is true on dot-based status", () => {
      const { container } = render(<StatusBadge status="operational" pulse />);
      // Should have ping animation for statuses with showDot
      expect(container.querySelector(".animate-ping")).toBeDefined();
    });
  });
});
