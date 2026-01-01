"use client";

import { deleteUser } from "@/actions/users";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface DeleteUserButtonProps {
  userId: string;
  userName: string;
}

export function DeleteUserButton({ userId, userName }: DeleteUserButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setIsDeleting(true);
    setError(null);

    const result = await deleteUser(userId);

    if (!result.success) {
      setError(result.error);
      setIsDeleting(false);
      return;
    }

    router.push("/admin/users");
    router.refresh();
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        {error && <span className="text-xs text-danger-600 mr-2">{error}</span>}
        <span className="text-sm text-zinc-600">Deactivate {userName}?</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowConfirm(false)}
          disabled={isDeleting}
        >
          Cancel
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Confirm
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={() => setShowConfirm(true)}
      className="text-danger-600 border-danger-200 hover:bg-danger-50"
    >
      <Trash2 className="h-4 w-4 mr-2" />
      Deactivate
    </Button>
  );
}
