"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Play } from "lucide-react";
import { useState } from "react";

export function SchedulerButton() {
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  const handleRun = async () => {
    setIsRunning(true);
    try {
      const response = await fetch("/api/scheduler/run", {
        method: "POST",
      });
      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Scheduler run complete",
          description: `${data.generated} work orders generated.`,
        });
      } else {
        toast({
          title: "Scheduler failed",
          description: data.error || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to run scheduler:", error);
      toast({
        title: "Error",
        description: "Failed to run scheduler. Network error.",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleRun}
      disabled={isRunning}
      className="gap-2"
    >
      <Play className="h-4 w-4" />
      {isRunning ? "Running..." : "Run Scheduler"}
    </Button>
  );
}
