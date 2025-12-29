import { db } from "./index";
import * as schema from "./schema";
import { DEFAULT_ROLE_PERMISSIONS } from "@/lib/permissions";
import bcrypt from "bcryptjs";

async function hashPin(pin: string) {
  return bcrypt.hash(pin, 10);
}

async function seed() {
  console.log("🌱 Seeding database...");

  // Clear existing data (in reverse order of dependencies)
  console.log("Clearing existing data...");
  const deleteTable = async (name: string, table: any) => {
    try {
      await db.delete(table);
      console.log(`  ✅ Deleted ${name}`);
    } catch (e) {
      console.error(`  ❌ Failed to delete ${name}:`, e instanceof Error ? e.message : e);
      // We don't throw here to allow subsequent deletions if one fails due to dependency order
    }
  };

  // 1. Logs & Dependencies
  await deleteTable("equipmentStatusLogs", schema.equipmentStatusLogs);
  await deleteTable("notifications", schema.notifications);
  await deleteTable("attachments", schema.attachments);
  await deleteTable("workOrderLogs", schema.workOrderLogs);
  await deleteTable("workOrderParts", schema.workOrderParts);
  await deleteTable("laborLogs", schema.laborLogs);
  await deleteTable("checklistCompletions", schema.checklistCompletions);
  await deleteTable("inventoryTransactions", schema.inventoryTransactions);
  await deleteTable("inventoryLevels", schema.inventoryLevels);
  await deleteTable("maintenanceChecklists", schema.maintenanceChecklists);
  await deleteTable("equipmentBoms", schema.equipmentBoms);

  // 2. Core Operational Data
  await deleteTable("maintenanceSchedules", schema.maintenanceSchedules);
  await deleteTable("workOrders", schema.workOrders);
  await deleteTable("equipment", schema.equipment);
  await deleteTable("spareParts", schema.spareParts);

  // 3. User & Role Management
  await deleteTable("users", schema.users);
  await deleteTable("roles", schema.roles);

  // 4. Reference Data
  await deleteTable("equipmentModels", schema.equipmentModels);
  await deleteTable("equipmentTypes", schema.equipmentTypes);
  await deleteTable("equipmentCategories", schema.equipmentCategories);
  await deleteTable("locations", schema.locations);
  await deleteTable("departments", schema.departments);

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

  const [managerRole] = await db
    .insert(schema.roles)
    .values({
      name: "manager",
      description: "Maintenance managers who oversee operations",
      permissions: DEFAULT_ROLE_PERMISSIONS.manager,
      isSystemRole: true,
    })
    .returning();

  console.log("Creating departments...");
  const [depProduction] = await db
    .insert(schema.departments)
    .values({
      name: "Production",
      code: "PROD",
      description: "Main production floor",
    })
    .returning();

  const [depFacilities] = await db
    .insert(schema.departments)
    .values({
      name: "Facilities",
      code: "FACI",
      description: "Building and utilities maintenance",
    })
    .returning();

  const [depLogistics] = await db
    .insert(schema.departments)
    .values({
      name: "Logistics",
      code: "LOGI",
      description: "Warehouse and transportation",
    })
    .returning();

  console.log("Creating locations...");
  const [locMain] = await db
    .insert(schema.locations)
    .values({
      name: "Main Production Line",
      code: "MAIN-PROD",
      description: "Primary assembly area",
    })
    .returning();

  const [locWh1] = await db
    .insert(schema.locations)
    .values({
      name: "Warehouse A",
      code: "WH-A",
      description: "Raw material storage",
    })
    .returning();

  console.log("Creating users...");
  const hashedPin = await hashPin("1234");
  
  const [admin] = await db
    .insert(schema.users)
    .values({
      name: "System Administrator",
      employeeId: "ADMIN001",
      email: "admin@fixit.com",
      roleId: adminRole.id,
      departmentId: depFacilities.id,
      pin: hashedPin,
    })
    .returning();

  const [techJohn] = await db
    .insert(schema.users)
    .values({
      name: "John Technician",
      employeeId: "TECH001",
      email: "john@fixit.com",
      roleId: techRole.id,
      departmentId: depProduction.id,
      pin: hashedPin,
    })
    .returning();

  const [techSarah] = await db
    .insert(schema.users)
    .values({
      name: "Sarah Technician",
      employeeId: "TECH002",
      email: "sarah@fixit.com",
      roleId: techRole.id,
      departmentId: depFacilities.id,
      pin: hashedPin,
    })
    .returning();

  const [operatorMike] = await db
    .insert(schema.users)
    .values({
      name: "Mike Operator",
      employeeId: "OPER001",
      email: "mike@fixit.com",
      roleId: operatorRole.id,
      departmentId: depProduction.id,
      pin: hashedPin,
    })
    .returning();

  console.log("Creating equipment types/categories...");
  const [catProduction] = await db
    .insert(schema.equipmentCategories)
    .values({
      name: "PROD",
      label: "Production Equipment",
    })
    .returning();

  const [typeCnc] = await db
    .insert(schema.equipmentTypes)
    .values({
      name: "CNC Machine",
      code: "CNC",
      categoryId: catProduction.id,
    })
    .returning();

  console.log("Creating equipment...");
  const [machine01] = await db
    .insert(schema.equipment)
    .values({
      name: "CNC Milling Machine 01",
      code: "CNC-01",
      status: "operational",
      locationId: locMain.id,
      departmentId: depProduction.id,
      typeId: typeCnc.id,
      ownerId: techJohn.id,
    })
    .returning();

  const [hvac01] = await db
    .insert(schema.equipment)
    .values({
      name: "Air Handling Unit 01",
      code: "AHU-01",
      status: "operational",
      locationId: locMain.id,
      departmentId: depFacilities.id,
      typeId: typeCnc.id, // Reusing for seed
      ownerId: techSarah.id,
    })
    .returning();

  console.log("Creating work orders...");
  await db.insert(schema.workOrders).values([
    {
      title: "Routine CNC Maintenance",
      description: "Monthly spindle check and lubrication",
      priority: "medium",
      status: "open",
      type: "maintenance",
      equipmentId: machine01.id,
      departmentId: depProduction.id,
      reportedById: admin.id,
      assignedToId: techJohn.id,
      dueBy: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    {
      title: "HVAC Filter Replacement",
      description: "Replace secondary HEPA filters",
      priority: "low",
      status: "in_progress",
      type: "maintenance",
      equipmentId: hvac01.id,
      departmentId: depFacilities.id,
      reportedById: admin.id,
      assignedToId: techSarah.id,
      dueBy: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
    {
      title: "Spindle Jam",
      description: "Machine stopped during high-speed milling",
      priority: "critical",
      status: "open",
      type: "breakdown",
      equipmentId: machine01.id,
      departmentId: depProduction.id,
      reportedById: operatorMike.id,
    },
  ]);

  console.log("✅ Seed completed successfully!");
}

seed().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});
