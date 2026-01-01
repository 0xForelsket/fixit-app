"use client";

import { deleteRole } from "@/actions/roles";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface DeleteRoleButtonProps {
  roleId: string;
  roleName: string;
  disabled?: boolean;
}

export function DeleteRoleButton({
  roleId,
  roleName,
  disabled,
}: DeleteRoleButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete the role "${roleName}"?`)) {
      return;
    }

    setIsDeleting(true);
    const result = await deleteRole(roleId);
    setIsDeleting(false);

    if (!result.success) {
      alert(result.error);
      return;
    }

    router.refresh();
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleDelete}
      disabled={disabled || isDeleting}
      aria-label={
        disabled
          ? `Cannot delete ${roleName}: users are assigned`
          : `Delete ${roleName} role`
      }
      className="rounded-xl hover:bg-danger-500 hover:text-white transition-all disabled:opacity-50"
      title={
        disabled
          ? "Cannot delete: users are assigned to this role"
          : "Delete role"
      }
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
