import { db } from "./db";
console.log(await db.query.users.findMany());
