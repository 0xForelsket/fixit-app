import { describe, expect, it,vi } from "vitest";
import { ReportBuilder } from "@/components/reports/builder/report-builder";
import type { WidgetConfig } from "@/components/reports/builder/types";
import { fireEvent, render, waitFor } from "@testing-library/react";

// Mock server actions
vi.mock("@/actions/reports", () => ({
  saveReportTemplate: vi.fn(),
}));

// Mock ResizeObserver
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
global.ResizeObserver = ResizeObserverMock as any;

// Mock crypto.randomUUID
const randomUUID = vi.fn(() => `uuid-${Math.random()}`);
global.crypto.randomUUID = randomUUID as any;

// Mock ResponsiveContainer from recharts
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => (
    <div className="recharts-responsive-container">{children}</div>
  ),
  BarChart: () => <div data-testid="bar-chart">BarChart</div>,
  CartesianGrid: () => <div>CartesianGrid</div>,
  XAxis: () => <div>XAxis</div>,
  YAxis: () => <div>YAxis</div>,
  Tooltip: () => <div>Tooltip</div>,
  Legend: () => <div>Legend</div>,
  Bar: () => <div>Bar</div>,
}));

// Mock hooks
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock components that are lazy loaded
vi.mock("@/components/reports/builder/widget-grid", () => ({
  WidgetGrid: ({ children }: any) => <div data-testid="widget-grid">{children}</div>,
  findNextWidgetPosition: vi.fn(() => ({ x: 0, y: 0 })),
  WIDGET_DEFAULT_SIZES: {
    stats_summary: { w: 12, h: 3 },
    bar_chart: { w: 6, h: 4 },
    pie_chart: { w: 6, h: 4 },
    data_table: { w: 12, h: 5 },
    text_block: { w: 6, h: 2 },
  },
}));

vi.mock("@/components/reports/builder/charts/bar-chart-widget", () => ({
  BarChartWidget: () => <div data-testid="bar-chart-widget" />,
}));

vi.mock("@/components/reports/builder/charts/pie-chart-widget", () => ({
  PieChartWidget: () => <div data-testid="pie-chart-widget" />,
}));

// Mock next/dynamic to be synchronous and simple in tests
vi.mock("next/dynamic", () => ({
  __esModule: true,
  default: () => {
    return (props: any) => <>{props.children}</>;
  },
}));

describe("ReportBuilder", () => {
  it("renders the initial state", () => {
    const { getByText } = render(<ReportBuilder userId="user1" />);
    expect(getByText("New Report")).toBeDefined();
    expect(getByText("Start Building Your Report")).toBeDefined();
  });

  it("renders initial widgets", () => {
    const widget: WidgetConfig = {
      id: "w1",
      type: "bar_chart",
      title: "Initial Widget",
      dataSource: "work_orders",
      layout: { id: "l1", x: 0, y: 0, w: 12, h: 4 },
    };
    const initialTemplate = {
      config: {
        title: "Test Report",
        description: "Desc",
        widgets: [widget],
      },
    };

    const { getByDisplayValue } = render(
      <ReportBuilder userId="user1" initialTemplate={initialTemplate} />
    );
    expect(getByDisplayValue("Initial Widget")).toBeDefined();
  });

  it("allows adding widgets", async () => {
    const { getByText, getByDisplayValue } = render(
      <ReportBuilder userId="user1" />
    );

    const addChartBtn = getByText("Bar Chart");
    fireEvent.click(addChartBtn);

    expect(global.crypto.randomUUID).toHaveBeenCalled();

    await waitFor(() => {
      expect(getByDisplayValue("New Widget")).toBeDefined();
      expect(getByText(/Data:/i)).toBeDefined();
    });
  });

  it("allows updating report title", () => {
    const { container, getByDisplayValue } = render(
      <ReportBuilder userId="user1" />
    );

    // Select by ID
    const titleInput = container.querySelector("#report-title");
    expect(titleInput).not.toBeNull();

    if (titleInput) {
      fireEvent.change(titleInput, { target: { value: "My Annual Report" } });
    }

    expect(getByDisplayValue("My Annual Report")).toBeDefined();
  });

  it("allows saving the report", async () => {
    const { saveReportTemplate } = await import("@/actions/reports");

    const { getByText } = render(<ReportBuilder userId="user1" />);

    const saveBtn = getByText("SAVE TEMPLATE");
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(saveReportTemplate).toHaveBeenCalled();
    });
  });
});
