import * as actions from "@/actions/workOrders";
import { WorkOrderChecklist } from "@/components/work-orders/work-order-checklist";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock the server action
vi.mock("@/actions/workOrders", () => ({
  updateChecklistItem: vi.fn(),
}));

// Mock useToast
vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const mockItems = [
  {
    id: 1,
    status: "pending" as const,
    notes: null,
    checklist: {
      stepNumber: 1,
      description: "Check oil level",
      isRequired: true,
      estimatedMinutes: 5,
    },
  },
  {
    id: 2,
    status: "completed" as const,
    notes: null,
    checklist: {
      stepNumber: 2,
      description: "Inspect belts",
      isRequired: false,
      estimatedMinutes: 10,
    },
  },
];

describe("WorkOrderChecklist", () => {
  it("renders checklist items correctly", () => {
    render(<WorkOrderChecklist workOrderId={123} items={mockItems} />);

    expect(screen.getByText("Check oil level")).toBeInTheDocument();
    expect(screen.getByText("Inspect belts")).toBeInTheDocument();
    expect(screen.getByText("1 / 2 Steps")).toBeInTheDocument();
  });

  it("calls updateChecklistItem when an item is toggled", async () => {
    // Mock successful response
    vi.mocked(actions.updateChecklistItem).mockResolvedValue({ success: true });

    render(<WorkOrderChecklist workOrderId={123} items={mockItems} />);

    const buttons = screen.getAllByRole("button");
    // Click the first item (pending -> completed)
    fireEvent.click(buttons[0]);

    expect(actions.updateChecklistItem).toHaveBeenCalledWith(1, 123, {
      status: "completed",
    });
  });
});
