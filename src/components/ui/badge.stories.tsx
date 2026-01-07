import type { Meta, StoryObj } from "@storybook/react";
import { AlertCircle, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Badge } from "./badge";

const meta: Meta<typeof Badge> = {
  title: "UI/Badge",
  component: Badge,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "secondary",
        "destructive",
        "outline",
        "success",
        "warning",
        "danger",
        "critical",
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic Variants
export const Default: Story = {
  args: {
    children: "Default",
    variant: "default",
  },
};

export const Secondary: Story = {
  args: {
    children: "Secondary",
    variant: "secondary",
  },
};

export const Destructive: Story = {
  args: {
    children: "Destructive",
    variant: "destructive",
  },
};

export const Outline: Story = {
  args: {
    children: "Outline",
    variant: "outline",
  },
};

// Status Badges
export const Success: Story = {
  args: {
    children: "Completed",
    variant: "success",
  },
};

export const Warning: Story = {
  args: {
    children: "Pending",
    variant: "warning",
  },
};

export const Danger: Story = {
  args: {
    children: "Failed",
    variant: "danger",
  },
};

export const Critical: Story = {
  args: {
    children: "Critical",
    variant: "critical",
  },
};

// With Icons
export const SuccessWithIcon: Story = {
  render: () => (
    <Badge variant="success" className="flex items-center gap-1.5">
      <CheckCircle className="h-3 w-3" />
      Completed
    </Badge>
  ),
};

export const WarningWithIcon: Story = {
  render: () => (
    <Badge variant="warning" className="flex items-center gap-1.5">
      <Clock className="h-3 w-3" />
      In Progress
    </Badge>
  ),
};

export const DangerWithIcon: Story = {
  render: () => (
    <Badge variant="danger" className="flex items-center gap-1.5">
      <AlertTriangle className="h-3 w-3" />
      Error
    </Badge>
  ),
};

export const CriticalWithIcon: Story = {
  render: () => (
    <Badge variant="critical" className="flex items-center gap-1.5">
      <AlertCircle className="h-3 w-3" />
      Critical Alert
    </Badge>
  ),
};

// All Variants Gallery
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="danger">Danger</Badge>
      <Badge variant="critical">Critical</Badge>
    </div>
  ),
};

// Status Examples (Work Order Use Cases)
export const WorkOrderStatuses: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground w-24">Open:</span>
        <Badge variant="secondary">Open</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground w-24">In Progress:</span>
        <Badge variant="warning">In Progress</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground w-24">Completed:</span>
        <Badge variant="success">Completed</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground w-24">Overdue:</span>
        <Badge variant="danger">Overdue</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground w-24">Emergency:</span>
        <Badge variant="critical">Emergency</Badge>
      </div>
    </div>
  ),
};
