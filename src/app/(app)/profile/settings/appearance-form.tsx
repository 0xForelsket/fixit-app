"use client";

import { updatePreferences } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { UserPreferences } from "@/db/schema";
import { cn } from "@/lib/utils";
import { Check, Loader2, Monitor, Moon, Sun, LayoutGrid, LayoutList } from "lucide-react";
import { useState, useTransition, useEffect } from "react";

interface AppearanceFormProps {
  preferences: UserPreferences;
}

export function AppearanceForm({ preferences }: AppearanceFormProps) {
  const [theme, setTheme] = useState(preferences.theme);
  const [density, setDensity] = useState(preferences.density);
  const [isPending, startTransition] = useTransition();
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const result = await updatePreferences({ theme, density });
      if (result.success) {
        setShowSuccess(true);
        // Apply theme immediately
        applyTheme(theme);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        setError(result.error ?? "Failed to save preferences");
      }
    });
  };

  // Apply theme on mount
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <div className="space-y-6">
      {/* Theme Selection */}
      <div className="space-y-3">
        <Label>Theme</Label>
        <div className="grid grid-cols-3 gap-3">
          <ThemeOption
            value="system"
            label="System"
            icon={Monitor}
            selected={theme === "system"}
            onSelect={() => setTheme("system")}
          />
          <ThemeOption
            value="light"
            label="Light"
            icon={Sun}
            selected={theme === "light"}
            onSelect={() => setTheme("light")}
          />
          <ThemeOption
            value="dark"
            label="Dark"
            icon={Moon}
            selected={theme === "dark"}
            onSelect={() => setTheme("dark")}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Choose how the app appears on your device.
        </p>
      </div>

      {/* Density Selection */}
      <div className="space-y-3">
        <Label>Display Density</Label>
        <div className="grid grid-cols-2 gap-3">
          <DensityOption
            value="comfortable"
            label="Comfortable"
            icon={LayoutGrid}
            description="More spacing, easier to read"
            selected={density === "comfortable"}
            onSelect={() => setDensity("comfortable")}
          />
          <DensityOption
            value="compact"
            label="Compact"
            icon={LayoutList}
            description="Fits more content on screen"
            selected={density === "compact"}
            onSelect={() => setDensity("compact")}
          />
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

function ThemeOption({
  value,
  label,
  icon: Icon,
  selected,
  onSelect,
}: {
  value: string;
  label: string;
  icon: React.ElementType;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border-2 p-4 transition-all",
        selected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50"
      )}
    >
      <Icon className={cn("h-6 w-6", selected ? "text-primary" : "text-muted-foreground")} />
      <span className={cn("text-sm font-medium", selected && "text-primary")}>
        {label}
      </span>
    </button>
  );
}

function DensityOption({
  value,
  label,
  icon: Icon,
  description,
  selected,
  onSelect,
}: {
  value: string;
  label: string;
  icon: React.ElementType;
  description: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-all",
        selected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50"
      )}
    >
      <Icon className={cn("h-5 w-5 mt-0.5", selected ? "text-primary" : "text-muted-foreground")} />
      <div>
        <p className={cn("text-sm font-medium", selected && "text-primary")}>
          {label}
        </p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}

function applyTheme(theme: "system" | "light" | "dark") {
  const root = document.documentElement;

  if (theme === "system") {
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    root.setAttribute("data-theme", systemTheme === "dark" ? "dark" : "");
  } else if (theme === "dark") {
    root.setAttribute("data-theme", "dark");
  } else {
    root.removeAttribute("data-theme");
  }
}
