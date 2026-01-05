"use client";

import { updateAllSystemSettings } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import type { SystemSettingsConfig } from "@/db/schema";
import { cn } from "@/lib/utils";
import { ChevronRight, Mail, Save } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";

interface SettingsFormProps {
  initialSettings: SystemSettingsConfig;
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [settings, setSettings] =
    useState<SystemSettingsConfig>(initialSettings);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateAllSystemSettings(settings);
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    });
  };

  const updateSLA = (
    priority: keyof SystemSettingsConfig["sla"],
    value: number
  ) => {
    setSettings((prev) => ({
      ...prev,
      sla: { ...prev.sla, [priority]: value },
    }));
  };

  const updateSession = (
    field: keyof SystemSettingsConfig["session"],
    value: number
  ) => {
    setSettings((prev) => ({
      ...prev,
      session: { ...prev.session, [field]: value },
    }));
  };

  const updateNotification = (
    field: keyof SystemSettingsConfig["notifications"],
    value: boolean
  ) => {
    setSettings((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [field]: value },
    }));
  };

  return (
    <>
      {/* SLA Configuration */}
      <section className="rounded-xl border bg-white p-6 animate-in fade-in slide-in-from-bottom-2 duration-500 animate-stagger-1">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
            <svg
              className="h-5 w-5 text-primary-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold">SLA Configuration</h2>
            <p className="text-sm text-muted-foreground">
              Set due times for each priority level
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <SLAInput
            label="Critical"
            description="Highest priority issues"
            value={settings.sla.critical}
            onChange={(v) => updateSLA("critical", v)}
            unit="hours"
            color="text-rose-600"
          />
          <SLAInput
            label="High"
            description="Urgent issues"
            value={settings.sla.high}
            onChange={(v) => updateSLA("high", v)}
            unit="hours"
            color="text-amber-600"
          />
          <SLAInput
            label="Medium"
            description="Standard issues"
            value={settings.sla.medium}
            onChange={(v) => updateSLA("medium", v)}
            unit="hours"
            color="text-primary-600"
          />
          <SLAInput
            label="Low"
            description="Non-urgent issues"
            value={settings.sla.low}
            onChange={(v) => updateSLA("low", v)}
            unit="hours"
            color="text-slate-600"
          />
        </div>
      </section>

      {/* Session Settings */}
      <section className="rounded-xl border bg-white p-6 animate-in fade-in slide-in-from-bottom-2 duration-500 animate-stagger-2">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
            <svg
              className="h-5 w-5 text-slate-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Session Settings</h2>
            <p className="text-sm text-muted-foreground">
              Configure authentication and security
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border p-4">
            <label
              htmlFor="session-timeout"
              className="block text-sm font-medium mb-2"
            >
              Session Timeout (Idle)
            </label>
            <div className="flex items-center gap-2">
              <input
                id="session-timeout"
                type="number"
                min={1}
                max={72}
                value={settings.session.idleTimeout}
                onChange={(e) =>
                  updateSession("idleTimeout", Number(e.target.value))
                }
                className="w-24 rounded-lg border bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
              <span className="text-sm text-muted-foreground">hours</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Time before auto-logout when idle
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <label
              htmlFor="max-session"
              className="block text-sm font-medium mb-2"
            >
              Max Session Duration
            </label>
            <div className="flex items-center gap-2">
              <input
                id="max-session"
                type="number"
                min={1}
                max={168}
                value={settings.session.maxDuration}
                onChange={(e) =>
                  updateSession("maxDuration", Number(e.target.value))
                }
                className="w-24 rounded-lg border bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
              <span className="text-sm text-muted-foreground">hours</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Maximum session length before forced logout
            </p>
          </div>
        </div>
      </section>

      {/* Notification Settings */}
      <section className="rounded-xl border bg-white p-6 animate-in fade-in slide-in-from-bottom-2 duration-500 animate-stagger-3">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
            <svg
              className="h-5 w-5 text-amber-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Notifications</h2>
            <p className="text-sm text-muted-foreground">
              Configure notification behavior
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <ToggleSetting
            label="Email Notifications"
            description="Send email alerts for critical and high priority tickets"
            checked={settings.notifications.emailEnabled}
            onChange={(v) => updateNotification("emailEnabled", v)}
          />
          <ToggleSetting
            label="Escalation Alerts"
            description="Notify admins when tickets become overdue"
            checked={settings.notifications.escalationAlerts}
            onChange={(v) => updateNotification("escalationAlerts", v)}
          />
          <ToggleSetting
            label="Daily Summary"
            description="Send daily summary email to admins"
            checked={settings.notifications.dailySummary}
            onChange={(v) => updateNotification("dailySummary", v)}
          />
        </div>
      </section>

      {/* Email Settings Link */}
      <Link
        href="/admin/settings/email"
        className="flex items-center justify-between rounded-xl border bg-white p-6 hover:bg-slate-50 transition-colors animate-in fade-in slide-in-from-bottom-2 duration-500 animate-stagger-4"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
            <Mail className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Email Settings</h2>
            <p className="text-sm text-muted-foreground">
              Configure SMTP server for sending emails
            </p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </Link>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span className="text-sm text-green-600 animate-in fade-in">
            Settings saved successfully
          </span>
        )}
        <Button onClick={handleSave} disabled={isPending}>
          <Save className="mr-2 h-4 w-4" />
          {isPending ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </>
  );
}

function SLAInput({
  label,
  description,
  value,
  onChange,
  unit,
  color,
}: {
  label: string;
  description: string;
  value: number;
  onChange: (value: number) => void;
  unit: string;
  color: string;
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className={cn("text-sm font-medium", color)}>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          max={168}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-24 rounded-lg border bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        />
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>
      <p className="text-xs text-muted-foreground mt-2">{description}</p>
    </div>
  );
}

function ToggleSetting({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-lg border p-4 cursor-pointer hover:bg-slate-50 transition-colors">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
      />
    </label>
  );
}
