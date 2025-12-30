"use client";

import { updatePreferences } from "@/actions/profile-actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type {
  InAppNotificationPreferences,
  UserPreferences,
} from "@/db/schema";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Mail,
  MessageSquare,
  RefreshCw,
  User,
} from "lucide-react";
import { useState, useTransition } from "react";

interface NotificationsFormProps {
  preferences: UserPreferences;
}

const DEFAULT_IN_APP_PREFS: InAppNotificationPreferences = {
  workOrderCreated: true,
  workOrderAssigned: true,
  workOrderEscalated: true,
  workOrderResolved: true,
  workOrderCommented: true,
  workOrderStatusChanged: true,
  maintenanceDue: true,
};

const NOTIFICATION_TYPES: {
  key: keyof InAppNotificationPreferences;
  label: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
}[] = [
  {
    key: "workOrderCreated",
    label: "Work Order Created",
    description:
      "When a new work order is created on equipment in your department",
    icon: ClipboardList,
    iconColor: "text-primary-600",
  },
  {
    key: "workOrderAssigned",
    label: "Work Order Assigned",
    description: "When a work order is assigned to you",
    icon: User,
    iconColor: "text-emerald-600",
  },
  {
    key: "workOrderEscalated",
    label: "Work Order Escalated",
    description: "When a work order breaches SLA and is escalated",
    icon: AlertTriangle,
    iconColor: "text-amber-600",
  },
  {
    key: "workOrderResolved",
    label: "Work Order Resolved",
    description: "When a work order you reported is resolved",
    icon: CheckCircle2,
    iconColor: "text-emerald-600",
  },
  {
    key: "workOrderCommented",
    label: "Comments",
    description: "When someone comments on work orders you're involved in",
    icon: MessageSquare,
    iconColor: "text-blue-600",
  },
  {
    key: "workOrderStatusChanged",
    label: "Status Changes",
    description: "When the status of work orders you reported changes",
    icon: RefreshCw,
    iconColor: "text-violet-600",
  },
  {
    key: "maintenanceDue",
    label: "Maintenance Due",
    description: "When scheduled maintenance is coming up",
    icon: Calendar,
    iconColor: "text-rose-600",
  },
];

export function NotificationsForm({ preferences }: NotificationsFormProps) {
  const [emailEnabled, setEmailEnabled] = useState(
    preferences.notifications.email
  );
  const [inAppPrefs, setInAppPrefs] = useState<InAppNotificationPreferences>(
    preferences.notifications.inApp || DEFAULT_IN_APP_PREFS
  );
  const [isPending, startTransition] = useTransition();
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const result = await updatePreferences({
        notifications: {
          email: emailEnabled,
          inApp: inAppPrefs,
        },
      });
      if (result.success) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        setError(result.error ?? "Failed to save preferences");
      }
    });
  };

  const toggleInApp = (key: keyof InAppNotificationPreferences) => {
    setInAppPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const allEnabled = Object.values(inAppPrefs).every(Boolean);
  const noneEnabled = Object.values(inAppPrefs).every((v) => !v);

  const toggleAll = () => {
    const newValue = !allEnabled;
    setInAppPrefs({
      workOrderCreated: newValue,
      workOrderAssigned: newValue,
      workOrderEscalated: newValue,
      workOrderResolved: newValue,
      workOrderCommented: newValue,
      workOrderStatusChanged: newValue,
      maintenanceDue: newValue,
    });
  };

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <div className="space-y-3">
        <Label>Email Notifications</Label>
        <ToggleOption
          icon={Mail}
          label="Email alerts"
          description="Receive email notifications for important events"
          checked={emailEnabled}
          onChange={setEmailEnabled}
        />
        <p className="text-xs text-muted-foreground">
          Make sure you have an email address configured in your profile.
        </p>
      </div>

      {/* In-App Notification Preferences */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>In-App Notifications</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-auto py-1 px-2 text-xs"
            onClick={toggleAll}
          >
            {allEnabled
              ? "Disable All"
              : noneEnabled
                ? "Enable All"
                : "Toggle All"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Choose which notifications appear in your notification bell.
        </p>
        <div className="space-y-2">
          {NOTIFICATION_TYPES.map((notifType) => (
            <ToggleOption
              key={notifType.key}
              icon={notifType.icon}
              iconColor={notifType.iconColor}
              label={notifType.label}
              description={notifType.description}
              checked={inAppPrefs[notifType.key]}
              onChange={() => toggleInApp(notifType.key)}
            />
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Preferences"
          )}
        </Button>
        {showSuccess && (
          <span className="text-sm text-green-600 flex items-center gap-1">
            <Check className="h-4 w-4" />
            Saved!
          </span>
        )}
      </div>
    </div>
  );
}

function ToggleOption({
  icon: Icon,
  iconColor,
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ElementType;
  iconColor?: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "flex w-full items-start gap-4 rounded-lg border-2 p-4 text-left transition-all",
        checked
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50"
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5 mt-0.5",
          checked ? iconColor || "text-primary" : "text-muted-foreground"
        )}
      />
      <div className="flex-1">
        <p className={cn("text-sm font-medium", checked && "text-primary")}>
          {label}
        </p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div
        className={cn(
          "flex h-6 w-11 items-center rounded-full px-1 transition-colors",
          checked ? "bg-primary" : "bg-muted"
        )}
      >
        <div
          className={cn(
            "h-4 w-4 rounded-full bg-white shadow transition-transform",
            checked && "translate-x-5"
          )}
        />
      </div>
    </button>
  );
}
