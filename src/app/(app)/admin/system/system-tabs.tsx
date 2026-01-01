"use client";

import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import {
  PillTabs,
  PillTabsContent,
  PillTabsList,
  PillTabsTrigger,
} from "@/components/ui/pill-tabs";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { Cog, QrCode, Shield, Upload, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { ImportTab } from "./tabs/import-tab";
import { QrCodesTab } from "./tabs/qr-codes-tab";
import { RolesTab } from "./tabs/roles-tab";
import { SettingsTab } from "./tabs/settings-tab";
import { UsersTab } from "./tabs/users-tab";

interface User {
  id: number;
  employeeId: string;
  name: string;
  email: string | null;
  isActive: boolean;
  createdAt: Date;
  assignedRole: {
    id: number;
    name: string;
  } | null;
}

interface Role {
  id: number;
  name: string;
  description: string | null;
  permissions: string[];
  isSystemRole: boolean;
  userCount: number;
}

interface Equipment {
  id: number;
  name: string;
  code: string;
  location: { name: string } | null;
  owner: { name: string; employeeId: string } | null;
}

interface SystemTabsProps {
  users: User[];
  userStats: {
    total: number;
    active: number;
    operators: number;
    techs: number;
    admins: number;
  };
  roles: Role[];
  roleStats: {
    total: number;
    system: number;
    custom: number;
  };
  equipment: Equipment[];
  baseUrl: string;
}

export function SystemTabs({
  users,
  userStats,
  roles,
  roleStats,
  equipment,
  baseUrl,
}: SystemTabsProps) {
  const [activeTab, setActiveTab] = useState("users");
  const [userPermissions, setUserPermissions] = useState<string[]>([]);

  // Get current user permissions from session (simplified - in real app would come from props)
  useEffect(() => {
    // For now, show all tabs - in production, filter based on user permissions
    setUserPermissions(["*"]);

    // Handle hash-based navigation
    const hash = window.location.hash.slice(1);
    if (
      hash &&
      ["users", "roles", "settings", "qr-codes", "import"].includes(hash)
    ) {
      setActiveTab(hash);
    }
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    window.history.replaceState(null, "", `#${value}`);
  };

  const canViewUsers = hasPermission(userPermissions, PERMISSIONS.USER_VIEW);
  const canViewRoles = hasPermission(
    userPermissions,
    PERMISSIONS.SYSTEM_SETTINGS
  );
  const canViewSettings = hasPermission(
    userPermissions,
    PERMISSIONS.SYSTEM_SETTINGS
  );
  const canViewQrCodes = hasPermission(
    userPermissions,
    PERMISSIONS.SYSTEM_QR_CODES
  );
  const canViewImport = hasPermission(
    userPermissions,
    PERMISSIONS.EQUIPMENT_CREATE
  );

  const tabs = [
    { id: "users", label: "Users", icon: Users, visible: canViewUsers },
    { id: "roles", label: "Roles", icon: Shield, visible: canViewRoles },
    { id: "settings", label: "Settings", icon: Cog, visible: canViewSettings },
    {
      id: "qr-codes",
      label: "QR Codes",
      icon: QrCode,
      visible: canViewQrCodes,
    },
    { id: "import", label: "Import", icon: Upload, visible: canViewImport },
  ].filter((tab) => tab.visible);

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="System"
        subtitle="Administration"
        description="MANAGE USERS, ROLES, AND SYSTEM SETTINGS"
        bgSymbol="SY"
        actions={null}
        compact
      />

      <PillTabs value={activeTab} onValueChange={handleTabChange}>
        <PillTabsList>
          {tabs.map((tab) => (
            <PillTabsTrigger key={tab.id} value={tab.id}>
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </PillTabsTrigger>
          ))}
        </PillTabsList>

        <PillTabsContent value="users">
          <UsersTab users={users} stats={userStats} />
        </PillTabsContent>

        <PillTabsContent value="roles">
          <RolesTab roles={roles} stats={roleStats} />
        </PillTabsContent>

        <PillTabsContent value="settings">
          <SettingsTab />
        </PillTabsContent>

        <PillTabsContent value="qr-codes">
          <QrCodesTab equipment={equipment} baseUrl={baseUrl} />
        </PillTabsContent>

        <PillTabsContent value="import">
          <ImportTab />
        </PillTabsContent>
      </PillTabs>
    </PageContainer>
  );
}
