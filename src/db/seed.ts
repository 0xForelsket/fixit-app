import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/libsql";
import { DEFAULT_ROLE_PERMISSIONS } from "../lib/permissions";
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
  // Phase 12-13 tables
  await db
    .delete(schema.workOrderParts)
    .catch(() =>
      console.log("Cleanup: workOrderParts table empty or not found")
    );
  await db
    .delete(schema.laborLogs)
    .catch(() => console.log("Cleanup: laborLogs table empty or not found"));
  await db
    .delete(schema.inventoryTransactions)
    .catch(() =>
      console.log("Cleanup: inventoryTransactions table empty or not found")
    );
  await db
    .delete(schema.inventoryLevels)
    .catch(() =>
      console.log("Cleanup: inventoryLevels table empty or not found")
    );
  // Phase 10-15 tables
  await db
    .delete(schema.checklistCompletions)
    .catch(() =>
      console.log("Cleanup: checklistCompletions table empty or not found")
    );
  await db
    .delete(schema.maintenanceChecklists)
    .catch(() =>
      console.log("Cleanup: maintenanceChecklists table empty or not found")
    );
  await db
    .delete(schema.equipmentBoms)
    .catch(() =>
      console.log("Cleanup: equipmentBoms table empty or not found")
    );
  await db
    .delete(schema.equipmentModels)
    .catch(() =>
      console.log("Cleanup: equipmentModels table empty or not found")
    );
  await db
    .delete(schema.spareParts)
    .catch(() => console.log("Cleanup: spareParts table empty or not found"));
  await db
    .delete(schema.equipmentTypes)
    .catch(() =>
      console.log("Cleanup: equipmentTypes table empty or not found")
    );
  await db
    .delete(schema.equipmentCategories)
    .catch(() =>
      console.log("Cleanup: equipmentCategories table empty or not found")
    );
  // Core tables
  await db.delete(schema.equipmentStatusLogs);
  await db.delete(schema.notifications);
  await db.delete(schema.attachments);
  await db.delete(schema.workOrderLogs);
  await db.delete(schema.maintenanceSchedules);
  await db.delete(schema.workOrders);
  await db.delete(schema.equipment);
  await db.delete(schema.locations);
  await db.delete(schema.users);
  await db
    .delete(schema.roles)
    .catch(() => console.log("Cleanup: roles table empty or not found"));

  console.log("Creating roles...");
  const [operatorRole] = await db
    .insert(schema.roles)
    .values({
      name: "operator",
      description: "Factory floor operators who report issues",
      permissions: DEFAULT_ROLE_PERMISSIONS.operator,
      isSystemRole: true,
    })
    .returning();

  const [techRole] = await db
    .insert(schema.roles)
    .values({
      name: "tech",
      description: "Maintenance technicians who resolve work orders",
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
      isSystemRole: true,
    })
    .returning();

  const [adminRole] = await db
    .insert(schema.roles)
    .values({
      name: "admin",
      description: "System administrators with full access",
      permissions: DEFAULT_ROLE_PERMISSIONS.admin,
      isSystemRole: true,
    })
    .returning();

  console.log(`Created ${3} roles`);

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
    roleId: adminRole.id,
    isActive: true,
  });

  const [tech1] = await db
    .insert(schema.users)
    .values({
      employeeId: "TECH-001",
      name: "John Smith",
      email: "john.smith@fixit.local",
      pin: techPin,
      roleId: techRole.id,
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
      roleId: techRole.id,
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
      roleId: operatorRole.id,
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
      roleId: operatorRole.id,
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
      description: "Injection molding equipment",
      parentId: hallB.id,
      isActive: true,
    })
    .returning();

  console.log(`Created ${6} locations`);

  // Create equipment categories
  console.log("Creating equipment categories...");
  const [catM] = await db
    .insert(schema.equipmentCategories)
    .values({
      name: "M",
      label: "Mechanical",
      description: "Mechanical equipment and machinery",
    })
    .returning();

  const [catE] = await db
    .insert(schema.equipmentCategories)
    .values({
      name: "E",
      label: "Electrical",
      description: "Electrical panels, motors, and controls",
    })
    .returning();

  const [catI] = await db
    .insert(schema.equipmentCategories)
    .values({
      name: "I",
      label: "Instrumentation",
      description: "Sensors, gauges, and precision instruments",
    })
    .returning();

  // Create equipment types (Object Types)
  console.log("Creating equipment types...");
  const [typeMolder] = await db
    .insert(schema.equipmentTypes)
    .values({
      categoryId: catM.id,
      name: "Injection Molder",
      code: "MOLD",
      description: "Industrial injection molding machine",
    })
    .returning();

  const [typeConveyor] = await db
    .insert(schema.equipmentTypes)
    .values({
      categoryId: catM.id,
      name: "Conveyor",
      code: "CONV",
      description: "Belt or roller conveyor system",
    })
    .returning();

  const [typeRobot] = await db
    .insert(schema.equipmentTypes)
    .values({
      categoryId: catM.id,
      name: "Robot",
      code: "ROB",
      description: "Articulated or packaging robot",
    })
    .returning();

  const [typeMill] = await db
    .insert(schema.equipmentTypes)
    .values({
      categoryId: catM.id,
      name: "CNC Mill",
      code: "CNC",
      description: "Computer numerical control milling machine",
    })
    .returning();

  const [typeScanner] = await db
    .insert(schema.equipmentTypes)
    .values({
      categoryId: catI.id,
      name: "Quality Scanner",
      code: "SCAN",
      description: "Optical or laser quality inspection scanner",
    })
    .returning();

  // Create equipment
  console.log("Creating equipment...");
  const [equipment1] = await db
    .insert(schema.equipment)
    .values({
      name: "Injection Molder A",
      code: "IM-001",
      typeId: typeMolder.id,
      locationId: moldingArea.id,
      ownerId: operator1.id,
      status: "operational",
    })
    .returning();

  const [equipment2] = await db
    .insert(schema.equipment)
    .values({
      name: "Injection Molder B",
      code: "IM-002",
      typeId: typeMolder.id,
      locationId: moldingArea.id,
      ownerId: operator1.id,
      status: "operational",
    })
    .returning();

  const [equipment3] = await db
    .insert(schema.equipment)
    .values({
      name: "Conveyor System 1",
      code: "CONV-001",
      typeId: typeConveyor.id,
      locationId: lineA1.id,
      ownerId: operator2.id,
      status: "operational",
    })
    .returning();

  const [equipment4] = await db
    .insert(schema.equipment)
    .values({
      name: "Packaging Robot",
      code: "PKG-001",
      typeId: typeRobot.id,
      locationId: lineA1.id,
      ownerId: operator2.id,
      status: "maintenance",
    })
    .returning();

  const [equipment5] = await db
    .insert(schema.equipment)
    .values({
      name: "CNC Mill",
      code: "CNC-001",
      typeId: typeMill.id,
      locationId: lineA2.id,
      ownerId: null,
      status: "down",
    })
    .returning();

  await db.insert(schema.equipment).values({
    name: "Quality Scanner",
    code: "QS-001",
    typeId: typeScanner.id,
    locationId: lineA2.id,
    ownerId: operator1.id,
    status: "operational",
  });

  console.log(
    `Created ${6} equipment (using SAP Types: ${typeMolder.code}, ${typeConveyor.code}, ${typeRobot.code}, ${typeMill.code}, ${typeScanner.code})`
  );
  console.log(
    `Categories initialized: ${catM.label}, ${catE.label}, ${catI.label}`
  );

  // Create some work orders
  console.log("Creating work orders...");
  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);
  const fourHoursFromNow = new Date(now.getTime() + 4 * 60 * 60 * 1000);

  const [workOrder1] = await db
    .insert(schema.workOrders)
    .values({
      equipmentId: equipment5.id,
      type: "breakdown",
      reportedById: operator2.id,
      assignedToId: tech1.id,
      title: "CNC Mill not powering on",
      description:
        "Equipment fails to start. No response when power button is pressed. Checked power supply - appears connected.",
      priority: "critical",
      status: "in_progress",
      dueBy: fourHoursFromNow,
      createdAt: twoHoursAgo,
      updatedAt: oneHourAgo,
    })
    .returning();

  const [workOrder2] = await db
    .insert(schema.workOrders)
    .values({
      equipmentId: equipment4.id,
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
    })
    .returning();

  await db.insert(schema.workOrders).values([
    {
      equipmentId: equipment1.id,
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
      equipmentId: equipment3.id,
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

  console.log(`Created ${4} work orders`);

  // Create maintenance schedules
  console.log("Creating maintenance schedules...");
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const [schedule1] = await db
    .insert(schema.maintenanceSchedules)
    .values({
      equipmentId: equipment1.id,
      title: "Monthly Lubrication",
      type: "maintenance",
      frequencyDays: 30,
      nextDue: thirtyDaysFromNow,
      isActive: true,
    })
    .returning();

  await db.insert(schema.maintenanceSchedules).values([
    {
      equipmentId: equipment1.id,
      title: "Quarterly Calibration",
      type: "calibration",
      frequencyDays: 90,
      nextDue: ninetyDaysFromNow,
      isActive: true,
    },
    {
      equipmentId: equipment2.id,
      title: "Monthly Lubrication",
      type: "maintenance",
      frequencyDays: 30,
      nextDue: thirtyDaysFromNow,
      isActive: true,
    },
    {
      equipmentId: equipment5.id,
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
      type: "work_order_assigned",
      title: "New Work Order Assigned",
      message: "You have been assigned to work order: CNC Mill not powering on",
      link: "/dashboard/work-orders/1",
      isRead: false,
    },
    {
      userId: tech1.id,
      type: "work_order_created",
      title: "Critical Work Order Created",
      message: "Emergency stop button sticking - Conveyor System 1",
      link: "/dashboard/work-orders/4",
      isRead: false,
    },
    {
      userId: tech2.id,
      type: "work_order_assigned",
      title: "New Work Order Assigned",
      message:
        "You have been assigned to work order: Scheduled gripper replacement",
      link: "/dashboard/work-orders/2",
      isRead: true,
    },
  ]);

  console.log(`Created ${3} notifications`);

  // Log equipment status changes for the down equipment
  console.log("Creating equipment status logs...");
  await db.insert(schema.equipmentStatusLogs).values([
    {
      equipmentId: equipment5.id,
      oldStatus: "operational",
      newStatus: "down",
      changedById: operator2.id,
      changedAt: twoHoursAgo,
    },
    {
      equipmentId: equipment4.id,
      oldStatus: "operational",
      newStatus: "maintenance",
      changedById: tech2.id,
      changedAt: twoHoursAgo,
    },
  ]);

  console.log(`Created ${2} equipment status logs`);

  // Create spare parts (using valid partCategories enum values)
  console.log("Creating spare parts...");
  const [part1] = await db
    .insert(schema.spareParts)
    .values({
      sku: "BRG-6205",
      name: "Ball Bearing 6205",
      description: "Deep groove ball bearing for motors",
      category: "mechanical",
      unitCost: 12.5,
      reorderPoint: 10,
    })
    .returning();

  const [part2] = await db
    .insert(schema.spareParts)
    .values({
      sku: "FLT-HYD-01",
      name: "Hydraulic Filter",
      description: "Replacement hydraulic filter for injection molders",
      category: "hydraulic",
      unitCost: 45.0,
      reorderPoint: 5,
    })
    .returning();

  const [part3] = await db
    .insert(schema.spareParts)
    .values({
      sku: "BLT-V-38",
      name: "V-Belt 38 inch",
      description: "Industrial V-belt for conveyors",
      category: "mechanical",
      unitCost: 18.75,
      reorderPoint: 8,
    })
    .returning();

  const [part4] = await db
    .insert(schema.spareParts)
    .values({
      sku: "GRS-LITH-01",
      name: "Lithium Grease Tube",
      description: "Multi-purpose lithium grease for lubrication",
      category: "consumable",
      unitCost: 8.99,
      reorderPoint: 20,
    })
    .returning();

  console.log(`Created ${4} spare parts`);

  // Create inventory levels
  console.log("Creating inventory levels...");
  await db.insert(schema.inventoryLevels).values([
    { partId: part1.id, locationId: hallB.id, quantity: 45 },
    { partId: part1.id, locationId: hallA.id, quantity: 20 },
    { partId: part2.id, locationId: hallB.id, quantity: 12 },
    { partId: part3.id, locationId: hallA.id, quantity: 30 },
    { partId: part4.id, locationId: building.id, quantity: 85 },
  ]);

  console.log(`Created ${5} inventory levels`);

  // Create inventory transactions (createdById not performedById)
  console.log("Creating inventory transactions...");
  await db.insert(schema.inventoryTransactions).values([
    {
      partId: part1.id,
      locationId: hallB.id,
      type: "in",
      quantity: 50,
      reference: "PO-2024-001",
      createdById: tech1.id,
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      partId: part2.id,
      locationId: hallB.id,
      type: "in",
      quantity: 20,
      reference: "PO-2024-002",
      createdById: tech1.id,
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      partId: part1.id,
      locationId: hallB.id,
      type: "out",
      quantity: 5,
      reference: "TKT-001",
      createdById: tech1.id,
      createdAt: oneHourAgo,
    },
  ]);

  console.log(`Created ${3} inventory transactions`);

  // Create equipment models (no category field - use description)
  console.log("Creating equipment models...");
  const [model1] = await db
    .insert(schema.equipmentModels)
    .values({
      name: "Injection Molder IM-500",
      manufacturer: "PlasticPro Industries",
      description: "500-ton injection molding equipment",
    })
    .returning();

  const [model2] = await db
    .insert(schema.equipmentModels)
    .values({
      name: "Conveyor CV-200",
      manufacturer: "ConveyorTech",
      description: "Medium-duty belt conveyor system",
    })
    .returning();

  console.log(`Created ${2} equipment models`);

  // Create equipment BOMs (quantityRequired not quantity)
  console.log("Creating equipment BOMs...");
  await db.insert(schema.equipmentBoms).values([
    {
      modelId: model1.id,
      partId: part1.id,
      quantityRequired: 4,
      notes: "Main motor bearings",
    },
    {
      modelId: model1.id,
      partId: part2.id,
      quantityRequired: 2,
      notes: "Hydraulic system filters",
    },
    {
      modelId: model1.id,
      partId: part4.id,
      quantityRequired: 1,
      notes: "Lubrication points",
    },
    {
      modelId: model2.id,
      partId: part3.id,
      quantityRequired: 3,
      notes: "Drive belts",
    },
    {
      modelId: model2.id,
      partId: part1.id,
      quantityRequired: 8,
      notes: "Roller bearings",
    },
  ]);

  console.log(`Created ${5} equipment BOMs`);

  // Create labor logs
  console.log("Creating labor logs...");
  await db.insert(schema.laborLogs).values([
    {
      workOrderId: workOrder1.id,
      userId: tech1.id,
      startTime: new Date(now.getTime() - 90 * 60 * 1000),
      endTime: new Date(now.getTime() - 30 * 60 * 1000),
      notes: "Diagnosed power supply issue",
    },
    {
      workOrderId: workOrder2.id,
      userId: tech2.id,
      startTime: new Date(now.getTime() - 120 * 60 * 1000),
      endTime: new Date(now.getTime() - 60 * 60 * 1000),
      notes: "Removed old gripper assembly",
    },
  ]);

  console.log(`Created ${2} labor logs`);

  // Create work order parts (addedById not consumedById, no locationId)
  console.log("Creating work order parts...");
  await db.insert(schema.workOrderParts).values([
    {
      workOrderId: workOrder1.id,
      partId: part1.id,
      quantity: 2,
      unitCost: part1.unitCost,
      addedById: tech1.id,
    },
  ]);

  console.log(`Created ${1} work order parts`);

  // Create maintenance checklists (stepNumber + description, not name + items)
  console.log("Creating maintenance checklists...");
  const [checklist1] = await db
    .insert(schema.maintenanceChecklists)
    .values({
      scheduleId: schedule1.id,
      stepNumber: 1,
      description: "Check oil levels and top up if needed",
      isRequired: true,
      estimatedMinutes: 5,
    })
    .returning();

  await db.insert(schema.maintenanceChecklists).values([
    {
      scheduleId: schedule1.id,
      stepNumber: 2,
      description: "Grease all bearing points",
      isRequired: true,
      estimatedMinutes: 10,
    },
    {
      scheduleId: schedule1.id,
      stepNumber: 3,
      description: "Inspect for leaks",
      isRequired: true,
      estimatedMinutes: 5,
    },
    {
      scheduleId: schedule1.id,
      stepNumber: 4,
      description: "Clean filters",
      isRequired: false,
      estimatedMinutes: 15,
    },
  ]);

  console.log(`Created ${4} maintenance checklists`);

  // Create checklist completions (workOrderId + checklistId, status, no responses)
  console.log("Creating checklist completions...");
  await db.insert(schema.checklistCompletions).values({
    checklistId: checklist1.id,
    workOrderId: workOrder2.id,
    status: "completed",
    completedById: tech1.id,
    notes: "All steps completed successfully",
    completedAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
  });

  console.log(`Created ${1} checklist completions`);

  // Create work order logs (action enum: status_change/comment/assignment, newValue required, createdById)
  console.log("Creating work order logs...");
  await db.insert(schema.workOrderLogs).values([
    {
      workOrderId: workOrder1.id,
      action: "status_change",
      oldValue: "open",
      newValue: "in_progress",
      createdById: tech1.id,
      createdAt: oneHourAgo,
    },
    {
      workOrderId: workOrder2.id,
      action: "assignment",
      oldValue: null,
      newValue: "Maria Garcia",
      createdById: tech2.id,
      createdAt: twoHoursAgo,
    },
    {
      workOrderId: workOrder1.id,
      action: "comment",
      newValue: "Started diagnostics on power supply",
      createdById: tech1.id,
      createdAt: oneHourAgo,
    },
  ]);

  console.log(`Created ${3} work order logs`);

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
