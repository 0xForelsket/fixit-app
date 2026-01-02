import {
  Skeleton,
  SkeletonCard,
  SkeletonStatsGrid,
  SkeletonTable,
  SkeletonTicketList,
} from "@/components/ui/skeleton";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "bun:test";

describe("Skeleton", () => {
  it("renders correctly", () => {
    render(<Skeleton data-testid="skeleton" />);
    expect(screen.getByTestId("skeleton")).toBeInTheDocument();
  });

  it("has skeleton class by default", () => {
    render(<Skeleton data-testid="skeleton" />);
    expect(screen.getByTestId("skeleton")).toHaveClass("skeleton");
  });

  it("applies custom className", () => {
    render(<Skeleton className="custom-class" data-testid="skeleton" />);
    expect(screen.getByTestId("skeleton")).toHaveClass("custom-class");
  });

  it("renders as div element", () => {
    render(<Skeleton data-testid="skeleton" />);
    expect(screen.getByTestId("skeleton").tagName).toBe("DIV");
  });

  it("handles default variant", () => {
    render(<Skeleton variant="default" data-testid="skeleton" />);
    const skeleton = screen.getByTestId("skeleton");
    expect(skeleton).toHaveClass("skeleton");
    expect(skeleton).not.toHaveClass("rounded-full");
    expect(skeleton).not.toHaveClass("rounded-none");
  });

  it("handles circular variant", () => {
    render(<Skeleton variant="circular" data-testid="skeleton" />);
    expect(screen.getByTestId("skeleton")).toHaveClass("rounded-full");
  });

  it("handles rectangular variant", () => {
    render(<Skeleton variant="rectangular" data-testid="skeleton" />);
    expect(screen.getByTestId("skeleton")).toHaveClass("rounded-none");
  });

  it("passes through additional props", () => {
    render(<Skeleton aria-label="Loading..." data-testid="skeleton" />);
    expect(screen.getByTestId("skeleton")).toHaveAttribute(
      "aria-label",
      "Loading..."
    );
  });

  it("can have custom dimensions via className", () => {
    render(<Skeleton className="h-10 w-20" data-testid="skeleton" />);
    const skeleton = screen.getByTestId("skeleton");
    expect(skeleton).toHaveClass("h-10");
    expect(skeleton).toHaveClass("w-20");
  });
});

describe("SkeletonCard", () => {
  it("renders correctly", () => {
    const { container } = render(<SkeletonCard />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("contains skeleton elements", () => {
    const { container } = render(<SkeletonCard />);
    const skeletons = container.querySelectorAll(".skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("has card-like styling", () => {
    const { container } = render(<SkeletonCard />);
    expect(container.firstChild).toHaveClass("rounded-xl");
    expect(container.firstChild).toHaveClass("border");
    expect(container.firstChild).toHaveClass("bg-card");
  });
});

describe("SkeletonTicketList", () => {
  it("renders with default count of 5", () => {
    const { container } = render(<SkeletonTicketList />);
    const items = container.querySelectorAll(".rounded-xl.border.bg-card");
    expect(items.length).toBe(5);
  });

  it("renders with custom count", () => {
    const { container } = render(<SkeletonTicketList count={3} />);
    const items = container.querySelectorAll(".rounded-xl.border.bg-card");
    expect(items.length).toBe(3);
  });

  it("renders with count of 1", () => {
    const { container } = render(<SkeletonTicketList count={1} />);
    const items = container.querySelectorAll(".rounded-xl.border.bg-card");
    expect(items.length).toBe(1);
  });

  it("renders with count of 10", () => {
    const { container } = render(<SkeletonTicketList count={10} />);
    const items = container.querySelectorAll(".rounded-xl.border.bg-card");
    expect(items.length).toBe(10);
  });

  it("contains skeleton elements", () => {
    const { container } = render(<SkeletonTicketList count={2} />);
    const skeletons = container.querySelectorAll(".skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });
});

describe("SkeletonStatsGrid", () => {
  it("renders 4 stat cards", () => {
    const { container } = render(<SkeletonStatsGrid />);
    const cards = container.querySelectorAll(".rounded-xl.border.bg-card");
    expect(cards.length).toBe(4);
  });

  it("has grid layout", () => {
    const { container } = render(<SkeletonStatsGrid />);
    expect(container.firstChild).toHaveClass("grid");
    expect(container.firstChild).toHaveClass("gap-4");
  });

  it("contains skeleton elements", () => {
    const { container } = render(<SkeletonStatsGrid />);
    const skeletons = container.querySelectorAll(".skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });
});

describe("SkeletonTable", () => {
  it("renders with default rows and cols", () => {
    const { container } = render(<SkeletonTable />);
    // Default is 5 rows
    const rows = container.querySelectorAll(".divide-y > div");
    expect(rows.length).toBe(5);
  });

  it("renders with custom rows", () => {
    const { container } = render(<SkeletonTable rows={3} />);
    const rows = container.querySelectorAll(".divide-y > div");
    expect(rows.length).toBe(3);
  });

  it("renders with custom cols", () => {
    const { container } = render(<SkeletonTable cols={6} />);
    // Check header has 6 skeleton columns
    const headerSkeletons = container.querySelectorAll(
      ".bg-muted\\/50 .skeleton"
    );
    expect(headerSkeletons.length).toBe(6);
  });

  it("has table-like styling", () => {
    const { container } = render(<SkeletonTable />);
    expect(container.firstChild).toHaveClass("rounded-xl");
    expect(container.firstChild).toHaveClass("border");
    expect(container.firstChild).toHaveClass("overflow-hidden");
  });

  it("has header section", () => {
    const { container } = render(<SkeletonTable />);
    const header = container.querySelector(".bg-muted\\/50");
    expect(header).toBeInTheDocument();
  });

  it("contains skeleton elements in each row", () => {
    const { container } = render(<SkeletonTable rows={2} cols={3} />);
    const rows = container.querySelectorAll(".divide-y > div");
    for (const row of rows) {
      const skeletons = row.querySelectorAll(".skeleton");
      expect(skeletons.length).toBe(3);
    }
  });
});
