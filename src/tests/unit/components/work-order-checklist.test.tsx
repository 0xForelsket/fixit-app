import { WorkOrderChecklist } from "@/components/work-orders/work-order-checklist";
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, mock } from "vitest";

// Create mocks
const mockUpdateChecklistItem = vi.fn();
const mockToast = vi.fn();

// Mock the server action
vi.vi.fn("@/actions/workOrders", () => ({
  updateChecklistItem: mockUpdateChecklistItem,
}));

// Mock useToast
vi.vi.fn("@/components/ui/use-toast", () => ({
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
    const { getByText } = render(<WorkOrderChecklist workOrderId={"123"} items={mockItems} />);

    expect(getByText("Check oil level")).toBeDefined();
    expect(getByText("Inspect belts")).toBeDefined();
    expect(getByText("1 / 2 Steps")).toBeDefined();
  });

  it("calls updateChecklistItem when an item is toggled", async () => {
    // Mock successful response
    mockUpdateChecklistItem.mockResolvedValue({ success: true });

    const { getAllByRole } = render(<WorkOrderChecklist workOrderId={"123"} items={mockItems} />);

    const buttons = getAllByRole("button");
    // Click the first item (pending -> completed)
    fireEvent.click(buttons[0]);

    expect(mockUpdateChecklistItem).toHaveBeenCalledWith("1", "123", {
      status: "completed",
    });
  });
});
