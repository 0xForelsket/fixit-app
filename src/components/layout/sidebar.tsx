"use client";

import { logout } from "@/actions/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PERMISSIONS, type Permission, hasPermission } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  BarChart3,
  ChevronsUpDown,
  ClipboardList,
  Clock,
  Cog,
  DollarSign,
  Download,
  Factory,
  FileText,
  Folder,
  Globe,
  HelpCircle,
  Home,
  Keyboard,
  LogOut,
  MapPin,
  MonitorCog,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  QrCode,
  Shield,
  Upload,
  User,
  Users,
  Wrench,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  permission: Permission;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
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
      },
      {
        label: "Cost Analytics",
        href: "/analytics/costs",
        icon: <DollarSign className="h-5 w-5" />,
        permission: PERMISSIONS.ANALYTICS_VIEW,
      },
      {
        label: "Downtime",
        href: "/analytics/downtime",
        icon: <Clock className="h-5 w-5" />,
        permission: PERMISSIONS.ANALYTICS_VIEW,
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
        permission: PERMISSIONS.TICKET_VIEW_ALL, // Using basic permission for now
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
      {
        label: "QR Codes",
        href: "/assets/qr-codes",
        icon: <QrCode className="h-5 w-5" />,
        permission: PERMISSIONS.SYSTEM_QR_CODES,
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        label: "Users",
        href: "/admin/users",
        icon: <Users className="h-5 w-5" />,
        permission: PERMISSIONS.USER_VIEW,
      },
      {
        label: "Roles",
        href: "/admin/roles",
        icon: <Shield className="h-5 w-5" />,
        permission: PERMISSIONS.SYSTEM_SETTINGS,
      },
      {
        label: "Import",
        href: "/admin/import",
        icon: <Upload className="h-5 w-5" />,
        permission: PERMISSIONS.EQUIPMENT_CREATE,
      },
      {
        label: "Settings",
        href: "/admin/settings",
        icon: <Cog className="h-5 w-5" />,
        permission: PERMISSIONS.SYSTEM_SETTINGS,
      },
    ],
  },
];

interface SidebarProps {
  user: {
    name: string;
    roleName: string;
    employeeId: string;
    permissions: string[];
  };
  avatarUrl?: string | null;
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({
  user,
  avatarUrl,
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();

  const filteredGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        hasPermission(user.permissions, item.permission)
      ),
    }))
    .filter((group) => group.items.length > 0);

  const handleNavClick = () => {
    if (onClose) {
      onClose();
    }
  };

  const canCreateTicket = hasPermission(
    user.permissions,
    PERMISSIONS.TICKET_CREATE
  );

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 lg:hidden"
          onClick={onClose}
          onKeyDown={(e) => e.key === "Escape" && onClose?.()}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[70] flex h-screen flex-col border-r border-border bg-sidebar transition-all duration-300 lg:static lg:translate-x-0 lg:shadow-none print:hidden",
          isCollapsed ? "w-16" : "w-64 overflow-hidden",
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        <div
          className={cn(
            "flex h-16 items-center border-b border-border transition-all duration-300",
            isCollapsed ? "justify-center px-0" : "justify-between px-4"
          )}
        >
          {!isCollapsed && (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 group transition-all duration-300"
              onClick={handleNavClick}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                <Wrench className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground font-serif-brand whitespace-nowrap overflow-hidden animate-in fade-in slide-in-from-left-2">
                FixIt
              </span>
            </Link>
          )}

          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isCollapsed ? "flex" : "hidden lg:flex"
            )}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav
          className={cn(
            "flex-1 p-3 custom-scrollbar",
            isCollapsed
              ? "overflow-visible"
              : "overflow-y-auto overflow-x-hidden"
          )}
        >
          <div className="space-y-6">
            {filteredGroups.map((group, groupIndex) => (
              <div key={groupIndex}>
                {group.label && !isCollapsed && (
                  <h3 className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.15em] text-foreground/40 whitespace-nowrap overflow-hidden animate-in fade-in slide-in-from-left-2">
                    {group.label}
                  </h3>
                )}
                {isCollapsed && group.label && (
                  <div className="h-px bg-border/50 mx-2 mb-4" />
                )}
                <ul className="space-y-1">
                  {group.items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/dashboard" &&
                        pathname.startsWith(item.href));

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={handleNavClick}
                          // Removed title to use custom tooltip below

                          className={cn(
                            "flex items-center rounded-xl p-2.5 text-sm font-semibold transition-all group relative",
                            isCollapsed ? "justify-center" : "gap-3 px-3",
                            isActive
                              ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
                              : "text-foreground/60 hover:bg-foreground/10 hover:text-foreground"
                          )}
                        >
                          <span
                            className={cn(
                              "shrink-0 transition-colors",
                              isActive
                                ? "text-primary"
                                : "text-foreground/40 group-hover:text-primary"
                            )}
                          >
                            {item.icon}
                          </span>
                          {!isCollapsed && (
                            <span className="whitespace-nowrap overflow-hidden animate-in fade-in slide-in-from-left-2">
                              {item.label}
                            </span>
                          )}
                          {isCollapsed && (
                            <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-zinc-900 dark:bg-zinc-800 text-white text-[11px] font-bold rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-[-4px] group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-[100] shadow-xl ring-1 ring-white/10">
                              {item.label}
                            </div>
                          )}
                          {isCollapsed && isActive && (
                            <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          {canCreateTicket && (
            <div
              className={cn(
                "mt-6 border-t border-border pt-4",
                isCollapsed && "flex justify-center"
              )}
            >
              <Link
                href="/report"
                onClick={handleNavClick}
                // title={isCollapsed ? "Report Equipment Issue" : undefined}

                className={cn(
                  "flex items-center gap-3 rounded-xl bg-primary/10 border border-primary/20 p-2.5 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors group relative",
                  isCollapsed ? "w-10 h-10 justify-center px-0 py-0" : "px-3"
                )}
              >
                <AlertTriangle className="h-5 w-5 shrink-0" />
                {!isCollapsed && (
                  <span className="whitespace-nowrap overflow-hidden animate-in fade-in slide-in-from-left-2">
                    Report Issue
                  </span>
                )}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-zinc-900 dark:bg-zinc-800 text-white text-[11px] font-bold rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-[-4px] group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-[100] shadow-xl ring-1 ring-white/10">
                    Report Issue
                  </div>
                )}
              </Link>
            </div>
          )}
        </nav>

        <div className="border-t border-border p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] lg:pb-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex w-full items-center rounded-2xl bg-muted/30 p-2 transition-all hover:bg-muted/50 border border-border group relative outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isCollapsed ? "justify-center px-2" : "gap-3 p-3"
                )}
              >
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-border bg-muted shadow-sm ring-1 ring-border group-hover:ring-primary/50 transition-all">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground bg-muted font-bold text-xs uppercase">
                      {user.name.slice(0, 2)}
                    </div>
                  )}
                </div>
                {!isCollapsed && (
                  <>
                    <div className="flex flex-1 flex-col text-left overflow-hidden animate-in fade-in slide-in-from-left-2">
                      <p className="truncate text-sm font-bold text-foreground leading-tight">
                        {user.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="flex-none rounded bg-muted px-1 py-0.5 text-[10px] font-mono font-bold uppercase tracking-tight text-muted-foreground border border-border">
                          {user.roleName}
                        </span>
                      </div>
                    </div>
                    <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground/50" />
                  </>
                )}
                {isCollapsed && (
                  <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-zinc-900 dark:bg-zinc-800 text-white text-[11px] font-bold rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-[-4px] group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-[100] shadow-xl ring-1 ring-white/10">
                    {user.name}
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56 z-[100]"
              side={isCollapsed ? "right" : "top"}
              align="end"
              sideOffset={8}
            >
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user.name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.employeeId} - {user.roleName}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="w-full cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/profile/settings"
                    className="w-full cursor-pointer"
                  >
                    <Cog className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <Globe className="mr-2 h-4 w-4" />
                  <span>Language</span>
                  <span className="ml-auto text-xs text-muted-foreground opacity-70">
                    (Coming Soon)
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/docs" className="w-full cursor-pointer">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    <span>Get help</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    document.dispatchEvent(
                      new CustomEvent("toggle-keyboard-shortcuts")
                    )
                  }
                  className="cursor-pointer"
                >
                  <Keyboard className="mr-2 h-4 w-4" />
                  <span>Keyboard Shortcuts</span>
                  <span className="ml-auto text-xs text-muted-foreground opacity-70">
                    ?
                  </span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link href="/install" className="w-full cursor-pointer">
                    <Download className="mr-2 h-4 w-4" />
                    <span>Download App</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => logout()}
                className="cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </>
  );
}
