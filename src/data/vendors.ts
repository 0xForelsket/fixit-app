import { db } from "@/db";

export async function getVendors() {
  return db.query.vendors.findMany({
    orderBy: (vendors, { asc }) => [asc(vendors.name)],
  });
}
