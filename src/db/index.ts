import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://fixit:fixitpassword@127.0.0.1:5433/fixit";

// Convert pooling options if needed, or just pass string
const client = postgres(connectionString);
export const db = drizzle(client, { schema });

export type Database = typeof db;
