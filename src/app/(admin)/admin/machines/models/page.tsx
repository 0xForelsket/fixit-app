import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function MachineModelsPage() {
  const models = await db.query.machineModels.findMany({
    with: {
      machines: true,
      bom: true,
    },
    orderBy: (models, { desc }) => [desc(models.id)],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Machine Models</h1>
          <p className="text-muted-foreground">
            Define standard machine types and their spare parts (BOM).
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/machines/models/new">
            <Plus className="mr-2 h-4 w-4" />
            New Model
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50">
            <tr className="text-left font-medium text-muted-foreground">
              <th className="p-3">Model Name</th>
              <th className="p-3">Manufacturer</th>
              <th className="p-3">Machines</th>
              <th className="p-3">BOM Parts</th>
              <th className="p-3 w-20" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {models.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-8 text-center text-muted-foreground"
                >
                  No machine models defined yet.
                </td>
              </tr>
            ) : (
              models.map((model) => (
                <tr key={model.id} className="hover:bg-slate-50">
                  <td className="p-3 font-medium">
                    <Link
                      href={`/admin/machines/models/${model.id}`}
                      className="hover:underline"
                    >
                      {model.name}
                    </Link>
                    {model.description && (
                      <p className="text-xs text-muted-foreground truncate max-w-xs">
                        {model.description}
                      </p>
                    )}
                  </td>
                  <td className="p-3">{model.manufacturer || "-"}</td>
                  <td className="p-3">
                    <Badge variant="secondary">
                      {model.machines.length} active
                    </Badge>
                  </td>
                  <td className="p-3">{model.bom.length} parts</td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/machines/models/${model.id}`}>
                        Edit
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
