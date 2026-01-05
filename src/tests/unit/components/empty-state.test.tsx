import { render } from "@testing-library/react";
import { AlertCircle, Inbox, Package } from "lucide-react";
import { describe, expect, it,vi } from "vitest";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

// Dynamic import after mock.module
const { EmptyState } = await import("@/components/ui/empty-state");

describe("EmptyState", () => {
  it("renders title correctly", () => {
    const { getByText } = render(<EmptyState title="No items found" />);
    expect(getByText("No items found")).toBeDefined();
  });

  it("renders title as heading", () => {
    const { getByRole } = render(<EmptyState title="Empty Title" />);
    expect(
      getByRole("heading", { name: "Empty Title" })
    ).toBeDefined();
  });

  it("renders description when provided", () => {
    const { getByText } = render(
      <EmptyState
        title="No items"
        description="Try adjusting your search criteria"
      />
    );
    expect(
      getByText("Try adjusting your search criteria")
    ).toBeDefined();
  });

  it("does not render description when not provided", () => {
    const { container } = render(<EmptyState title="No items" />);
    const paragraphs = container.querySelectorAll("p");
    expect(paragraphs.length).toBe(0);
  });

  it("uses default Search icon when none provided", () => {
    const { container } = render(<EmptyState title="No results" />);
    const iconContainer = container.querySelector(".h-16.w-16");
    expect(iconContainer).toBeDefined();
    // Should have an SVG (the icon)
    const svg = iconContainer?.querySelector("svg");
    expect(svg).toBeDefined();
  });

  it("renders custom icon when provided", () => {
    const { container: container1 } = render(<EmptyState title="No packages" icon={Package} />);
    expect(container1.querySelector("svg")).toBeDefined();
    
    const { container: container2 } = render(<EmptyState title="Empty" icon={Inbox} />);
    expect(container2.querySelector("svg")).toBeDefined();
  });

  it("applies custom className", () => {
    const { container } = render(
      <EmptyState title="Empty" className="custom-empty-state" />
    );
    expect(container.firstElementChild?.classList.contains("custom-empty-state")).toBe(true);
  });

  it("has default styling classes", () => {
    const { container } = render(<EmptyState title="Empty" />);
    expect(container.firstElementChild?.classList.contains("flex")).toBe(true);
    expect(container.firstElementChild?.classList.contains("flex-col")).toBe(true);
    expect(container.firstElementChild?.classList.contains("items-center")).toBe(true);
    expect(container.firstElementChild?.classList.contains("justify-center")).toBe(true);
  });

  it("renders children when provided", () => {
    const { getByRole } = render(
      <EmptyState title="No items">
        <button type="button">Custom action</button>
      </EmptyState>
    );
    expect(
      getByRole("button", { name: "Custom action" })
    ).toBeDefined();
  });

  describe("action prop", () => {
    it("renders action button with href as link", () => {
      const { getByRole } = render(
        <EmptyState
          title="No items"
          action={{ label: "Create Item", href: "/items/new" }}
        />
      );
      const link = getByRole("link", { name: "Create Item" });
      expect(link).toBeDefined();
      expect(link.getAttribute("href")).toBe("/items/new");
    });

    it("renders action button with onClick handler", () => {
      const handleClick = vi.fn(() => {});

      const { getByRole } = render(
        <EmptyState
          title="No items"
          action={{ label: "Retry", onClick: handleClick }}
        />
      );

      const button = getByRole("button", { name: "Retry" });
      expect(button).toBeDefined();

      button.click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("prefers href over onClick when both provided", () => {
      const handleClick = vi.fn(() => {});

      const { getByRole } = render(
        <EmptyState
          title="No items"
          action={{
            label: "Action",
            href: "/some-path",
            onClick: handleClick,
          }}
        />
      );

      // Should render as link when href is provided
      expect(getByRole("link", { name: "Action" })).toBeDefined();
    });
  });

  it("does not render action when not provided", () => {
    const { queryByRole } = render(<EmptyState title="No items" />);
    expect(queryByRole("button")).toBeNull();
    expect(queryByRole("link")).toBeNull();
  });

  it("renders with different icons", () => {
    const { rerender, container } = render(
      <EmptyState title="Alert" icon={AlertCircle} />
    );
    expect(container.querySelector("svg")).toBeDefined();

    rerender(<EmptyState title="Package" icon={Package} />);
    expect(container.querySelector("svg")).toBeDefined();
  });

  it("combines title, description, children, and action", () => {
    const handleClick = vi.fn(() => {});

    const { getByText, getByRole } = render(
      <EmptyState
        title="No work orders"
        description="Get started by creating your first work order"
        action={{ label: "Create Work Order", onClick: handleClick }}
      >
        <p>Additional help text</p>
      </EmptyState>
    );

    expect(getByText("No work orders")).toBeDefined();
    expect(
      getByText("Get started by creating your first work order")
    ).toBeDefined();
    expect(getByText("Additional help text")).toBeDefined();
    expect(
      getByRole("button", { name: "Create Work Order" })
    ).toBeDefined();
  });
});
