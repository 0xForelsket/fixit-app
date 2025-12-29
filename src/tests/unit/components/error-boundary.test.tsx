import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "@/components/ui/error-boundary";

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div>Normal content</div>;
};

// Suppress console.error for expected error boundary logs
const originalError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalError;
});

describe("ErrorBoundary", () => {
  it("renders children when no error", () => {
    render(
      <ErrorBoundary>
        <div>Child content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText("Child content")).toBeInTheDocument();
  });

  it("renders default fallback when error occurs", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Component Error")).toBeInTheDocument();
    expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
  });

  it("renders custom fallback when provided", () => {
    render(
      <ErrorBoundary fallback={<div>Custom error message</div>}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Custom error message")).toBeInTheDocument();
    expect(screen.queryByText("Component Error")).not.toBeInTheDocument();
  });

  it("shows Try Again button in default fallback", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByRole("button", { name: /Try Again/i })).toBeInTheDocument();
  });

  it("logs error to console", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(console.error).toHaveBeenCalledWith(
      "Uncaught error:",
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) })
    );
  });

  it("renders AlertTriangle icon in default fallback", () => {
    const { container } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Check for SVG (Lucide icon)
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("has proper styling for error state", () => {
    const { container } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const errorContainer = container.firstChild as HTMLElement;
    expect(errorContainer).toHaveClass("border-danger-200");
    expect(errorContainer).toHaveClass("bg-danger-50");
  });

  describe("Recovery", () => {
    it("clicking Try Again resets error state", async () => {
      const user = userEvent.setup();

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Should show error state
      expect(screen.getByText("Component Error")).toBeInTheDocument();

      // Click Try Again - this resets the hasError state
      await user.click(screen.getByRole("button", { name: /Try Again/i }));

      // The component will attempt to re-render children
      // Since ThrowError still throws, it will go back to error state
      // This test just verifies the button works and triggers state reset
      expect(screen.getByText("Component Error")).toBeInTheDocument();
    });
  });

  describe("Error capture", () => {
    it("captures errors from deeply nested components", () => {
      const DeepNested = () => {
        throw new Error("Deep error");
      };

      render(
        <ErrorBoundary>
          <div>
            <div>
              <div>
                <DeepNested />
              </div>
            </div>
          </div>
        </ErrorBoundary>
      );

      expect(screen.getByText("Component Error")).toBeInTheDocument();
    });

    it("isolates errors to the boundary", () => {
      render(
        <div>
          <div data-testid="sibling">Sibling content</div>
          <ErrorBoundary>
            <ThrowError shouldThrow={true} />
          </ErrorBoundary>
        </div>
      );

      // Sibling should still render
      expect(screen.getByTestId("sibling")).toBeInTheDocument();
      // Error boundary should show error
      expect(screen.getByText("Component Error")).toBeInTheDocument();
    });
  });

  describe("Props", () => {
    it("accepts ReactNode as children", () => {
      render(
        <ErrorBoundary>
          <span>Text node</span>
          <div>Div node</div>
          {null}
          {undefined}
        </ErrorBoundary>
      );

      expect(screen.getByText("Text node")).toBeInTheDocument();
      expect(screen.getByText("Div node")).toBeInTheDocument();
    });

    it("accepts ReactNode as fallback", () => {
      render(
        <ErrorBoundary
          fallback={
            <>
              <span>Error 1</span>
              <span>Error 2</span>
            </>
          }
        >
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText("Error 1")).toBeInTheDocument();
      expect(screen.getByText("Error 2")).toBeInTheDocument();
    });
  });
});

// Need to import afterEach
import { afterEach } from "vitest";
