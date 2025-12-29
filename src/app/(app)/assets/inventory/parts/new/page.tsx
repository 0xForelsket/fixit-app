import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/session";
import { PartForm } from "../part-form";

export default async function NewPartPage() {
  await requirePermission(PERMISSIONS.INVENTORY_CREATE);
  return <PartForm isNew />;
}
