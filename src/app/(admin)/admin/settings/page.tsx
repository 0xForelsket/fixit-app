import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertTriangle, Bell, Save, Shield, Timer } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure system-wide settings for FixIt
        </p>
      </div>

      {/* SLA Configuration */}
      <section className="rounded-xl border bg-white p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
            <Timer className="h-5 w-5 text-primary-600" />
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
            defaultValue={2}
            unit="hours"
            color="text-rose-600"
            bg="bg-rose-50"
          />
          <SLAInput
            label="High"
            description="Urgent issues"
            defaultValue={8}
            unit="hours"
            color="text-amber-600"
            bg="bg-amber-50"
          />
          <SLAInput
            label="Medium"
            description="Standard issues"
            defaultValue={24}
            unit="hours"
            color="text-primary-600"
            bg="bg-primary-50"
          />
          <SLAInput
            label="Low"
            description="Non-urgent issues"
            defaultValue={72}
            unit="hours"
            color="text-slate-600"
            bg="bg-slate-50"
          />
        </div>
      </section>

      {/* Session Settings */}
      <section className="rounded-xl border bg-white p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
            <Shield className="h-5 w-5 text-slate-600" />
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
                defaultValue={8}
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
                defaultValue={24}
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
      <section className="rounded-xl border bg-white p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
            <Bell className="h-5 w-5 text-amber-600" />
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
            defaultChecked={false}
          />
          <ToggleSetting
            label="Escalation Alerts"
            description="Notify admins when tickets become overdue"
            defaultChecked={true}
          />
          <ToggleSetting
            label="Daily Summary"
            description="Send daily summary email to admins"
            defaultChecked={false}
          />
        </div>
      </section>

      {/* Warning */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-800">
            Settings persistence not yet implemented
          </p>
          <p className="text-sm text-amber-700 mt-1">
            This page is a UI preview. Settings will be persisted in a future
            update.
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button disabled>
          <Save className="mr-2 h-4 w-4" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}

function SLAInput({
  label,
  description,
  defaultValue,
  unit,
  color,
  bg: _bg,
}: {
  label: string;
  description: string;
  defaultValue: number;
  unit: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className={cn("text-sm font-medium", color)}>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          defaultValue={defaultValue}
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
  defaultChecked,
}: {
  label: string;
  description: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex items-center justify-between rounded-lg border p-4 cursor-pointer hover:bg-slate-50 transition-colors">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <input
        type="checkbox"
        defaultChecked={defaultChecked}
        className="h-5 w-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
      />
    </label>
  );
}
