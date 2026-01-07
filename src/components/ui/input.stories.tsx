import type { Meta, StoryObj } from "@storybook/react";
import { Lock, Mail, Search } from "lucide-react";
import { Input } from "./input";
import { Label } from "./label";

const meta: Meta<typeof Input> = {
  title: "UI/Input",
  component: Input,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "industrial"],
    },
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "search", "tel", "url"],
    },
    disabled: {
      control: "boolean",
    },
    placeholder: {
      control: "text",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic Inputs
export const Default: Story = {
  args: {
    placeholder: "Enter text...",
    variant: "default",
  },
  decorators: [
    (Story) => (
      <div className="w-[300px]">
        <Story />
      </div>
    ),
  ],
};

export const Industrial: Story = {
  args: {
    placeholder: "Enter text...",
    variant: "industrial",
  },
  decorators: [
    (Story) => (
      <div className="w-[300px]">
        <Story />
      </div>
    ),
  ],
};

// Types
export const Email: Story = {
  args: {
    type: "email",
    placeholder: "name@example.com",
  },
  decorators: [
    (Story) => (
      <div className="w-[300px]">
        <Story />
      </div>
    ),
  ],
};

export const Password: Story = {
  args: {
    type: "password",
    placeholder: "Enter password",
  },
  decorators: [
    (Story) => (
      <div className="w-[300px]">
        <Story />
      </div>
    ),
  ],
};

export const NumberInput: Story = {
  args: {
    type: "number",
    placeholder: "0",
  },
  decorators: [
    (Story) => (
      <div className="w-[300px]">
        <Story />
      </div>
    ),
  ],
};

// States
export const Disabled: Story = {
  args: {
    placeholder: "Disabled input",
    disabled: true,
  },
  decorators: [
    (Story) => (
      <div className="w-[300px]">
        <Story />
      </div>
    ),
  ],
};

export const WithValue: Story = {
  args: {
    defaultValue: "John Doe",
  },
  decorators: [
    (Story) => (
      <div className="w-[300px]">
        <Story />
      </div>
    ),
  ],
};

// With Label
export const WithLabel: Story = {
  render: () => (
    <div className="w-[300px] space-y-2">
      <Label htmlFor="email">Email Address</Label>
      <Input id="email" type="email" placeholder="name@example.com" />
    </div>
  ),
};

// With Icon (using wrapper)
export const SearchInput: Story = {
  render: () => (
    <div className="w-[300px] relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input className="pl-10" placeholder="Search..." />
    </div>
  ),
};

// Form Field Examples
export const LoginForm: Story = {
  render: () => (
    <div className="w-[350px] space-y-4">
      <div className="space-y-2">
        <Label htmlFor="login-email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="login-email"
            type="email"
            className="pl-10"
            placeholder="name@example.com"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="login-password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="login-password"
            type="password"
            className="pl-10"
            placeholder="Enter password"
          />
        </div>
      </div>
    </div>
  ),
};

// Equipment Search Example
export const EquipmentSearch: Story = {
  render: () => (
    <div className="w-[400px] space-y-4 p-4 bg-card rounded-xl border">
      <div className="space-y-2">
        <Label htmlFor="equipment-code">Equipment Code</Label>
        <Input
          id="equipment-code"
          variant="industrial"
          placeholder="e.g., PUMP-001"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="serial">Serial Number</Label>
        <Input
          id="serial"
          variant="industrial"
          placeholder="Enter serial number"
        />
      </div>
    </div>
  ),
};

// All Variants Comparison
export const VariantComparison: Story = {
  render: () => (
    <div className="w-[350px] space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-medium">Default Variant</p>
        <Input variant="default" placeholder="Default style input" />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium">Industrial Variant</p>
        <Input variant="industrial" placeholder="Industrial style input" />
      </div>
    </div>
  ),
};
