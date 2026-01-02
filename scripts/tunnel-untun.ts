import { $ } from "bun";

console.log("Starting untun (Cloudflare) tunnel on port 3000...");

try {
  // untun usually requires npx if not installed globally
  await $`npx untun@latest tunnel http://localhost:3000`;
} catch (error) {
  console.error("untun tunnel failed:", error);
  process.exit(1);
}
