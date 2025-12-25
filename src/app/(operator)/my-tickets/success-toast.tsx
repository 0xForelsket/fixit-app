"use client";

import { useEffect, useState } from "react";

export function SuccessToast() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Remove the query param from URL without triggering navigation
    window.history.replaceState({}, "", "/my-tickets");

    // Auto-hide after 5 seconds
    const timer = setTimeout(() => {
      setVisible(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg bg-success-600 px-4 py-3 text-white shadow-lg animate-in slide-in-from-bottom-4">
      <svg
        className="h-5 w-5 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
      <span className="font-medium">Issue reported successfully!</span>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="ml-2 rounded-full p-1 hover:bg-success-700"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}
