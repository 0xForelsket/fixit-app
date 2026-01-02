import { WorkOrderChecklist } from "@/components/work-orders/work-order-checklist";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, mock } from "bun:test";

// Create mocks
const mockUpdateChecklistItem = mock();
const mockToast = mock();

// Mock the server action
mock.module("@/actions/workOrders", () => ({
  updateChecklistItem: mockUpdateChecklistItem,
}));

// Mock useToast
mock.module("@/components/ui/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

const mockItems = [
  {
    id: "1", displayId: 1,
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
    id: "2", displayId: 2,
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
    render(<WorkOrderChecklist workOrderId={"123"} items={mockItems} />);

    expect(screen.getByText("Check oil level")).toBeInTheDocument();
    expect(screen.getByText("Inspect belts")).toBeInTheDocument();
    expect(screen.getByText("1 / 2 Steps")).toBeInTheDocument();
  });

  it("calls updateChecklistItem when an item is toggled", async () => {
    // Mock successful response
    mockUpdateChecklistItem.mockResolvedValue({ success: true });

    render(<WorkOrderChecklist workOrderId={"123"} items={mockItems} />);

    const buttons = screen.getAllByRole("button");
    // Click the first item (pending -> completed)
    fireEvent.click(buttons[0]);

    expect(mockUpdateChecklistItem).toHaveBeenCalledWith("1", "123", {
      status: "completed",
    });
  });
});
