import { db } from "@/db";
import { machineModels, spareParts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { BomEditor } from "../bom-editor";
import { ModelForm } from "../model-form";

export default async function EditMachineModelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const modelId = Number.parseInt(id);

  if (Number.isNaN(modelId)) {
    notFound();
  }

  const model = await db.query.machineModels.findFirst({
    where: eq(machineModels.id, modelId),
    with: {
      bom: {
        with: {
          part: true,
        },
      },
    },
  });

  if (!model) {
    notFound();
  }

  const allParts = await db.query.spareParts.findMany({
    where: eq(spareParts.isActive, true),
    orderBy: (spareParts, { asc }) => [asc(spareParts.name)],
  });

  return (
    <div className="space-y-6">
      <ModelForm model={model} />
      <BomEditor modelId={model.id} items={model.bom} parts={allParts} />
    </div>
  );
}
