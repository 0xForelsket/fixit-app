"use client";

import {
  createDepartment,
  deleteDepartment,
  updateDepartment,
} from "@/actions/departments";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatsTicker } from "@/components/ui/stats-ticker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  Building2,
  Edit,
  Loader2,
  MonitorCog,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface Department {
  id: string;
  name: string;
  code: string;
  description: string | null;
  managerId: string | null;
  managerName: string | null;
  memberCount: number;
  equipmentCount: number;
}

interface User {
  id: string;
  name: string;
}

interface DepartmentsTabProps {
  departments: Department[];
  users: User[];
  canEdit: boolean;
}

export function DepartmentsTab({
  departments,
  users,
  canEdit,
}: DepartmentsTabProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(
    null
  );
  const [deletingDepartment, setDeletingDepartment] =
    useState<Department | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stats = {
    total: departments.length,
    totalMembers: departments.reduce(
      (sum, d) => sum + Number(d.memberCount),
      0
    ),
    totalEquipment: departments.reduce(
      (sum, d) => sum + Number(d.equipmentCount),
      0
    ),
  };

  const handleOpenCreate = () => {
    setEditingDepartment(null);
    setError(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (dept: Department) => {
    setEditingDepartment(dept);
    setError(null);
    setDialogOpen(true);
  };

  const handleOpenDelete = (dept: Department) => {
    setDeletingDepartment(dept);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = editingDepartment
        ? await updateDepartment(editingDepartment.id, formData)
        : await createDepartment(formData);

      if (!result.success) {
        setError(result.error || "An error occurred");
        return;
      }

      setDialogOpen(false);
      router.refresh();
    });
  };

  const handleDelete = async () => {
    if (!deletingDepartment) return;

    startTransition(async () => {
      const result = await deleteDepartment(deletingDepartment.id);

      if (!result.success) {
        setError(result.error || "An error occurred");
        return;
      }

      setDeleteDialogOpen(false);
      setDeletingDepartment(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      {/* Header row with action button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Department Management
          </h3>
        </div>
        {canEdit && (
          <Button
            onClick={handleOpenCreate}
            className="rounded-full font-black text-[10px] uppercase tracking-wider h-10 px-6"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Department
          </Button>
        )}
      </div>

      {/* Stats row */}
      <StatsTicker
        stats={[
          {
            label: "Departments",
            value: stats.total,
            icon: Building2,
            variant: "default",
          },
          {
            label: "Members",
            value: stats.totalMembers,
            icon: Users,
            variant: "primary",
          },
          {
            label: "Equipment",
            value: stats.totalEquipment,
            icon: MonitorCog,
            variant: "default",
          },
        ]}
      />

      {departments.length === 0 ? (
        <EmptyState
          title="No departments"
          description="Create your first department to organize users and equipment."
          icon={Building2}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Department
                </TableHead>
                <TableHead className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground hidden md:table-cell">
                  Code
                </TableHead>
                <TableHead className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground hidden lg:table-cell">
                  Manager
                </TableHead>
                <TableHead className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Members
                </TableHead>
                <TableHead className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground hidden md:table-cell">
                  Equipment
                </TableHead>
                {canEdit && <TableHead className="p-4 w-24" />}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {departments.map((dept, index) => (
                <TableRow
                  key={dept.id}
                  className={cn(
                    "hover:bg-muted/50 transition-colors group",
                    index < 5 && `animate-stagger-${index + 1}`
                  )}
                >
                  <TableCell className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-xs">
                        {dept.code.slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          {dept.name}
                        </p>
                        {dept.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {dept.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="p-4 hidden md:table-cell">
                    <span className="font-mono text-sm text-muted-foreground">
                      {dept.code}
                    </span>
                  </TableCell>
                  <TableCell className="p-4 hidden lg:table-cell">
                    <span className="text-sm text-muted-foreground">
                      {dept.managerName || "—"}
                    </span>
                  </TableCell>
                  <TableCell className="p-4">
                    <div className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      {dept.memberCount}
                    </div>
                  </TableCell>
                  <TableCell className="p-4 hidden md:table-cell">
                    <div className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground">
                      <MonitorCog className="h-3.5 w-3.5" />
                      {dept.equipmentCount}
                    </div>
                  </TableCell>
                  {canEdit && (
                    <TableCell className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(dept)}
                          className="rounded-xl h-8 w-8"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDelete(dept)}
                          disabled={
                            dept.memberCount > 0 || dept.equipmentCount > 0
                          }
                          className="rounded-xl h-8 w-8 text-muted-foreground hover:text-destructive"
                          title={
                            dept.memberCount > 0 || dept.equipmentCount > 0
                              ? "Cannot delete: has members or equipment"
                              : "Delete department"
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDepartment ? "Edit Department" : "Create Department"}
            </DialogTitle>
            <DialogDescription>
              {editingDepartment
                ? "Update department details"
                : "Add a new department to organize users and equipment"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="name"
                name="name"
                defaultValue={editingDepartment?.name}
                placeholder="e.g., Electrical"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="code" className="text-sm font-medium">
                Code <span className="text-destructive">*</span>
              </label>
              <Input
                id="code"
                name="code"
                defaultValue={editingDepartment?.code}
                placeholder="e.g., ELEC"
                className="uppercase"
                maxLength={10}
                required
              />
              <p className="text-xs text-muted-foreground">
                Uppercase letters and numbers only
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Input
                id="description"
                name="description"
                defaultValue={editingDepartment?.description || ""}
                placeholder="Brief description of the department"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="managerId" className="text-sm font-medium">
                Manager
              </label>
              <Select
                name="managerId"
                defaultValue={editingDepartment?.managerId?.toString() || ""}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No manager</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingDepartment ? "Save Changes" : "Create Department"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Department</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingDepartment?.name}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
