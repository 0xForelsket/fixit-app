import type { SystemSettingsConfig } from "@/db/schema";

// Default settings values
export const DEFAULT_SETTINGS: SystemSettingsConfig = {
  sla: {
    critical: 2,
    high: 8,
    medium: 24,
    low: 72,
  },
  session: {
    idleTimeout: 8,
    maxDuration: 24,
  },
  notifications: {
    emailEnabled: false,
    escalationAlerts: true,
    dailySummary: false,
  },
};
