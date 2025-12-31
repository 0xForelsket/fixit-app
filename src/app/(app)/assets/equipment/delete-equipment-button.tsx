"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface DeleteEquipmentButtonProps {
  equipmentId: number;
  equipmentName: string;
}

export function DeleteEquipmentButton({
  equipmentId,
  equipmentName,
}: DeleteEquipmentButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (
      !confirm(
        `Are you sure you want to delete "${equipmentName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/equipment/${equipmentId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete equipment");
      }

      router.push("/assets/equipment");
      router.refresh();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete equipment. Please try again.");
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
      {isDeleting ? "Deleting..." : "Deactivate"}
    </Button>
  );
}
