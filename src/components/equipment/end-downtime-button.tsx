"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { getCsrfToken } from "@/lib/api-client";
import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface EndDowntimeButtonProps {
  downtimeId: string;
}

export function EndDowntimeButton({ downtimeId }: EndDowntimeButtonProps) {
  const [isEnding, setIsEnding] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function handleEndDowntime() {
    setIsEnding(true);
    try {
      const csrfToken = getCsrfToken();
      const response = await fetch(`/api/equipment/downtime/${downtimeId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken ?? "",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to end downtime");
      }

      toast({
        title: "Downtime Ended",
        description: "The downtime period has been closed.",
      });
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to end downtime",
      });
    } finally {
      setIsEnding(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-6 text-xs text-emerald-600 border-emerald-300 hover:bg-emerald-50"
      onClick={handleEndDowntime}
      disabled={isEnding}
    >
      <CheckCircle2 className="h-3 w-3 mr-1" />
      {isEnding ? "Ending..." : "End"}
    </Button>
  );
}
