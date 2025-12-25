import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const client = createClient({
  url: process.env.DATABASE_URL || "file:./data/local.db",
});

const db = drizzle(client, { schema });

async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

async function seed() {
  console.log("🌱 Seeding database...");

  // Clear existing data (in reverse order of dependencies)
  console.log("Clearing existing data...");
  await db.delete(schema.machineStatusLogs);
  await db.delete(schema.notifications);
  await db.delete(schema.attachments);
  await db.delete(schema.ticketLogs);
  await db.delete(schema.maintenanceSchedules);
  await db.delete(schema.tickets);
  await db.delete(schema.machines);
  await db.delete(schema.locations);
  await db.delete(schema.users);

  // Create users
  console.log("Creating users...");
  const adminPin = await hashPin("1234");
  const techPin = await hashPin("5678");
  const operatorPin = await hashPin("0000");

  await db.insert(schema.users).values({
    employeeId: "ADMIN-001",
    name: "System Admin",
    email: "admin@fixit.local",
    pin: adminPin,
    role: "admin",
    isActive: true,
  });

  const [tech1] = await db
    .insert(schema.users)
    .values({
      employeeId: "TECH-001",
      name: "John Smith",
      email: "john.smith@fixit.local",
      pin: techPin,
      role: "tech",
      isActive: true,
    })
    .returning();

  const [tech2] = await db
    .insert(schema.users)
    .values({
      employeeId: "TECH-002",
      name: "Maria Garcia",
      email: "maria.garcia@fixit.local",
      pin: techPin,
      role: "tech",
      isActive: true,
    })
    .returning();

  const [operator1] = await db
    .insert(schema.users)
    .values({
      employeeId: "OP-001",
      name: "Mike Johnson",
      email: null,
      pin: operatorPin,
      role: "operator",
      isActive: true,
    })
    .returning();

  const [operator2] = await db
    .insert(schema.users)
    .values({
      employeeId: "OP-002",
      name: "Sarah Wilson",
      email: null,
      pin: operatorPin,
      role: "operator",
      isActive: true,
    })
    .returning();

  console.log(`Created ${5} users`);

  // Create locations (hierarchical)
  console.log("Creating locations...");
  const [building] = await db
    .insert(schema.locations)
    .values({
      name: "Main Building",
      code: "MAIN",
      description: "Primary manufacturing facility",
      isActive: true,
    })
    .returning();

  const [hallA] = await db
    .insert(schema.locations)
    .values({
      name: "Hall A",
      code: "HALL-A",
      description: "Assembly and packaging",
      parentId: building.id,
      isActive: true,
    })
    .returning();

  const [hallB] = await db
    .insert(schema.locations)
    .values({
      name: "Hall B",
      code: "HALL-B",
      description: "Injection molding",
      parentId: building.id,
      isActive: true,
    })
    .returning();

  const [lineA1] = await db
    .insert(schema.locations)
    .values({
      name: "Assembly Line 1",
      code: "AL-01",
      description: "Primary assembly line",
      parentId: hallA.id,
      isActive: true,
    })
    .returning();

  const [lineA2] = await db
    .insert(schema.locations)
    .values({
      name: "Assembly Line 2",
      code: "AL-02",
      description: "Secondary assembly line",
      parentId: hallA.id,
      isActive: true,
    })
    .returning();

  const [moldingArea] = await db
    .insert(schema.locations)
    .values({
      name: "Molding Area",
      code: "MOLD",
      description: "Injection molding machines",
      parentId: hallB.id,
      isActive: true,
    })
    .returning();

  console.log(`Created ${6} locations`);

  // Create machines
  console.log("Creating machines...");
  const [machine1] = await db
    .insert(schema.machines)
    .values({
      name: "Injection Molder A",
      code: "IM-001",
      locationId: moldingArea.id,
      ownerId: operator1.id,
      status: "operational",
    })
    .returning();

  const [machine2] = await db
    .insert(schema.machines)
    .values({
      name: "Injection Molder B",
      code: "IM-002",
      locationId: moldingArea.id,
      ownerId: operator1.id,
      status: "operational",
    })
    .returning();

  const [machine3] = await db
    .insert(schema.machines)
    .values({
      name: "Conveyor System 1",
      code: "CONV-001",
      locationId: lineA1.id,
      ownerId: operator2.id,
      status: "operational",
    })
    .returning();

  const [machine4] = await db
    .insert(schema.machines)
    .values({
      name: "Packaging Robot",
      code: "PKG-001",
      locationId: lineA1.id,
      ownerId: operator2.id,
      status: "maintenance",
    })
    .returning();

  const [machine5] = await db
    .insert(schema.machines)
    .values({
      name: "CNC Mill",
      code: "CNC-001",
      locationId: lineA2.id,
      ownerId: null,
      status: "down",
    })
    .returning();

  await db.insert(schema.machines).values({
    name: "Quality Scanner",
    code: "QS-001",
    locationId: lineA2.id,
    ownerId: operator1.id,
    status: "operational",
  });

  console.log(`Created ${6} machines`);

  // Create some tickets
  console.log("Creating tickets...");
  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);
  const fourHoursFromNow = new Date(now.getTime() + 4 * 60 * 60 * 1000);

  await db.insert(schema.tickets).values([
    {
      machineId: machine5.id,
      type: "breakdown",
      reportedById: operator2.id,
      assignedToId: tech1.id,
      title: "CNC Mill not powering on",
      description:
        "Machine fails to start. No response when power button is pressed. Checked power supply - appears connected.",
      priority: "critical",
      status: "in_progress",
      dueBy: fourHoursFromNow,
      createdAt: twoHoursAgo,
      updatedAt: oneHourAgo,
    },
    {
      machineId: machine4.id,
      type: "maintenance",
      reportedById: operator2.id,
      assignedToId: tech2.id,
      title: "Scheduled gripper replacement",
      description:
        "Gripper arms showing wear. Scheduled replacement as part of preventive maintenance.",
      priority: "medium",
      status: "in_progress",
      dueBy: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      createdAt: twoHoursAgo,
      updatedAt: twoHoursAgo,
    },
    {
      machineId: machine1.id,
      type: "calibration",
      reportedById: operator1.id,
      assignedToId: null,
      title: "Temperature sensor drift detected",
      description:
        "Mold temperature readings seem off by 5-10 degrees. Needs recalibration.",
      priority: "high",
      status: "open",
      dueBy: new Date(now.getTime() + 8 * 60 * 60 * 1000),
      createdAt: oneHourAgo,
      updatedAt: oneHourAgo,
    },
    {
      machineId: machine3.id,
      type: "safety",
      reportedById: operator2.id,
      assignedToId: tech1.id,
      title: "Emergency stop button sticking",
      description:
        "E-stop button on station 3 requires excessive force to activate. Safety concern.",
      priority: "critical",
      status: "open",
      dueBy: new Date(now.getTime() + 2 * 60 * 60 * 1000),
      createdAt: now,
      updatedAt: now,
    },
  ]);

  console.log(`Created ${4} tickets`);

  // Create maintenance schedules
  console.log("Creating maintenance schedules...");
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  await db.insert(schema.maintenanceSchedules).values([
    {
      machineId: machine1.id,
      title: "Monthly Lubrication",
      type: "maintenance",
      frequencyDays: 30,
      nextDue: thirtyDaysFromNow,
      isActive: true,
    },
    {
      machineId: machine1.id,
      title: "Quarterly Calibration",
      type: "calibration",
      frequencyDays: 90,
      nextDue: ninetyDaysFromNow,
      isActive: true,
    },
    {
      machineId: machine2.id,
      title: "Monthly Lubrication",
      type: "maintenance",
      frequencyDays: 30,
      nextDue: thirtyDaysFromNow,
      isActive: true,
    },
    {
      machineId: machine5.id,
      title: "Annual Calibration",
      type: "calibration",
      frequencyDays: 365,
      nextDue: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
  ]);

  console.log(`Created ${4} maintenance schedules`);

  // Create some notifications
  console.log("Creating notifications...");
  await db.insert(schema.notifications).values([
    {
      userId: tech1.id,
      type: "ticket_assigned",
      title: "New Ticket Assigned",
      message: "You have been assigned to ticket: CNC Mill not powering on",
      link: "/dashboard/tickets/1",
      isRead: false,
    },
    {
      userId: tech1.id,
      type: "ticket_created",
      title: "Critical Ticket Created",
      message: "Emergency stop button sticking - Conveyor System 1",
      link: "/dashboard/tickets/4",
      isRead: false,
    },
    {
      userId: tech2.id,
      type: "ticket_assigned",
      title: "New Ticket Assigned",
      message:
        "You have been assigned to ticket: Scheduled gripper replacement",
      link: "/dashboard/tickets/2",
      isRead: true,
    },
  ]);

  console.log(`Created ${3} notifications`);

  // Log machine status changes for the down machine
  console.log("Creating machine status logs...");
  await db.insert(schema.machineStatusLogs).values([
    {
      machineId: machine5.id,
      oldStatus: "operational",
      newStatus: "down",
      changedById: operator2.id,
      changedAt: twoHoursAgo,
    },
    {
      machineId: machine4.id,
      oldStatus: "operational",
      newStatus: "maintenance",
      changedById: tech2.id,
      changedAt: twoHoursAgo,
    },
  ]);

  console.log(`Created ${2} machine status logs`);

  console.log("\n✅ Database seeded successfully!");
  console.log("\n📋 Default credentials:");
  console.log("  Admin:    ADMIN-001 / 1234");
  console.log("  Tech:     TECH-001  / 5678");
  console.log("  Operator: OP-001    / 0000");
}

seed()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  });
