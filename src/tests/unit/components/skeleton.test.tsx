import {
  Skeleton,
  SkeletonCard,
  SkeletonStatsGrid,
  SkeletonTable,
  SkeletonTicketList,
} from "@/components/ui/skeleton";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("Skeleton", () => {
  it("renders correctly", () => {
    const { getByTestId } = render(<Skeleton data-testid="skeleton" />);
    expect(getByTestId("skeleton")).toBeDefined();
  });

  it("has skeleton class by default", () => {
    const { getByTestId } = render(<Skeleton data-testid="skeleton" />);
    expect(getByTestId("skeleton").classList.contains("skeleton")).toBe(true);
  });

  it("applies custom className", () => {
    const { getByTestId } = render(<Skeleton className="custom-class" data-testid="skeleton" />);
    expect(getByTestId("skeleton").classList.contains("custom-class")).toBe(true);
  });

  it("renders as div element", () => {
    const { getByTestId } = render(<Skeleton data-testid="skeleton" />);
    expect(getByTestId("skeleton").tagName).toBe("DIV");
  });

  it("handles default variant", () => {
    const { getByTestId } = render(<Skeleton variant="default" data-testid="skeleton" />);
    const skeleton = getByTestId("skeleton");
    expect(skeleton.classList.contains("skeleton")).toBe(true);
    expect(skeleton.classList.contains("rounded-full")).toBe(false);
    expect(skeleton.classList.contains("rounded-none")).toBe(false);
  });

  it("handles circular variant", () => {
    const { getByTestId } = render(<Skeleton variant="circular" data-testid="skeleton" />);
    expect(getByTestId("skeleton").classList.contains("rounded-full")).toBe(true);
  });

  it("handles rectangular variant", () => {
    const { getByTestId } = render(<Skeleton variant="rectangular" data-testid="skeleton" />);
    expect(getByTestId("skeleton").classList.contains("rounded-none")).toBe(true);
  });

  it("passes through additional props", () => {
    const { getByTestId } = render(<Skeleton aria-label="Loading..." data-testid="skeleton" />);
    expect(getByTestId("skeleton").getAttribute("aria-label")).toBe("Loading...");
  });

  it("can have custom dimensions via className", () => {
    const { getByTestId } = render(<Skeleton className="h-10 w-20" data-testid="skeleton" />);
    const skeleton = getByTestId("skeleton");
    expect(skeleton.classList.contains("h-10")).toBe(true);
    expect(skeleton.classList.contains("w-20")).toBe(true);
  });
});

describe("SkeletonCard", () => {
  it("renders correctly", () => {
    const { container } = render(<SkeletonCard />);
    expect(container.firstChild).toBeDefined();
  });

  it("contains skeleton elements", () => {
    const { container } = render(<SkeletonCard />);
    const skeletons = container.querySelectorAll(".skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("has card-like styling", () => {
    const { container } = render(<SkeletonCard />);
    expect(container.firstElementChild?.classList.contains("rounded-xl")).toBe(true);
    expect(container.firstElementChild?.classList.contains("border")).toBe(true);
    expect(container.firstElementChild?.classList.contains("bg-card")).toBe(true);
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
    expect(container.firstElementChild?.classList.contains("grid")).toBe(true);
    expect(container.firstElementChild?.classList.contains("gap-4")).toBe(true);
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
    expect(container.firstElementChild?.classList.contains("rounded-xl")).toBe(true);
    expect(container.firstElementChild?.classList.contains("border")).toBe(true);
    expect(container.firstElementChild?.classList.contains("overflow-hidden")).toBe(true);
  });

  it("has header section", () => {
    const { container } = render(<SkeletonTable />);
    const header = container.querySelector(".bg-muted\\/50");
    expect(header).toBeDefined();
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
