import { getVendors } from "@/data/vendors";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/session";
import { PartForm } from "../part-form";

export default async function NewPartPage() {
  await requirePermission(PERMISSIONS.INVENTORY_CREATE);
  const vendors = await getVendors();
  return <PartForm isNew vendors={vendors} />;
}
