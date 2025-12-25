"use client";

import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import type { UserRole } from "@/db/schema";
import { useState } from "react";

interface DashboardShellProps {
  user: {
    id: number;
    name: string;
    role: UserRole;
    employeeId: string;
  };
  avatarUrl?: string | null;
  title: string;
  children: React.ReactNode;
}

export function DashboardShell({
  user,
  avatarUrl,
  title,
  children,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar
        user={user}
        avatarUrl={avatarUrl}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          title={title}
          userId={user.id}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
