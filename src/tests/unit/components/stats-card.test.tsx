import { StatsCard } from "@/components/ui/stats-card";
import { render, screen } from "@testing-library/react";
import { Activity, AlertTriangle, Clock, Inbox } from "lucide-react";
import { describe, expect, it } from "bun:test";

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
      const { container } = render(
        <StatsCard title="Test" value={10} icon={Activity} />
      );

      expect(container.firstChild).toHaveClass("bg-card");
    });

    it("applies primary variant styles", () => {
      const { container } = render(
        <StatsCard title="Test" value={10} icon={Activity} variant="primary" />
      );

      expect(container.firstChild).toHaveClass("bg-primary/10");
    });

    it("applies success variant styles", () => {
      const { container } = render(
        <StatsCard title="Test" value={10} icon={Activity} variant="success" />
      );

      expect(container.firstChild).toHaveClass("bg-success-500/15");
    });

    it("applies warning variant styles", () => {
      const { container } = render(
        <StatsCard title="Test" value={10} icon={Activity} variant="warning" />
      );

      expect(container.firstChild).toHaveClass("bg-warning-500/15");
    });

    it("applies danger variant styles", () => {
      const { container } = render(
        <StatsCard title="Test" value={10} icon={Activity} variant="danger" />
      );

      expect(container.firstChild).toHaveClass("bg-danger-500/15");
    });
  });

  describe("Active State", () => {
    it("shows active indicator when active is true", () => {
      const { container } = render(
        <StatsCard title="Test" value={10} icon={Activity} active={true} />
      );

      // Active state should have special styling
      expect(container.firstChild).toHaveClass("border-primary/40");
    });

    it("shows pulse animation when active", () => {
      const { container } = render(
        <StatsCard title="Test" value={10} icon={Activity} active={true} />
      );

      expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
    });
  });

  describe("Trend Display", () => {
    it("renders positive trend", () => {
      render(
        <StatsCard
          title="Test"
          value={10}
          icon={Activity}
          trend={{ value: 10, positive: true }}
        />
      );

      expect(screen.getByText("+10%")).toBeInTheDocument();
    });

    it("renders negative trend", () => {
      render(
        <StatsCard
          title="Test"
          value={10}
          icon={Activity}
          trend={{ value: 5, positive: false }}
        />
      );

      expect(screen.getByText("5%")).toBeInTheDocument();
    });

    it("renders trend with label", () => {
      render(
        <StatsCard
          title="Test"
          value={10}
          icon={Activity}
          trend={{ value: 10, positive: true, label: "vs last month" }}
        />
      );

      expect(screen.getByText("vs last month")).toBeInTheDocument();
    });

    it("applies correct color for positive trend", () => {
      render(
        <StatsCard
          title="Test"
          value={10}
          icon={Activity}
          trend={{ value: 10, positive: true }}
        />
      );

      expect(screen.getByText("+10%")).toHaveClass("bg-success-500/10");
    });

    it("applies correct color for negative trend", () => {
      render(
        <StatsCard
          title="Test"
          value={10}
          icon={Activity}
          trend={{ value: 10, positive: false }}
        />
      );

      expect(screen.getByText("10%")).toHaveClass("bg-destructive/10");
    });
  });

  describe("Icon Rendering", () => {
    it("renders the provided icon", () => {
      const { container } = render(
        <StatsCard {...defaultProps} icon={AlertTriangle} />
      );

      // SVG icon should be rendered
      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("uses different icons for different cards", () => {
      const { rerender, container } = render(
        <StatsCard {...defaultProps} icon={Inbox} />
      );
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
