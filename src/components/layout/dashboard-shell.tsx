"use client";

import { BottomNav } from "@/components/layout/bottom-nav";
import { GlobalSearch } from "@/components/global-search";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import type React from "react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface DashboardShellProps {
  user: {
    id: number;
    name: string;
    roleName: string;
    employeeId: string;
    permissions: string[];
  };
  avatarUrl?: string | null;
  // title prop removed
  children: React.ReactNode;
}

const getPageTitle = (pathname: string): string => {
  if (pathname === "/dashboard") return "Dashboard";
  if (pathname === "/dashboard/notifications") return "Notifications";
  if (pathname === "/analytics") return "Analytics";
  
  if (pathname.startsWith("/maintenance/work-orders")) {
    if (pathname.split("/").length > 3) return "Work Order Details";
    return "Work Orders";
  }
  if (pathname.startsWith("/maintenance/schedules")) return "Schedules";
  
  if (pathname.startsWith("/assets/equipment")) return "Equipment";
  if (pathname.startsWith("/assets/locations")) return "Locations";
  if (pathname.startsWith("/assets/inventory")) return "Inventory";
  
  if (pathname.startsWith("/admin/users")) return "User Management";
  if (pathname.startsWith("/admin/roles")) return "Role Management";
  if (pathname.startsWith("/admin/settings")) return "System Settings";
  
  if (pathname === "/design-system") return "Design System";
  
  return "FixIt CMMS";
};

export function DashboardShell({
  user,
  avatarUrl,
  children,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  // Load sidebar preference
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) {
      setSidebarCollapsed(saved === "true");
    }
  }, []);

  const toggleSidebar = () => {
    const newVal = !sidebarCollapsed;
    setSidebarCollapsed(newVal);
    localStorage.setItem("sidebar-collapsed", String(newVal));
  };

  return (
    <div className="flex h-screen bg-background/50 industrial-grid transition-colors duration-500">
      <Sidebar
        user={user}
        avatarUrl={avatarUrl}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />
      <div className="flex flex-1 flex-col overflow-hidden relative">
        {/* Decorative glow - adjusted to use theme primary */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none transition-all duration-700" />

        <Header
          title={title}
          userId={user.id}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-[calc(10rem+env(safe-area-inset-bottom))] lg:pb-8 animate-in relative z-10 transition-all duration-300">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
        <BottomNav permissions={user.permissions} />
      </div>
      <GlobalSearch />
    </div>
  );
}
