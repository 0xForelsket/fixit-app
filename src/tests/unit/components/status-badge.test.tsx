import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusBadge } from "@/components/ui/status-badge";

describe("StatusBadge", () => {
  describe("Work Order Statuses", () => {
    it("renders open status", () => {
      render(<StatusBadge status="open" />);
      expect(screen.getByText("Open")).toBeInTheDocument();
    });

    it("renders in_progress status", () => {
      render(<StatusBadge status="in_progress" />);
      expect(screen.getByText("In Progress")).toBeInTheDocument();
    });

    it("renders resolved status", () => {
      render(<StatusBadge status="resolved" />);
      expect(screen.getByText("Resolved")).toBeInTheDocument();
    });

    it("renders closed status", () => {
      render(<StatusBadge status="closed" />);
      expect(screen.getByText("Closed")).toBeInTheDocument();
    });
  });

  describe("Priority Levels", () => {
    it("renders low priority", () => {
      render(<StatusBadge status="low" />);
      expect(screen.getByText("Low")).toBeInTheDocument();
    });

    it("renders medium priority", () => {
      render(<StatusBadge status="medium" />);
      expect(screen.getByText("Medium")).toBeInTheDocument();
    });

    it("renders high priority", () => {
      render(<StatusBadge status="high" />);
      expect(screen.getByText("High")).toBeInTheDocument();
    });

    it("renders critical priority with animation class", () => {
      const { container } = render(<StatusBadge status="critical" />);
      expect(screen.getByText("Critical")).toBeInTheDocument();
      // Critical should have animation
      expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
    });
  });

  describe("Equipment Statuses", () => {
    it("renders operational status", () => {
      render(<StatusBadge status="operational" />);
      expect(screen.getByText("Operational")).toBeInTheDocument();
    });

    it("renders maintenance status", () => {
      render(<StatusBadge status="maintenance" />);
      expect(screen.getByText("Maintenance")).toBeInTheDocument();
    });

    it("renders down status with animation", () => {
      const { container } = render(<StatusBadge status="down" />);
      expect(screen.getByText("Line Down")).toBeInTheDocument();
      // Down equipment should have pulsing animation
      expect(container.querySelector(".animate-ping")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("renders Unknown for null status", () => {
      render(<StatusBadge status={null} />);
      expect(screen.getByText("Unknown")).toBeInTheDocument();
    });

    it("renders Unknown for undefined status", () => {
      render(<StatusBadge status={undefined} />);
      expect(screen.getByText("Unknown")).toBeInTheDocument();
    });

    it("renders Unknown for empty string", () => {
      render(<StatusBadge status="" />);
      expect(screen.getByText("Unknown")).toBeInTheDocument();
    });

    it("handles unknown status gracefully", () => {
      render(<StatusBadge status="some_random_status" />);
      // Fallback displays the raw status
      expect(screen.getByText("some_random_status")).toBeInTheDocument();
    });

    it("is case insensitive", () => {
      render(<StatusBadge status="OPEN" />);
      expect(screen.getByText("Open")).toBeInTheDocument();
    });
  });

  describe("Props", () => {
    it("applies custom className", () => {
      const { container } = render(
        <StatusBadge status="open" className="custom-class" />
      );
      expect(container.firstChild).toHaveClass("custom-class");
    });

    it("shows icon when showIcon is true", () => {
      const { container } = render(
        <StatusBadge status="open" showIcon />
      );
      // Icon should be rendered (svg element)
      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("applies pulse animation when pulse prop is true on dot-based status", () => {
      const { container } = render(
        <StatusBadge status="operational" pulse />
      );
      // Should have ping animation for statuses with showDot
      expect(container.querySelector(".animate-ping")).toBeInTheDocument();
    });
  });
});
