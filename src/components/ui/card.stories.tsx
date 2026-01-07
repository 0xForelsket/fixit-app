import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "./badge";
import { Button } from "./button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";

const meta: Meta<typeof Card> = {
  title: "UI/Card",
  component: Card,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic Card
export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card content with some text explaining something useful.</p>
      </CardContent>
    </Card>
  ),
};

// Card with Footer
export const WithFooter: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Create Project</CardTitle>
        <CardDescription>Deploy your new project in one-click.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Your project will be deployed to the cloud automatically with our
          managed infrastructure.
        </p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button>Deploy</Button>
      </CardFooter>
    </Card>
  ),
};

// Work Order Card Example
export const WorkOrderCard: Story = {
  render: () => (
    <Card className="w-[400px]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">WO-2024-0142</CardTitle>
          <Badge variant="warning">In Progress</Badge>
        </div>
        <CardDescription>Conveyor Belt Maintenance</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-muted-foreground">Asset:</dt>
          <dd>CONV-001</dd>
          <dt className="text-muted-foreground">Priority:</dt>
          <dd>High</dd>
          <dt className="text-muted-foreground">Assigned:</dt>
          <dd>John Smith</dd>
          <dt className="text-muted-foreground">Due:</dt>
          <dd>Jan 10, 2026</dd>
        </dl>
      </CardContent>
      <CardFooter>
        <Button className="w-full">View Details</Button>
      </CardFooter>
    </Card>
  ),
};

// Stats Card Example
export const StatsCard: Story = {
  render: () => (
    <Card className="w-[250px]">
      <CardHeader className="pb-2">
        <CardDescription>Total Work Orders</CardDescription>
        <CardTitle className="text-4xl font-bold">1,284</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">
          <span className="text-success-600 font-medium">+12.5%</span> from last
          month
        </p>
      </CardContent>
    </Card>
  ),
};

// Equipment Card Example
export const EquipmentCard: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>CNC Machine #3</CardTitle>
          <Badge variant="success">Online</Badge>
        </div>
        <CardDescription>Model: Haas VF-2SS</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Location</span>
          <span>Production Floor A</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Last Maintenance</span>
          <span>Dec 15, 2025</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Operating Hours</span>
          <span>4,235 hrs</span>
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button variant="outline" className="flex-1">
          Schedule PM
        </Button>
        <Button className="flex-1">Create WO</Button>
      </CardFooter>
    </Card>
  ),
};

// Simple Card without Header
export const SimpleContent: Story = {
  render: () => (
    <Card className="w-[300px]">
      <CardContent className="pt-6">
        <p className="text-center text-muted-foreground">
          A simple card with just content, no header or footer.
        </p>
      </CardContent>
    </Card>
  ),
};
