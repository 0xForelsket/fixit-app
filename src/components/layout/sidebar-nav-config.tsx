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
  key: string; // Translation key
  href: string;
  icon: React.ReactNode;
  permission: Permission;
  children?: NavItem[];
}

export interface NavGroup {
  key: string; // Translation key
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    key: "overview", // nav.overview
    items: [
      {
        key: "dashboard", // nav.dashboard
        href: "/dashboard",
        icon: <Home className="h-5 w-5" />,
        permission: PERMISSIONS.TICKET_VIEW_ALL,
      },
      {
        key: "analytics", // nav.analytics
        href: "/analytics",
        icon: <BarChart3 className="h-5 w-5" />,
        permission: PERMISSIONS.ANALYTICS_VIEW,
        children: [
          {
            key: "overview", // nav.overview
            href: "/analytics",
            icon: <BarChart3 className="h-4 w-4" />,
            permission: PERMISSIONS.ANALYTICS_VIEW,
          },
          {
            key: "costs", // nav.costs
            href: "/analytics/costs",
            icon: <DollarSign className="h-4 w-4" />,
            permission: PERMISSIONS.ANALYTICS_VIEW,
          },
          {
            key: "downtime", // nav.downtime
            href: "/analytics/downtime",
            icon: <Clock className="h-4 w-4" />,
            permission: PERMISSIONS.ANALYTICS_VIEW,
          },
        ],
      },
      {
        key: "reports", // nav.reports
        href: "/reports",
        icon: <FileText className="h-5 w-5" />,
        permission: PERMISSIONS.REPORTS_VIEW,
      },
      {
        key: "documents", // nav.documents
        href: "/documents",
        icon: <Folder className="h-5 w-5" />,
        permission: PERMISSIONS.TICKET_VIEW_ALL,
      },
      {
        key: "departments", // nav.departments
        href: "/departments",
        icon: <Building2 className="h-5 w-5" />,
        permission: PERMISSIONS.TICKET_VIEW_ALL,
      },
    ],
  },
  {
    key: "maintenance", // nav.maintenance
    items: [
      {
        key: "workOrders", // nav.workOrders
        href: "/maintenance/work-orders",
        icon: <ClipboardList className="h-5 w-5" />,
        permission: PERMISSIONS.TICKET_VIEW_ALL,
      },
      {
        key: "schedules", // nav.schedules
        href: "/maintenance/schedules",
        icon: <Wrench className="h-5 w-5" />,
        permission: PERMISSIONS.MAINTENANCE_VIEW,
      },
    ],
  },
  {
    key: "assetManagement", // nav.assetManagement
    items: [
      {
        key: "equipment", // nav.equipment
        href: "/assets/equipment",
        icon: <MonitorCog className="h-5 w-5" />,
        permission: PERMISSIONS.EQUIPMENT_VIEW,
      },
      {
        key: "locations", // nav.locations
        href: "/assets/locations",
        icon: <MapPin className="h-5 w-5" />,
        permission: PERMISSIONS.LOCATION_VIEW,
      },
      {
        key: "inventory", // nav.inventory
        href: "/assets/inventory",
        icon: <Package className="h-5 w-5" />,
        permission: PERMISSIONS.INVENTORY_VIEW,
      },
      {
        key: "vendors", // nav.vendors
        href: "/assets/vendors",
        icon: <Factory className="h-5 w-5" />,
        permission: PERMISSIONS.INVENTORY_VIEW,
      },
    ],
  },
  {
    key: "administration", // nav.administration
    items: [
      {
        key: "system", // nav.system
        href: "/admin/system",
        icon: <Settings2 className="h-5 w-5" />,
        permission: PERMISSIONS.USER_VIEW,
      },
    ],
  },
];

// Quick action for reporting issues
export const reportIssueItem = {
  key: "reportIssue", // nav.reportIssue
  href: "/report",
  icon: <AlertTriangle className="h-5 w-5" />,
  permission: PERMISSIONS.TICKET_CREATE,
};
