import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
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
  // Core tables (Deletions must happen from children to parents)
  await db.delete(schema.equipmentStatusLogs).catch(() => {});
  await db.delete(schema.notifications).catch(() => {});
  await db.delete(schema.attachments).catch(() => {});
  await db.delete(schema.workOrderLogs).catch(() => {});
  await db.delete(schema.maintenanceSchedules).catch(() => {});
  await db.delete(schema.workOrderParts).catch(() => {});
  await db.delete(schema.laborLogs).catch(() => {});
  await db.delete(schema.workOrders).catch(() => {});
  await db.delete(schema.equipment).catch(() => {});

  // Dependency tables
  await db.delete(schema.inventoryTransactions).catch(() => {});
  await db.delete(schema.inventoryLevels).catch(() => {});
  await db.delete(schema.checklistCompletions).catch(() => {});
  await db.delete(schema.maintenanceChecklists).catch(() => {});
  await db.delete(schema.equipmentBoms).catch(() => {});
  await db.delete(schema.equipmentModels).catch(() => {});
  await db.delete(schema.spareParts).catch(() => {});
  await db.delete(schema.equipmentTypes).catch(() => {});
  await db.delete(schema.equipmentCategories).catch(() => {});
  await db.delete(schema.locations).catch(() => {});
  await db.delete(schema.users).catch(() => {});
  await db.delete(schema.departments).catch(() => {});
  await db.delete(schema.roles).catch(() => {});

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

  console.log("Creating departments...");
  const [deptAssy] = await db
    .insert(schema.departments)
    .values({
      name: "Assembly",
      code: "ASSY",
      description: "Final product assembly and packaging lines",
    })
    .returning();

  const [deptMold] = await db
    .insert(schema.departments)
    .values({
      name: "Molding",
      code: "MOLD",
      description: "Injection molding and raw material processing",
    })
    .returning();

  const [deptWhse] = await db
    .insert(schema.departments)
    .values({
      name: "Warehouse",
      code: "WHSE",
      description: "Logistics, storage, and shipping/receiving",
    })
    .returning();

  const [deptFclt] = await db
    .insert(schema.departments)
    .values({
      name: "Facilities",
      code: "FCLT",
      description: "Utility systems, building maintenance, and HVAC",
    })
    .returning();

  console.log("Created 4 departments");

  // Create users
  console.log("Creating users...");
  // 6-digit PINs for improved security (1 million combinations vs 10,000 for 4-digit)
  const adminPin = await hashPin("123456");
  const techPin = await hashPin("567890");
  const operatorPin = await hashPin("000000");

  await db.insert(schema.users).values({
    employeeId: "ADMIN-001",
    name: "System Admin",
    email: "admin@fixit.local",
    pin: adminPin,
    roleId: adminRole.id,
    isActive: true,
  });

  // Molding Dept
  const [moldManager] = await db
    .insert(schema.users)
    .values({
      employeeId: "MGT-MOLD",
      name: "Robert Chen",
      email: "robert.chen@fixit.local",
      pin: adminPin,
      roleId: adminRole.id,
      departmentId: deptMold.id,
      isActive: true,
    })
    .returning();

  const [techMold1] = await db
    .insert(schema.users)
    .values({
      employeeId: "TECH-MOLD-01",
      name: "John Smith",
      email: "john.smith@fixit.local",
      pin: techPin,
      roleId: techRole.id,
      departmentId: deptMold.id,
      isActive: true,
    })
    .returning();

  await db
    .insert(schema.users)
    .values({
      employeeId: "TECH-MOLD-02",
      name: "Maria Garcia",
      email: "maria.garcia@fixit.local",
      pin: techPin,
      roleId: techRole.id,
      departmentId: deptMold.id,
      isActive: true,
    })
    .returning();

  // Assembly Dept
  const [assyManager] = await db
    .insert(schema.users)
    .values({
      employeeId: "MGT-ASSY",
      name: "Linda Wu",
      email: "linda.wu@fixit.local",
      pin: adminPin,
      roleId: adminRole.id,
      departmentId: deptAssy.id,
      isActive: true,
    })
    .returning();

  const [techAssy1] = await db
    .insert(schema.users)
    .values({
      employeeId: "TECH-ASSY-01",
      name: "David Miller",
      email: "david.miller@fixit.local",
      pin: techPin,
      roleId: techRole.id,
      departmentId: deptAssy.id,
      isActive: true,
    })
    .returning();

  // Warehouse Dept
  const [whseManager] = await db
    .insert(schema.users)
    .values({
      employeeId: "MGT-WHSE",
      name: "Jim Barker",
      email: "jim.barker@fixit.local",
      pin: adminPin,
      roleId: adminRole.id,
      departmentId: deptWhse.id,
      isActive: true,
    })
    .returning();

  await db
    .insert(schema.users)
    .values({
      employeeId: "TECH-WHSE-01",
      name: "Alice Thompson",
      email: "alice.thompson@fixit.local",
      pin: techPin,
      roleId: techRole.id,
      departmentId: deptWhse.id,
      isActive: true,
    })
    .returning();

  // Facilities Dept
  const [fcltManager] = await db
    .insert(schema.users)
    .values({
      employeeId: "MGT-FCLT",
      name: "George Harris",
      email: "george.harris@fixit.local",
      pin: adminPin,
      roleId: adminRole.id,
      departmentId: deptFclt.id,
      isActive: true,
    })
    .returning();

  await db
    .insert(schema.users)
    .values({
      employeeId: "TECH-FCLT-01",
      name: "Kevin Brown",
      email: "kevin.brown@fixit.local",
      pin: techPin,
      roleId: techRole.id,
      departmentId: deptFclt.id,
      isActive: true,
    })
    .returning();

  // Operators
  const [operator1] = await db
    .insert(schema.users)
    .values({
      employeeId: "OP-001",
      name: "Mike Johnson",
      email: null,
      pin: operatorPin,
      roleId: operatorRole.id,
      departmentId: deptAssy.id,
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
      departmentId: deptMold.id,
      isActive: true,
    })
    .returning();

  // More operators for different departments
  const [operator3] = await db
    .insert(schema.users)
    .values({
      employeeId: "OP-003",
      name: "Carlos Rodriguez",
      email: null,
      pin: operatorPin,
      roleId: operatorRole.id,
      departmentId: deptMold.id,
      isActive: true,
    })
    .returning();

  const [operator4] = await db
    .insert(schema.users)
    .values({
      employeeId: "OP-004",
      name: "Jennifer Lee",
      email: null,
      pin: operatorPin,
      roleId: operatorRole.id,
      departmentId: deptWhse.id,
      isActive: true,
    })
    .returning();

  await db.insert(schema.users).values([
    {
      employeeId: "OP-005",
      name: "Marcus Thompson",
      email: null,
      pin: operatorPin,
      roleId: operatorRole.id,
      departmentId: deptAssy.id,
      isActive: true,
    },
    {
      employeeId: "OP-006",
      name: "Amanda Chen",
      email: null,
      pin: operatorPin,
      roleId: operatorRole.id,
      departmentId: deptFclt.id,
      isActive: true,
    },
  ]);

  // Update department managers
  await db
    .update(schema.departments)
    .set({ managerId: assyManager.id })
    .where(eq(schema.departments.id, deptAssy.id));
  await db
    .update(schema.departments)
    .set({ managerId: moldManager.id })
    .where(eq(schema.departments.id, deptMold.id));
  await db
    .update(schema.departments)
    .set({ managerId: whseManager.id })
    .where(eq(schema.departments.id, deptWhse.id));
  await db
    .update(schema.departments)
    .set({ managerId: fcltManager.id })
    .where(eq(schema.departments.id, deptFclt.id));

  console.log("Created users and linked session managers");

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
      departmentId: deptMold.id,
      ownerId: moldManager.id,
      status: "operational",
    })
    .returning();

  // Sub-assets for Injection Molder A
  await db.insert(schema.equipment).values([
    {
      name: "IM-A Hydraulic Pump",
      code: "IM-001-PUMP",
      typeId: typeMolder.id,
      locationId: moldingArea.id,
      departmentId: deptMold.id,
      parentId: equipment1.id,
      status: "operational",
    },
    {
      name: "IM-A Control Panel",
      code: "IM-001-CTRL",
      typeId: typeMolder.id,
      locationId: moldingArea.id,
      departmentId: deptMold.id,
      parentId: equipment1.id,
      status: "operational",
    },
  ]);

  const [equipment2] = await db
    .insert(schema.equipment)
    .values({
      name: "Injection Molder B",
      code: "IM-002",
      typeId: typeMolder.id,
      locationId: moldingArea.id,
      departmentId: deptMold.id,
      ownerId: moldManager.id,
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
      departmentId: deptAssy.id,
      ownerId: assyManager.id,
      status: "operational",
    })
    .returning();

  // Sub-asset for Conveyor 1
  await db.insert(schema.equipment).values({
    name: "CONV-1 Drive Motor",
    code: "CONV-001-MTR",
    typeId: typeConveyor.id,
    locationId: lineA1.id,
    departmentId: deptAssy.id,
    parentId: equipment3.id,
    status: "operational",
  });

  const [equipment4] = await db
    .insert(schema.equipment)
    .values({
      name: "Packaging Robot",
      code: "PKG-001",
      typeId: typeRobot.id,
      locationId: lineA1.id,
      departmentId: deptAssy.id,
      ownerId: assyManager.id,
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
      departmentId: deptAssy.id,
      ownerId: null,
      status: "down",
    })
    .returning();

  await db.insert(schema.equipment).values({
    name: "Quality Scanner",
    code: "QS-001",
    typeId: typeScanner.id,
    locationId: lineA2.id,
    departmentId: deptAssy.id,
    ownerId: assyManager.id,
    status: "operational",
  });

  console.log(`Created ${9} equipment (including hierarchical sub-assets)`);
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
      reportedById: operator1.id,
      assignedToId: techAssy1.id, // Assembly Tech
      departmentId: deptAssy.id,
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
      reportedById: operator1.id,
      assignedToId: techAssy1.id,
      departmentId: deptAssy.id,
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
      reportedById: operator2.id,
      assignedToId: techMold1.id,
      departmentId: deptMold.id,
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
      reportedById: operator1.id,
      assignedToId: techAssy1.id,
      departmentId: deptAssy.id,
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

  // Add resolved and closed work orders for historical data
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  await db.insert(schema.workOrders).values([
    {
      equipmentId: equipment1.id,
      type: "maintenance",
      reportedById: operator2.id,
      assignedToId: techMold1.id,
      departmentId: deptMold.id,
      title: "Hydraulic fluid change",
      description:
        "Scheduled hydraulic fluid replacement as per maintenance schedule.",
      priority: "medium",
      status: "resolved",
      resolutionNotes: "Drained old fluid, replaced filter, refilled with ISO 46 hydraulic oil.",
      dueBy: oneDayAgo,
      resolvedAt: new Date(oneDayAgo.getTime() - 2 * 60 * 60 * 1000),
      createdAt: twoDaysAgo,
      updatedAt: oneDayAgo,
    },
    {
      equipmentId: equipment2.id,
      type: "breakdown",
      reportedById: operator3.id,
      assignedToId: techMold1.id,
      departmentId: deptMold.id,
      title: "Mold ejector pin jammed",
      description:
        "Ejector pins not retracting properly. Parts getting stuck in mold.",
      priority: "high",
      status: "closed",
      resolutionNotes: "Replaced worn ejector pins and lubricated guide bushings. Tested 50 cycles successfully.",
      dueBy: threeDaysAgo,
      resolvedAt: new Date(threeDaysAgo.getTime() + 4 * 60 * 60 * 1000),
      createdAt: threeDaysAgo,
      updatedAt: twoDaysAgo,
    },
    {
      equipmentId: equipment3.id,
      type: "breakdown",
      reportedById: operator1.id,
      assignedToId: techAssy1.id,
      departmentId: deptAssy.id,
      title: "Conveyor belt slipping",
      description:
        "Belt is slipping under load. Products not moving at correct speed.",
      priority: "high",
      status: "closed",
      resolutionNotes: "Increased belt tension and replaced worn drive roller. Belt tracking adjusted.",
      dueBy: oneWeekAgo,
      resolvedAt: new Date(oneWeekAgo.getTime() + 3 * 60 * 60 * 1000),
      createdAt: oneWeekAgo,
      updatedAt: new Date(oneWeekAgo.getTime() + 24 * 60 * 60 * 1000),
    },
    {
      equipmentId: equipment4.id,
      type: "upgrade",
      reportedById: assyManager.id,
      assignedToId: techAssy1.id,
      departmentId: deptAssy.id,
      title: "Gripper sensor upgrade",
      description:
        "Install new optical sensors on gripper to improve pick accuracy.",
      priority: "low",
      status: "open",
      dueBy: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      createdAt: oneDayAgo,
      updatedAt: oneDayAgo,
    },
    {
      equipmentId: equipment5.id,
      type: "calibration",
      reportedById: operator1.id,
      assignedToId: techAssy1.id,
      departmentId: deptAssy.id,
      title: "Spindle alignment check",
      description:
        "Routine spindle alignment verification for precision machining.",
      priority: "medium",
      status: "resolved",
      resolutionNotes: "Runout measured at 0.0004\". Within specification. No adjustment needed.",
      dueBy: twoDaysAgo,
      resolvedAt: twoDaysAgo,
      createdAt: threeDaysAgo,
      updatedAt: twoDaysAgo,
    },
    {
      equipmentId: equipment2.id,
      type: "maintenance",
      reportedById: operator3.id,
      assignedToId: null,
      departmentId: deptMold.id,
      title: "Cooling channel inspection",
      description:
        "Check cooling channels for blockage. Cycle times increasing.",
      priority: "medium",
      status: "open",
      dueBy: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      createdAt: now,
      updatedAt: now,
    },
  ]);

  console.log(`Created ${10} work orders`);

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
      userId: techAssy1.id,
      type: "work_order_assigned",
      title: "New Work Order Assigned",
      message: "You have been assigned to work order: CNC Mill not powering on",
      link: "/maintenance/work-orders/1",
      isRead: false,
    },
    {
      userId: techAssy1.id,
      type: "work_order_created",
      title: "Critical Work Order Created",
      message: "Emergency stop button sticking - Conveyor System 1",
      link: "/maintenance/work-orders/4",
      isRead: false,
    },
    {
      userId: techAssy1.id,
      type: "work_order_assigned",
      title: "New Work Order Assigned",
      message:
        "You have been assigned to work order: Scheduled gripper replacement",
      link: "/maintenance/work-orders/2",
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
      changedById: techAssy1.id,
      changedAt: twoHoursAgo,
    },
  ]);

  console.log(`Created ${2} equipment status logs`);

  // Create vendors
  console.log("Creating vendors...");
  const [vendor1] = await db
    .insert(schema.vendors)
    .values({
      name: "BearingWorld Inc.",
      code: "BWI",
      contactPerson: "Steve Martinez",
      email: "sales@bearingworld.com",
      phone: "+1-555-0101",
      website: "https://bearingworld.com",
      address: "123 Industrial Ave, Chicago, IL 60601",
      notes: "Primary bearing supplier. Fast shipping.",
      isActive: true,
    })
    .returning();

  const [vendor2] = await db
    .insert(schema.vendors)
    .values({
      name: "HydroTech Solutions",
      code: "HTS",
      contactPerson: "Patricia Wong",
      email: "orders@hydrotech.com",
      phone: "+1-555-0202",
      website: "https://hydrotechsolutions.com",
      address: "456 Fluid Dr, Houston, TX 77001",
      notes: "Hydraulic components and filters. 30-day terms.",
      isActive: true,
    })
    .returning();

  const [vendor3] = await db
    .insert(schema.vendors)
    .values({
      name: "Industrial Belts & Drives",
      code: "IBD",
      contactPerson: "Michael Davis",
      email: "info@industrialbelts.net",
      phone: "+1-555-0303",
      website: "https://industrialbelts.net",
      address: "789 Power Blvd, Detroit, MI 48201",
      notes: "Belt and chain supplier. Bulk discounts available.",
      isActive: true,
    })
    .returning();

  const [vendor4] = await db
    .insert(schema.vendors)
    .values({
      name: "SafetyFirst Equipment",
      code: "SFE",
      contactPerson: "Rachel Green",
      email: "safety@safetyfirst.com",
      phone: "+1-555-0404",
      website: "https://safetyfirst.com",
      address: "321 Guard St, Columbus, OH 43201",
      notes: "Safety equipment and PPE. Emergency orders accepted.",
      isActive: true,
    })
    .returning();

  await db.insert(schema.vendors).values({
    name: "MRO Supplies Co.",
    code: "MRO",
    contactPerson: "Tom Johnson",
    email: "orders@mrosupplies.com",
    phone: "+1-555-0505",
    website: "https://mrosupplies.com",
    address: "555 Maintenance Way, Cleveland, OH 44101",
    notes: "General MRO supplies. Weekly delivery.",
    isActive: true,
  });

  console.log(`Created ${5} vendors`);

  // Create spare parts (using valid partCategories enum values)
  console.log("Creating spare parts...");
  const [part1] = await db
    .insert(schema.spareParts)
    .values({
      sku: "BRG-6205",
      name: "Ball Bearing 6205",
      description: "Deep groove ball bearing for motors",
      category: "mechanical",
      vendorId: vendor1.id,
      unitCost: 12.5,
      reorderPoint: 10,
      leadTimeDays: 3,
    })
    .returning();

  const [part2] = await db
    .insert(schema.spareParts)
    .values({
      sku: "FLT-HYD-01",
      name: "Hydraulic Filter",
      description: "Replacement hydraulic filter for injection molders",
      category: "hydraulic",
      vendorId: vendor2.id,
      unitCost: 45.0,
      reorderPoint: 5,
      leadTimeDays: 7,
    })
    .returning();

  const [part3] = await db
    .insert(schema.spareParts)
    .values({
      sku: "BLT-V-38",
      name: "V-Belt 38 inch",
      description: "Industrial V-belt for conveyors",
      category: "mechanical",
      vendorId: vendor3.id,
      unitCost: 18.75,
      reorderPoint: 8,
      leadTimeDays: 5,
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
      leadTimeDays: 2,
    })
    .returning();

  // Additional spare parts
  await db.insert(schema.spareParts).values([
    {
      sku: "MTR-230V-1HP",
      name: "Electric Motor 1HP 230V",
      description: "Single phase electric motor for conveyors",
      category: "electrical",
      vendorId: vendor1.id,
      unitCost: 285.0,
      reorderPoint: 2,
      leadTimeDays: 14,
    },
    {
      sku: "SEAL-HYD-50",
      name: "Hydraulic Seal Kit 50mm",
      description: "Complete seal kit for 50mm hydraulic cylinders",
      category: "hydraulic",
      vendorId: vendor2.id,
      unitCost: 67.5,
      reorderPoint: 4,
      leadTimeDays: 10,
    },
    {
      sku: "GLOVES-CUT-L",
      name: "Cut Resistant Gloves (Large)",
      description: "Level A4 cut resistant work gloves",
      category: "safety",
      vendorId: vendor4.id,
      unitCost: 15.99,
      reorderPoint: 24,
      leadTimeDays: 3,
    },
    {
      sku: "SENS-PROX-12",
      name: "Proximity Sensor 12mm",
      description: "Inductive proximity sensor for automation",
      category: "electrical",
      unitCost: 42.0,
      reorderPoint: 6,
      leadTimeDays: 5,
    },
    {
      sku: "CHAIN-40-10",
      name: "Roller Chain #40 10ft",
      description: "Standard roller chain for power transmission",
      category: "mechanical",
      vendorId: vendor3.id,
      unitCost: 35.0,
      reorderPoint: 3,
      leadTimeDays: 4,
    },
    {
      sku: "OIL-HYD-5GAL",
      name: "Hydraulic Oil AW46 5gal",
      description: "Anti-wear hydraulic fluid ISO 46",
      category: "consumable",
      vendorId: vendor2.id,
      unitCost: 89.99,
      reorderPoint: 4,
      leadTimeDays: 2,
    },
  ]);

  console.log(`Created ${10} spare parts`);

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
      createdById: moldManager.id,
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      partId: part2.id,
      locationId: hallB.id,
      type: "in",
      quantity: 20,
      reference: "PO-2024-002",
      createdById: moldManager.id,
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      partId: part1.id,
      locationId: hallB.id,
      type: "out",
      quantity: 5,
      reference: "TKT-001",
      createdById: techMold1.id,
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
      userId: techAssy1.id,
      startTime: new Date(now.getTime() - 90 * 60 * 1000),
      endTime: new Date(now.getTime() - 30 * 60 * 1000),
      notes: "Diagnosed power supply issue",
    },
    {
      workOrderId: workOrder2.id,
      userId: techAssy1.id,
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
      addedById: techAssy1.id,
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
    completedById: techAssy1.id,
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
      createdById: techAssy1.id,
      createdAt: oneHourAgo,
    },
    {
      workOrderId: workOrder2.id,
      action: "assignment",
      oldValue: null,
      newValue: "Linda Wu",
      createdById: techAssy1.id,
      createdAt: twoHoursAgo,
    },
    {
      workOrderId: workOrder1.id,
      action: "comment",
      newValue: "Started diagnostics on power supply",
      createdById: techAssy1.id,
      createdAt: oneHourAgo,
    },
  ]);

  console.log(`Created ${3} work order logs`);

  console.log("\n✅ Database seeded successfully!");
  console.log(
    "\n📋 Default credentials (6-digit PINs for security):"
  );
  console.log("  ─────────────────────────────────────────────────");
  console.log("  Role          Employee ID      PIN");
  console.log("  ─────────────────────────────────────────────────");
  console.log("  Admin/Mgt     ADMIN-001        123456");
  console.log("  Admin/Mgt     MGT-MOLD         123456");
  console.log("  Admin/Mgt     MGT-ASSY         123456");
  console.log("  Admin/Mgt     MGT-WHSE         123456");
  console.log("  Admin/Mgt     MGT-FCLT         123456");
  console.log("  ─────────────────────────────────────────────────");
  console.log("  Tech          TECH-MOLD-01     567890");
  console.log("  Tech          TECH-MOLD-02     567890");
  console.log("  Tech          TECH-ASSY-01     567890");
  console.log("  Tech          TECH-WHSE-01     567890");
  console.log("  Tech          TECH-FCLT-01     567890");
  console.log("  ─────────────────────────────────────────────────");
  console.log("  Operator      OP-001           000000");
  console.log("  Operator      OP-002           000000");
  console.log("  Operator      OP-003           000000");
  console.log("  Operator      OP-004           000000");
  console.log("  Operator      OP-005           000000");
  console.log("  Operator      OP-006           000000");
  console.log("  ─────────────────────────────────────────────────");
  console.log("\n📊 Seeded data summary:");
  console.log("  • 3 roles, 4 departments, 16 users");
  console.log("  • 6 locations, 9 equipment (with sub-assets)");
  console.log("  • 10 work orders (open, in_progress, resolved, closed)");
  console.log("  • 5 vendors, 10 spare parts");
  console.log("  • Maintenance schedules, checklists, inventory levels");
}

seed()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  });
