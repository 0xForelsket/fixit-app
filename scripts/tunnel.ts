import { $ } from "bun";

console.log("Starting Serveo tunnel on port 3000...");

try {
  await $`ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=60 -R 80:localhost:3000 serveo.net`;
} catch (error) {
  console.error("Tunnel failed:", error);
  process.exit(1);
}
