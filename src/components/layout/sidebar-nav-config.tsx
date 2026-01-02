import { PERMISSIONS, type Permission } from "@/lib/permissions";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  ClipboardList,
  Clock,
  DollarSign,
  Factory,
  FileText,
  Folder,
  Home,
  MapPin,
  MonitorCog,
  Package,
  Settings2,
  Wrench,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  permission: Permission;
  children?: NavItem[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: <Home className="h-5 w-5" />,
        permission: PERMISSIONS.TICKET_VIEW_ALL,
      },
      {
        label: "Analytics",
        href: "/analytics",
        icon: <BarChart3 className="h-5 w-5" />,
        permission: PERMISSIONS.ANALYTICS_VIEW,
        children: [
          {
            label: "Overview",
            href: "/analytics",
            icon: <BarChart3 className="h-4 w-4" />,
            permission: PERMISSIONS.ANALYTICS_VIEW,
          },
          {
            label: "Costs",
            href: "/analytics/costs",
            icon: <DollarSign className="h-4 w-4" />,
            permission: PERMISSIONS.ANALYTICS_VIEW,
          },
          {
            label: "Downtime",
            href: "/analytics/downtime",
            icon: <Clock className="h-4 w-4" />,
            permission: PERMISSIONS.ANALYTICS_VIEW,
          },
        ],
      },
      {
        label: "Reports",
        href: "/reports",
        icon: <FileText className="h-5 w-5" />,
        permission: PERMISSIONS.REPORTS_VIEW,
      },
      {
        label: "Documents",
        href: "/documents",
        icon: <Folder className="h-5 w-5" />,
        permission: PERMISSIONS.TICKET_VIEW_ALL,
      },
      {
        label: "Departments",
        href: "/departments",
        icon: <Building2 className="h-5 w-5" />,
        permission: PERMISSIONS.TICKET_VIEW_ALL,
      },
    ],
  },
  {
    label: "Maintenance",
    items: [
      {
        label: "Work Orders",
        href: "/maintenance/work-orders",
        icon: <ClipboardList className="h-5 w-5" />,
        permission: PERMISSIONS.TICKET_VIEW_ALL,
      },
      {
        label: "Schedules",
        href: "/maintenance/schedules",
        icon: <Wrench className="h-5 w-5" />,
        permission: PERMISSIONS.MAINTENANCE_VIEW,
      },
    ],
  },
  {
    label: "Asset Management",
    items: [
      {
        label: "Equipment",
        href: "/assets/equipment",
        icon: <MonitorCog className="h-5 w-5" />,
        permission: PERMISSIONS.EQUIPMENT_VIEW,
      },
      {
        label: "Locations",
        href: "/assets/locations",
        icon: <MapPin className="h-5 w-5" />,
        permission: PERMISSIONS.LOCATION_VIEW,
      },
      {
        label: "Inventory",
        href: "/assets/inventory",
        icon: <Package className="h-5 w-5" />,
        permission: PERMISSIONS.INVENTORY_VIEW,
      },
      {
        label: "Vendors",
        href: "/assets/vendors",
        icon: <Factory className="h-5 w-5" />,
        permission: PERMISSIONS.INVENTORY_VIEW,
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        label: "System",
        href: "/admin/system",
        icon: <Settings2 className="h-5 w-5" />,
        permission: PERMISSIONS.USER_VIEW,
      },
    ],
  },
];

// Quick action for reporting issues
export const reportIssueItem = {
  label: "Report Issue",
  href: "/report",
  icon: <AlertTriangle className="h-5 w-5" />,
  permission: PERMISSIONS.TICKET_CREATE,
};
