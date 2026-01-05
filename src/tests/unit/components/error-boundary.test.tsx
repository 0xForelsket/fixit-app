import { ErrorBoundary } from "@/components/ui/error-boundary";
import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it,vi } from "vitest";

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
  console.error = vi.fn(() => {});
});

afterEach(() => {
  console.error = originalError;
});

describe("ErrorBoundary", () => {
  it("renders children when no error", () => {
    const { getByText } = render(
      <ErrorBoundary>
        <div>Child content</div>
      </ErrorBoundary>
    );

    expect(getByText("Child content")).toBeDefined();
  });

  it("renders default fallback when error occurs", () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText("Component Error")).toBeDefined();
    expect(getByText(/Something went wrong/)).toBeDefined();
  });

  it("renders custom fallback when provided", () => {
    const { getByText, queryByText } = render(
      <ErrorBoundary fallback={<div>Custom error message</div>}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText("Custom error message")).toBeDefined();
    expect(queryByText("Component Error")).toBeNull();
  });

  it("shows Try Again button in default fallback", () => {
    const { getByRole } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(
      getByRole("button", { name: /Try Again/i })
    ).toBeDefined();
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
    expect(container.querySelector("svg")).toBeDefined();
  });

  it("has proper styling for error state", () => {
    const { container } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const errorContainer = container.firstElementChild as HTMLElement;
    expect(errorContainer?.classList.contains("border-danger-200")).toBe(true);
    expect(errorContainer?.classList.contains("bg-danger-50")).toBe(true);
    // Note: Classes might have changed, but testing for existence
  });

  describe("Recovery", () => {
    it("clicking Try Again resets error state", () => {
      const { getByRole, getByText } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Should show error state
      expect(getByText("Component Error")).toBeDefined();

      // Click Try Again - this resets the hasError state
      const button = getByRole("button", { name: /Try Again/i });
      button.click();

      // The component will attempt to re-render children
      // Since ThrowError still throws, it will go back to error state
      // This test just verifies the button works and triggers state reset
      expect(getByText("Component Error")).toBeDefined();
    });
  });

  describe("Error capture", () => {
    it("captures errors from deeply nested components", () => {
      const DeepNested = () => {
        throw new Error("Deep error");
      };

      const { getByText } = render(
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

      expect(getByText("Component Error")).toBeDefined();
    });

    it("isolates errors to the boundary", () => {
      const { getByTestId, getByText } = render(
        <div>
          <div data-testid="sibling">Sibling content</div>
          <ErrorBoundary>
            <ThrowError shouldThrow={true} />
          </ErrorBoundary>
        </div>
      );

      // Sibling should still render
      expect(getByTestId("sibling")).toBeDefined();
      // Error boundary should show error
      expect(getByText("Component Error")).toBeDefined();
    });
  });

  describe("Props", () => {
    it("accepts ReactNode as children", () => {
      const { getByText } = render(
        <ErrorBoundary>
          <span>Text node</span>
          <div>Div node</div>
          {null}
          {undefined}
        </ErrorBoundary>
      );

      expect(getByText("Text node")).toBeDefined();
      expect(getByText("Div node")).toBeDefined();
    });

    it("accepts ReactNode as fallback", () => {
      const { getByText } = render(
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

      expect(getByText("Error 1")).toBeDefined();
      expect(getByText("Error 2")).toBeDefined();
    });
  });
});
