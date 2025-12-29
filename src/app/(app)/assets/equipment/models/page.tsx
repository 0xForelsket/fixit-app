import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/db";
import { cn } from "@/lib/utils";
import { Package, Plus } from "lucide-react";
import Link from "next/link";

export default async function EquipmentModelsPage() {
  const models = await db.query.equipmentModels.findMany({
    with: {
      equipment: true,
      bom: true,
    },
    orderBy: (models, { desc }) => [desc(models.id)],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Equipment Models
          </h1>
          <p className="text-muted-foreground">
            Define standard equipment types and their spare parts (BOM).
          </p>
        </div>
        <Button asChild className="font-bold shadow-lg shadow-primary-500/20">
          <Link href="/assets/equipment/models/new">
            <Plus className="mr-2 h-4 w-4" />
            NEW MODEL
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border bg-white shadow-sm">
        <Table className="w-full text-sm">
          <TableHeader className="bg-slate-50">
            <TableRow className="text-left font-medium text-muted-foreground">
              <TableHead className="p-3">Model Name</TableHead>
              <TableHead className="p-3">Manufacturer</TableHead>
              <TableHead className="p-3">Equipment</TableHead>
              <TableHead className="p-3">BOM Parts</TableHead>
              <TableHead className="p-3 w-20" />
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y">
            {models.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="p-0">
                  <EmptyState
                    title="No equipment models"
                    description="Standardize your assets by defining models and their requirements."
                    icon={Package}
                  />
                </TableCell>
              </TableRow>
            ) : (
              models.map((model, index) => {
                const staggerClass =
                  index < 5
                    ? `animate-stagger-${index + 1}`
                    : "animate-in fade-in duration-500";
                return (
                  <TableRow
                    key={model.id}
                    className={cn(
                      "hover:bg-slate-50 animate-in fade-in slide-in-from-bottom-1",
                      staggerClass
                    )}
                  >
                    <TableCell className="p-3 font-medium">
                      <Link
                        href={`/assets/equipment/models/${model.id}`}
                        className="hover:underline font-bold text-zinc-900"
                      >
                        {model.name}
                      </Link>
                      {model.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-xs">
                          {model.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="p-3 font-medium">
                      {model.manufacturer || "-"}
                    </TableCell>
                    <TableCell className="p-3">
                      <Badge variant="secondary" className="font-bold">
                        {model.equipment.length} assets
                      </Badge>
                    </TableCell>
                    <TableCell className="p-3">
                      <div className="flex items-center gap-1.5 font-bold text-zinc-600">
                        <Package className="h-3.5 w-3.5" />
                        {model.bom.length} parts
                      </div>
                    </TableCell>
                    <TableCell className="p-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="font-bold text-primary-600"
                      >
                        <Link href={`/assets/equipment/models/${model.id}`}>
                          VIEW
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
