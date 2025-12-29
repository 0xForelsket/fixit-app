"use client";

import { updatePreferences } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { UserPreferences } from "@/db/schema";
import { cn } from "@/lib/utils";
import { Check, Loader2, Mail } from "lucide-react";
import { useState, useTransition } from "react";

interface NotificationsFormProps {
  preferences: UserPreferences;
}

export function NotificationsForm({ preferences }: NotificationsFormProps) {
  const [emailEnabled, setEmailEnabled] = useState(preferences.notifications.email);
  const [isPending, startTransition] = useTransition();
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const result = await updatePreferences({
        notifications: { email: emailEnabled },
      });
      if (result.success) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        setError(result.error ?? "Failed to save preferences");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <div className="space-y-3">
        <Label>Email Notifications</Label>
        <div className="space-y-3">
          <ToggleOption
            icon={Mail}
            label="Email alerts"
            description="Receive email notifications for important events like work order assignments and status changes."
            checked={emailEnabled}
            onChange={setEmailEnabled}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Make sure you have an email address configured in your profile to receive notifications.
        </p>
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
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ElementType;
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
          checked ? "text-primary" : "text-muted-foreground"
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
