"use client";

import { useEffect, useRef } from "react";

export function MaintenanceTrigger() {
  const hasRun = useRef(false);

  useEffect(() => {
    // Prevent double-firing in strict mode or re-renders
    if (hasRun.current) return;
    hasRun.current = true;

    // Fire and forget - don't block UI
    // The API handles idempotency (only generates if actually due)
    fetch("/api/scheduler/run", {
      method: "POST",
    }).catch((err) => {
      console.error("Maintenance trigger failed:", err);
    });
  }, []);

  return null; // Headless component
}
