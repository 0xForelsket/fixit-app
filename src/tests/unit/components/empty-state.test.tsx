import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AlertCircle, Inbox, Package } from "lucide-react";
import { describe, expect, it, mock } from "bun:test";

// Mock next/link
mock.module("next/link", () => ({
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
    render(<EmptyState title="No items found" />);
    expect(screen.getByText("No items found")).toBeInTheDocument();
  });

  it("renders title as heading", () => {
    render(<EmptyState title="Empty Title" />);
    expect(
      screen.getByRole("heading", { name: "Empty Title" })
    ).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(
      <EmptyState
        title="No items"
        description="Try adjusting your search criteria"
      />
    );
    expect(
      screen.getByText("Try adjusting your search criteria")
    ).toBeInTheDocument();
  });

  it("does not render description when not provided", () => {
    const { container } = render(<EmptyState title="No items" />);
    const paragraphs = container.querySelectorAll("p");
    expect(paragraphs.length).toBe(0);
  });

  it("uses default Search icon when none provided", () => {
    const { container } = render(<EmptyState title="No results" />);
    const iconContainer = container.querySelector(".h-16.w-16");
    expect(iconContainer).toBeInTheDocument();
    // Should have an SVG (the icon)
    const svg = iconContainer?.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("renders custom icon when provided", () => {
    render(<EmptyState title="No packages" icon={Package} />);
    // Icon should be rendered
    const { container } = render(<EmptyState title="Empty" icon={Inbox} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <EmptyState title="Empty" className="custom-empty-state" />
    );
    expect(container.firstChild).toHaveClass("custom-empty-state");
  });

  it("has default styling classes", () => {
    const { container } = render(<EmptyState title="Empty" />);
    expect(container.firstChild).toHaveClass("flex");
    expect(container.firstChild).toHaveClass("flex-col");
    expect(container.firstChild).toHaveClass("items-center");
    expect(container.firstChild).toHaveClass("justify-center");
  });

  it("renders children when provided", () => {
    render(
      <EmptyState title="No items">
        <button type="button">Custom action</button>
      </EmptyState>
    );
    expect(
      screen.getByRole("button", { name: "Custom action" })
    ).toBeInTheDocument();
  });

  describe("action prop", () => {
    it("renders action button with href as link", () => {
      render(
        <EmptyState
          title="No items"
          action={{ label: "Create Item", href: "/items/new" }}
        />
      );
      const link = screen.getByRole("link", { name: "Create Item" });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/items/new");
    });

    it("renders action button with onClick handler", async () => {
      const handleClick = mock();
      const user = userEvent.setup();

      render(
        <EmptyState
          title="No items"
          action={{ label: "Retry", onClick: handleClick }}
        />
      );

      const button = screen.getByRole("button", { name: "Retry" });
      expect(button).toBeInTheDocument();

      await user.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("prefers href over onClick when both provided", () => {
      const handleClick = mock();

      render(
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
      expect(screen.getByRole("link", { name: "Action" })).toBeInTheDocument();
    });
  });

  it("does not render action when not provided", () => {
    render(<EmptyState title="No items" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders with different icons", () => {
    const { rerender, container } = render(
      <EmptyState title="Alert" icon={AlertCircle} />
    );
    expect(container.querySelector("svg")).toBeInTheDocument();

    rerender(<EmptyState title="Package" icon={Package} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("combines title, description, children, and action", () => {
    const handleClick = mock();

    render(
      <EmptyState
        title="No work orders"
        description="Get started by creating your first work order"
        action={{ label: "Create Work Order", onClick: handleClick }}
      >
        <p>Additional help text</p>
      </EmptyState>
    );

    expect(screen.getByText("No work orders")).toBeInTheDocument();
    expect(
      screen.getByText("Get started by creating your first work order")
    ).toBeInTheDocument();
    expect(screen.getByText("Additional help text")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create Work Order" })
    ).toBeInTheDocument();
  });
});
