"use client";

import { deleteScheduleAction } from "@/actions/maintenance";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface DeleteScheduleButtonProps {
  scheduleId: number;
  scheduleTitle?: string;
}

export function DeleteScheduleButton({
  scheduleId,
  scheduleTitle,
}: DeleteScheduleButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (
      !confirm(
        `Are you sure you want to delete ${
          scheduleTitle ? `"${scheduleTitle}"` : "this schedule"
        }? This action cannot be undone.`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteScheduleAction(scheduleId);

      if (result.error) {
        throw new Error(result.error);
      }

      router.push("/maintenance/schedules");
      router.refresh();
    } catch (error) {
      console.error("Delete error:", error);
      alert(
        error instanceof Error ? error.message : "Failed to delete schedule"
      );
      setIsDeleting(false);
    }
  }

  return (
    <Button
      type="button"
      variant="destructive"
      onClick={handleDelete}
      disabled={isDeleting}
    >
      <Trash2 className="mr-2 h-4 w-4" />
      {isDeleting ? "Deleting..." : "Delete"}
    </Button>
  );
}
