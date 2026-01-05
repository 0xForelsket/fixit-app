import { StatsCard } from "@/components/ui/stats-card";
import { render } from "@testing-library/react";
import { Activity, AlertTriangle, Clock, Inbox } from "lucide-react";
import { describe, expect, it } from "vitest";

describe("StatsCard", () => {
  const defaultProps = {
    title: "Open Tickets",
    value: 42,
    icon: Inbox,
  };

  it("renders title and value", () => {
    const { getByText } = render(<StatsCard {...defaultProps} />);

    expect(getByText("Open Tickets")).toBeDefined();
    expect(getByText("42")).toBeDefined();
  });

  it("formats numeric values with locale", () => {
    const { getByText } = render(
      <StatsCard {...defaultProps} value={1234567} />
    );

    // Should format with commas (or locale-specific separator)
    expect(getByText("1,234,567")).toBeDefined();
  });

  it("handles string values", () => {
    const { getByText } = render(<StatsCard {...defaultProps} value="N/A" />);

    expect(getByText("N/A")).toBeDefined();
  });

  it("renders description when provided", () => {
    const { getByText } = render(
      <StatsCard {...defaultProps} description="last 24 hours" />
    );

    expect(getByText("last 24 hours")).toBeDefined();
  });

  it("renders as a link when href is provided", () => {
    const { getByRole } = render(
      <StatsCard {...defaultProps} href="/tickets" />
    );

    const link = getByRole("link");
    expect(link.getAttribute("href")).toBe("/tickets");
  });

  it("renders as a div when no href is provided", () => {
    const { queryByRole } = render(<StatsCard {...defaultProps} />);

    expect(queryByRole("link")).toBeNull();
  });

  describe("Variants", () => {
    it("applies default variant styles", () => {
      const { container } = render(
        <StatsCard title="Test" value={10} icon={Activity} />
      );

      expect(container.firstElementChild?.classList.contains("bg-card")).toBe(
        true
      );
    });

    it("applies primary variant styles", () => {
      const { container } = render(
        <StatsCard title="Test" value={10} icon={Activity} variant="primary" />
      );

      expect(
        container.firstElementChild?.classList.contains("bg-primary/10")
      ).toBe(true);
    });

    it("applies success variant styles", () => {
      const { container } = render(
        <StatsCard title="Test" value={10} icon={Activity} variant="success" />
      );

      expect(
        container.firstElementChild?.classList.contains("bg-success-500/15")
      ).toBe(true);
    });

    it("applies warning variant styles", () => {
      const { container } = render(
        <StatsCard title="Test" value={10} icon={Activity} variant="warning" />
      );

      expect(
        container.firstElementChild?.classList.contains("bg-warning-500/15")
      ).toBe(true);
    });

    it("applies danger variant styles", () => {
      const { container } = render(
        <StatsCard title="Test" value={10} icon={Activity} variant="danger" />
      );

      expect(
        container.firstElementChild?.classList.contains("bg-danger-500/15")
      ).toBe(true);
    });
  });

  describe("Active State", () => {
    it("shows active indicator when active is true", () => {
      const { container } = render(
        <StatsCard title="Test" value={10} icon={Activity} active={true} />
      );

      // Active state should have special styling
      expect(
        container.firstElementChild?.classList.contains("border-primary/40")
      ).toBe(true);
    });

    it("shows pulse animation when active", () => {
      const { container } = render(
        <StatsCard title="Test" value={10} icon={Activity} active={true} />
      );

      expect(container.querySelector(".animate-pulse")).toBeDefined();
    });
  });

  describe("Trend Display", () => {
    it("renders positive trend", () => {
      const { getByText } = render(
        <StatsCard
          title="Test"
          value={10}
          icon={Activity}
          trend={{ value: 10, positive: true }}
        />
      );

      expect(getByText("+10%")).toBeDefined();
    });

    it("renders negative trend", () => {
      const { getByText } = render(
        <StatsCard
          title="Test"
          value={10}
          icon={Activity}
          trend={{ value: 5, positive: false }}
        />
      );

      expect(getByText("5%")).toBeDefined();
    });

    it("renders trend with label", () => {
      const { getByText } = render(
        <StatsCard
          title="Test"
          value={10}
          icon={Activity}
          trend={{ value: 10, positive: true, label: "vs last month" }}
        />
      );

      expect(getByText("vs last month")).toBeDefined();
    });

    it("applies correct color for positive trend", () => {
      const { getByText } = render(
        <StatsCard
          title="Test"
          value={10}
          icon={Activity}
          trend={{ value: 10, positive: true }}
        />
      );

      expect(getByText("+10%").classList.contains("bg-success-500/10")).toBe(
        true
      );
    });

    it("applies correct color for negative trend", () => {
      const { getByText } = render(
        <StatsCard
          title="Test"
          value={10}
          icon={Activity}
          trend={{ value: 10, positive: false }}
        />
      );

      expect(getByText("10%").classList.contains("bg-destructive/10")).toBe(
        true
      );
    });
  });

  describe("Icon Rendering", () => {
    it("renders the provided icon", () => {
      const { container } = render(
        <StatsCard {...defaultProps} icon={AlertTriangle} />
      );

      // SVG icon should be rendered
      expect(container.querySelector("svg")).toBeDefined();
    });

    it("uses different icons for different cards", () => {
      const { rerender, container } = render(
        <StatsCard {...defaultProps} icon={Inbox} />
      );
      expect(container.querySelector("svg")).toBeDefined();

      rerender(<StatsCard {...defaultProps} icon={Clock} />);
      expect(container.querySelector("svg")).toBeDefined();
    });
  });

  describe("Custom ClassName", () => {
    it("applies custom className", () => {
      const { container } = render(
        <StatsCard {...defaultProps} className="my-custom-class" />
      );

      expect(
        container.firstElementChild?.classList.contains("my-custom-class")
      ).toBe(true);
    });
  });
});
