/**
 * Application Configuration Constants
 *
 * This file centralizes all "magic numbers" and configuration values
 * used throughout the application for easy maintenance and documentation.
 */

export const APP_CONFIG = {
  /**
   * Pagination defaults
   */
  pagination: {
    defaultPage: 1,
    defaultLimit: 20,
    maxLimit: 100,
    dashboardLimit: 5,
  },

  /**
   * SLA (Service Level Agreement) timeframes in hours
   */
  sla: {
    critical: 4, // 4 hours for critical priority
    high: 8, // 8 hours for high priority
    medium: 24, // 24 hours (1 day) for medium priority
    low: 72, // 72 hours (3 days) for low priority
  },

  /**
   * Account lockout settings
   */
  security: {
    maxFailedLoginAttempts: 5,
    lockoutDurationMinutes: 15,
    sessionExpiryDays: 7,
  },

  /**
   * File upload limits
   */
  uploads: {
    maxFileSizeMB: 10,
    maxFileSizeBytes: 10 * 1024 * 1024,
    allowedImageTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    allowedDocumentTypes: ["application/pdf"],
  },

  /**
   * UI/UX settings
   */
  ui: {
    toastDurationMs: 5000,
    debounceDelayMs: 300,
    animationDurationMs: 200,
    maxNotificationsShown: 10,
  },

  /**
   * Work order settings
   */
  workOrders: {
    recentLimit: 10,
    maxTitleLength: 200,
    maxDescriptionLength: 5000,
    maxCommentLength: 2000,
    maxResolutionNotesLength: 5000,
  },

  /**
   * Equipment settings
   */
  equipment: {
    codePattern: /^[A-Z0-9\-_]+$/,
    maxCodeLength: 50,
    maxNameLength: 100,
  },

  /**
   * Maintenance schedule settings
   */
  maintenance: {
    minFrequencyDays: 1,
    maxFrequencyDays: 365,
    checklistMaxItems: 50,
  },
} as const;

export type AppConfig = typeof APP_CONFIG;
