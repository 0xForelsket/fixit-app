import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatsCard } from "@/components/ui/stats-card";
import { AlertTriangle, Clock, Inbox } from "lucide-react";

describe("StatsCard", () => {
  const defaultProps = {
    title: "Open Tickets",
    value: 42,
    icon: Inbox,
  };

  it("renders title and value", () => {
    render(<StatsCard {...defaultProps} />);

    expect(screen.getByText("Open Tickets")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("formats numeric values with locale", () => {
    render(<StatsCard {...defaultProps} value={1234567} />);

    // Should format with commas (or locale-specific separator)
    expect(screen.getByText("1,234,567")).toBeInTheDocument();
  });

  it("handles string values", () => {
    render(<StatsCard {...defaultProps} value="N/A" />);

    expect(screen.getByText("N/A")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(<StatsCard {...defaultProps} description="last 24 hours" />);

    expect(screen.getByText("last 24 hours")).toBeInTheDocument();
  });

  it("renders as a link when href is provided", () => {
    render(<StatsCard {...defaultProps} href="/tickets" />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/tickets");
  });

  it("renders as a div when no href is provided", () => {
    render(<StatsCard {...defaultProps} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  describe("Variants", () => {
    it("applies default variant styles", () => {
      const { container } = render(<StatsCard {...defaultProps} variant="default" />);

      expect(container.firstChild).toHaveClass("bg-white");
    });

    it("applies primary variant styles", () => {
      const { container } = render(<StatsCard {...defaultProps} variant="primary" />);

      expect(container.firstChild).toHaveClass("bg-primary-50/50");
    });

    it("applies success variant styles", () => {
      const { container } = render(<StatsCard {...defaultProps} variant="success" />);

      expect(container.firstChild).toHaveClass("bg-success-50/50");
    });

    it("applies warning variant styles", () => {
      const { container } = render(<StatsCard {...defaultProps} variant="warning" />);

      expect(container.firstChild).toHaveClass("bg-warning-50/50");
    });

    it("applies danger variant styles", () => {
      const { container } = render(<StatsCard {...defaultProps} variant="danger" />);

      expect(container.firstChild).toHaveClass("bg-danger-50/50");
    });
  });

  describe("Active State", () => {
    it("shows active indicator when active is true", () => {
      const { container } = render(<StatsCard {...defaultProps} active />);

      // Active state should have special styling
      expect(container.firstChild).toHaveClass("border-primary-400");
    });

    it("shows pulse animation when active", () => {
      const { container } = render(<StatsCard {...defaultProps} active />);

      expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
    });
  });

  describe("Trend Display", () => {
    it("renders positive trend", () => {
      render(
        <StatsCard
          {...defaultProps}
          trend={{ value: 15, positive: true }}
        />
      );

      expect(screen.getByText("+15%")).toBeInTheDocument();
    });

    it("renders negative trend", () => {
      render(
        <StatsCard
          {...defaultProps}
          trend={{ value: 10, positive: false }}
        />
      );

      expect(screen.getByText("10%")).toBeInTheDocument();
    });

    it("renders trend with label", () => {
      render(
        <StatsCard
          {...defaultProps}
          trend={{ value: 5, positive: true, label: "vs last week" }}
        />
      );

      expect(screen.getByText("vs last week")).toBeInTheDocument();
    });

    it("applies correct color for positive trend", () => {
      const { container } = render(
        <StatsCard
          {...defaultProps}
          trend={{ value: 10, positive: true }}
        />
      );

      expect(container.querySelector(".bg-success-100")).toBeInTheDocument();
    });

    it("applies correct color for negative trend", () => {
      const { container } = render(
        <StatsCard
          {...defaultProps}
          trend={{ value: 10, positive: false }}
        />
      );

      expect(container.querySelector(".bg-danger-100")).toBeInTheDocument();
    });
  });

  describe("Icon Rendering", () => {
    it("renders the provided icon", () => {
      const { container } = render(<StatsCard {...defaultProps} icon={AlertTriangle} />);

      // SVG icon should be rendered
      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("uses different icons for different cards", () => {
      const { rerender, container } = render(<StatsCard {...defaultProps} icon={Inbox} />);
      expect(container.querySelector("svg")).toBeInTheDocument();

      rerender(<StatsCard {...defaultProps} icon={Clock} />);
      expect(container.querySelector("svg")).toBeInTheDocument();
    });
  });

  describe("Custom ClassName", () => {
    it("applies custom className", () => {
      const { container } = render(
        <StatsCard {...defaultProps} className="my-custom-class" />
      );

      expect(container.firstChild).toHaveClass("my-custom-class");
    });
  });
});
