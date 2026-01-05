// Native Bun.password is used instead of bcryptjs

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getWorkOrderPath } from "../lib/format-ids";
import { DEFAULT_ROLE_PERMISSIONS, PERMISSIONS } from "../lib/permissions";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://fixit:fixitpassword@127.0.0.1:5433/fixit";
const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function hashPin(pin: string): Promise<string> {
  return Bun.password.hash(pin, {
    algorithm: "bcrypt",
    cost: 10,
  });
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

async function seed() {
  console.log("🌱 Seeding database with comprehensive data...\n");

  try {
    // Clear existing data
    console.log("Clearing existing data...");
    await db
      .delete(schema.auditLogs)
      .catch(() => console.log("      (Skipped auditLogs)"));
    await db
      .delete(schema.notifications)
      .catch(() => console.log("      (Skipped notifications)"));
    await db
      .delete(schema.equipmentStatusLogs)
      .catch(() => console.log("      (Skipped equipmentStatusLogs)"));
    await db
      .delete(schema.workOrderLogs)
      .catch(() => console.log("      (Skipped workOrderLogs)"));
    await db
      .delete(schema.workOrderParts)
      .catch(() => console.log("      (Skipped workOrderParts)"));
    await db
      .delete(schema.laborLogs)
      .catch(() => console.log("      (Skipped laborLogs)"));
    await db
      .delete(schema.checklistCompletions)
      .catch(() => console.log("      (Skipped checklistCompletions)"));
    await db
      .delete(schema.meterReadings)
      .catch(() => console.log("      (Skipped meterReadings)"));
    await db
      .delete(schema.inventoryTransactions)
      .catch(() => console.log("      (Skipped inventoryTransactions)"));
    await db
      .delete(schema.attachments)
      .catch(() => console.log("      (Skipped attachments)"));
    await db
      .delete(schema.userFavorites)
      .catch(() => console.log("      (Skipped userFavorites)"));
    await db
      .delete(schema.maintenanceChecklists)
      .catch(() => console.log("      (Skipped maintenanceChecklists)"));
    await db
      .delete(schema.reportSchedules)
      .catch(() => console.log("      (Skipped reportSchedules)"));
    await db
      .delete(schema.reportTemplates)
      .catch(() => console.log("      (Skipped reportTemplates)"));
    await db
      .delete(schema.workOrderTemplates)
      .catch(() => console.log("      (Skipped workOrderTemplates)"));
    await db
      .delete(schema.workOrders)
      .catch(() => console.log("      (Skipped workOrders)"));
    await db
      .delete(schema.maintenanceSchedules)
      .catch(() => console.log("      (Skipped maintenanceSchedules)"));
    await db
      .delete(schema.equipmentMeters)
      .catch(() => console.log("      (Skipped equipmentMeters)"));
    await db
      .delete(schema.downtimeLogs)
      .catch(() => console.log("      (Skipped downtimeLogs)"));
    await db
      .delete(schema.equipmentBoms)
      .catch(() => console.log("      (Skipped equipmentBoms)"));
    await db
      .delete(schema.inventoryLevels)
      .catch(() => console.log("      (Skipped inventoryLevels)"));
    await db
      .delete(schema.spareParts)
      .catch(() => console.log("      (Skipped spareParts)"));
    await db
      .delete(schema.equipment)
      .catch(() => console.log("      (Skipped equipment)"));
    await db
      .delete(schema.equipmentModels)
      .catch(() => console.log("      (Skipped equipmentModels)"));
    await db
      .delete(schema.equipmentTypes)
      .catch(() => console.log("      (Skipped equipmentTypes)"));
    await db
      .delete(schema.equipmentCategories)
      .catch(() => console.log("      (Skipped equipmentCategories)"));
    await db
      .delete(schema.vendors)
      .catch(() => console.log("      (Skipped vendors)"));
    await db
      .delete(schema.locations)
      .catch(() => console.log("      (Skipped locations)"));
    await db
      .delete(schema.users)
      .catch(() => console.log("      (Skipped users)"));
    await db.update(schema.departments).set({ managerId: null }); // Break manager circularity
    await db
      .delete(schema.departments)
      .catch(() => console.log("      (Skipped departments)"));
    await db
      .delete(schema.roles)
      .catch(() => console.log("      (Skipped roles)"));
    await db
      .delete(schema.systemSettings)
      .catch(() => console.log("      (Skipped systemSettings)"));

    // ==================== ROLES ====================
    console.log("Creating roles...");
    const [operatorRole, techRole, adminRole, supervisorRole] = await db
      .insert(schema.roles)
      .values([
        {
          name: "operator",
          description: "Factory floor operators who report issues",
          permissions: DEFAULT_ROLE_PERMISSIONS.operator,
          isSystemRole: true,
        },
        {
          name: "tech",
          description: "Maintenance technicians who resolve work orders",
          permissions: DEFAULT_ROLE_PERMISSIONS.tech,
          isSystemRole: true,
        },
        {
          name: "admin",
          description: "System administrators with full access",
          permissions: DEFAULT_ROLE_PERMISSIONS.admin,
          isSystemRole: true,
        },
        {
          name: "supervisor",
          description: "Team supervisors with elevated permissions",
          permissions: [
            ...DEFAULT_ROLE_PERMISSIONS.tech,
            PERMISSIONS.EQUIPMENT_ATTACHMENT_DELETE,
            PERMISSIONS.REPORTS_VIEW,
            PERMISSIONS.USER_VIEW,
          ],
          isSystemRole: false,
        },
      ])
      .returning();
    console.log("  ✓ Created 4 roles");

    // ==================== DEPARTMENTS ====================
    console.log("Creating departments...");
    const [deptAssy, deptMold, deptWhse, deptFclt, deptQC, deptMaint] = await db
      .insert(schema.departments)
      .values([
        {
          name: "Assembly",
          code: "ASSY",
          description: "Final product assembly and packaging lines",
        },
        {
          name: "Molding",
          code: "MOLD",
          description: "Injection molding and raw material processing",
        },
        {
          name: "Warehouse",
          code: "WHSE",
          description: "Logistics, storage, and shipping/receiving",
        },
        {
          name: "Facilities",
          code: "FCLT",
          description: "Utility systems, building maintenance, and HVAC",
        },
        {
          name: "Quality Control",
          code: "QC",
          description: "Quality assurance and inspection",
        },
        {
          name: "Maintenance",
          code: "MAINT",
          description: "Equipment maintenance and repair",
        },
      ])
      .returning();
    console.log("  ✓ Created 6 departments");

    // ==================== USERS ====================
    console.log("Creating users...");
    const adminPin = await hashPin("123456");
    const techPin = await hashPin("567890");
    const operatorPin = await hashPin("000000");

    // Admins and Managers
    const [_sysAdmin] = await db
      .insert(schema.users)
      .values({
        employeeId: "ADMIN-001",
        name: "System Admin",
        email: "admin@fixit.local",
        pin: adminPin,
        roleId: adminRole.id,
        isActive: true,
      })
      .returning();
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
        hourlyRate: 55,
      })
      .returning();
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
        hourlyRate: 55,
      })
      .returning();
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
        hourlyRate: 50,
      })
      .returning();
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
        hourlyRate: 52,
      })
      .returning();
    const [qcManager] = await db
      .insert(schema.users)
      .values({
        employeeId: "MGT-QC",
        name: "Patricia Lee",
        email: "patricia.lee@fixit.local",
        pin: adminPin,
        roleId: supervisorRole.id,
        departmentId: deptQC.id,
        isActive: true,
        hourlyRate: 48,
      })
      .returning();
    const [maintManager] = await db
      .insert(schema.users)
      .values({
        employeeId: "MGT-MAINT",
        name: "Michael Torres",
        email: "michael.torres@fixit.local",
        pin: adminPin,
        roleId: adminRole.id,
        departmentId: deptMaint.id,
        isActive: true,
        hourlyRate: 58,
      })
      .returning();

    // Technicians
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
        hourlyRate: 35,
      })
      .returning();
    const [_techMold2] = await db
      .insert(schema.users)
      .values({
        employeeId: "TECH-MOLD-02",
        name: "Maria Garcia",
        email: "maria.garcia@fixit.local",
        pin: techPin,
        roleId: techRole.id,
        departmentId: deptMold.id,
        isActive: true,
        hourlyRate: 35,
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
        hourlyRate: 34,
      })
      .returning();
    const [techAssy2] = await db
      .insert(schema.users)
      .values({
        employeeId: "TECH-ASSY-02",
        name: "Emily Davis",
        email: "emily.davis@fixit.local",
        pin: techPin,
        roleId: techRole.id,
        departmentId: deptAssy.id,
        isActive: true,
        hourlyRate: 34,
      })
      .returning();
    const [_techWhse1] = await db
      .insert(schema.users)
      .values({
        employeeId: "TECH-WHSE-01",
        name: "Alice Thompson",
        email: "alice.thompson@fixit.local",
        pin: techPin,
        roleId: techRole.id,
        departmentId: deptWhse.id,
        isActive: true,
        hourlyRate: 32,
      })
      .returning();
    const [techFclt1] = await db
      .insert(schema.users)
      .values({
        employeeId: "TECH-FCLT-01",
        name: "Kevin Brown",
        email: "kevin.brown@fixit.local",
        pin: techPin,
        roleId: techRole.id,
        departmentId: deptFclt.id,
        isActive: true,
        hourlyRate: 36,
      })
      .returning();
    const [techFclt2] = await db
      .insert(schema.users)
      .values({
        employeeId: "TECH-FCLT-02",
        name: "Rachel Green",
        email: "rachel.green@fixit.local",
        pin: techPin,
        roleId: techRole.id,
        departmentId: deptFclt.id,
        isActive: true,
        hourlyRate: 36,
      })
      .returning();
    const [techMaint1] = await db
      .insert(schema.users)
      .values({
        employeeId: "TECH-MAINT-01",
        name: "James Wilson",
        email: "james.wilson@fixit.local",
        pin: techPin,
        roleId: techRole.id,
        departmentId: deptMaint.id,
        isActive: true,
        hourlyRate: 38,
      })
      .returning();
    const [_techMaint2] = await db
      .insert(schema.users)
      .values({
        employeeId: "TECH-MAINT-02",
        name: "Sarah Martinez",
        email: "sarah.martinez@fixit.local",
        pin: techPin,
        roleId: techRole.id,
        departmentId: deptMaint.id,
        isActive: true,
        hourlyRate: 38,
      })
      .returning();

    // Operators
    const [op1] = await db
      .insert(schema.users)
      .values({
        employeeId: "OP-001",
        name: "Mike Johnson",
        pin: operatorPin,
        roleId: operatorRole.id,
        departmentId: deptAssy.id,
        isActive: true,
        hourlyRate: 22,
      })
      .returning();
    const [op2] = await db
      .insert(schema.users)
      .values({
        employeeId: "OP-002",
        name: "Sarah Wilson",
        pin: operatorPin,
        roleId: operatorRole.id,
        departmentId: deptMold.id,
        isActive: true,
        hourlyRate: 22,
      })
      .returning();
    const [_op3] = await db
      .insert(schema.users)
      .values({
        employeeId: "OP-003",
        name: "Carlos Rodriguez",
        pin: operatorPin,
        roleId: operatorRole.id,
        departmentId: deptMold.id,
        isActive: true,
        hourlyRate: 22,
      })
      .returning();
    const [op4] = await db
      .insert(schema.users)
      .values({
        employeeId: "OP-004",
        name: "Jennifer Lee",
        pin: operatorPin,
        roleId: operatorRole.id,
        departmentId: deptWhse.id,
        isActive: true,
        hourlyRate: 20,
      })
      .returning();
    await db.insert(schema.users).values([
      {
        employeeId: "OP-005",
        name: "Marcus Thompson",
        pin: operatorPin,
        roleId: operatorRole.id,
        departmentId: deptAssy.id,
        isActive: true,
        hourlyRate: 22,
      },
      {
        employeeId: "OP-006",
        name: "Amanda Chen",
        pin: operatorPin,
        roleId: operatorRole.id,
        departmentId: deptFclt.id,
        isActive: true,
        hourlyRate: 21,
      },
      {
        employeeId: "OP-007",
        name: "Derek Foster",
        pin: operatorPin,
        roleId: operatorRole.id,
        departmentId: deptMold.id,
        isActive: true,
        hourlyRate: 22,
      },
      {
        employeeId: "OP-008",
        name: "Nicole Adams",
        pin: operatorPin,
        roleId: operatorRole.id,
        departmentId: deptAssy.id,
        isActive: true,
        hourlyRate: 22,
      },
      {
        employeeId: "OP-009",
        name: "Brian Kelly",
        pin: operatorPin,
        roleId: operatorRole.id,
        departmentId: deptQC.id,
        isActive: true,
        hourlyRate: 23,
      },
      {
        employeeId: "OP-010",
        name: "Laura Wright",
        pin: operatorPin,
        roleId: operatorRole.id,
        departmentId: deptWhse.id,
        isActive: true,
        hourlyRate: 20,
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
    await db
      .update(schema.departments)
      .set({ managerId: qcManager.id })
      .where(eq(schema.departments.id, deptQC.id));
    await db
      .update(schema.departments)
      .set({ managerId: maintManager.id })
      .where(eq(schema.departments.id, deptMaint.id));
    console.log("  ✓ Created 27 users");

    // ==================== LOCATIONS ====================
    console.log("Creating locations...");
    const [mainBldg] = await db
      .insert(schema.locations)
      .values({
        name: "Main Building",
        code: "MAIN",
        description: "Primary manufacturing facility",
      })
      .returning();
    const [bldg2] = await db
      .insert(schema.locations)
      .values({
        name: "Building 2",
        code: "BLDG2",
        description: "Warehouse and logistics center",
      })
      .returning();
    const [hallA] = await db
      .insert(schema.locations)
      .values({
        name: "Hall A",
        code: "HALL-A",
        description: "Assembly and packaging",
        parentId: mainBldg.id,
      })
      .returning();
    const [hallB] = await db
      .insert(schema.locations)
      .values({
        name: "Hall B",
        code: "HALL-B",
        description: "Injection molding",
        parentId: mainBldg.id,
      })
      .returning();
    const [hallC] = await db
      .insert(schema.locations)
      .values({
        name: "Hall C",
        code: "HALL-C",
        description: "CNC and machining",
        parentId: mainBldg.id,
      })
      .returning();
    const [utilRoom] = await db
      .insert(schema.locations)
      .values({
        name: "Utility Room",
        code: "UTIL",
        description: "HVAC, compressors, electrical",
        parentId: mainBldg.id,
      })
      .returning();
    const [lineA1] = await db
      .insert(schema.locations)
      .values({
        name: "Assembly Line 1",
        code: "AL-01",
        description: "Primary assembly line",
        parentId: hallA.id,
      })
      .returning();
    const [lineA2] = await db
      .insert(schema.locations)
      .values({
        name: "Assembly Line 2",
        code: "AL-02",
        description: "Secondary assembly line",
        parentId: hallA.id,
      })
      .returning();
    const [lineA3] = await db
      .insert(schema.locations)
      .values({
        name: "Packaging Station",
        code: "PKG-01",
        description: "Packaging and boxing",
        parentId: hallA.id,
      })
      .returning();
    const [moldArea] = await db
      .insert(schema.locations)
      .values({
        name: "Molding Area",
        code: "MOLD",
        description: "Injection molding equipment",
        parentId: hallB.id,
      })
      .returning();
    const [moldQC] = await db
      .insert(schema.locations)
      .values({
        name: "Molding QC",
        code: "MOLD-QC",
        description: "Quality check station",
        parentId: hallB.id,
      })
      .returning();
    const [cncArea] = await db
      .insert(schema.locations)
      .values({
        name: "CNC Area",
        code: "CNC",
        description: "CNC machines and lathes",
        parentId: hallC.id,
      })
      .returning();
    const [whseMain] = await db
      .insert(schema.locations)
      .values({
        name: "Main Warehouse",
        code: "WH-MAIN",
        description: "Finished goods storage",
        parentId: bldg2.id,
      })
      .returning();
    const [whseRaw] = await db
      .insert(schema.locations)
      .values({
        name: "Raw Materials",
        code: "WH-RAW",
        description: "Raw materials storage",
        parentId: bldg2.id,
      })
      .returning();
    const [whseParts] = await db
      .insert(schema.locations)
      .values({
        name: "Spare Parts Storage",
        code: "WH-PARTS",
        description: "Maintenance spare parts",
        parentId: bldg2.id,
      })
      .returning();
    console.log("  ✓ Created 15 locations");

    // ==================== EQUIPMENT CATEGORIES ====================
    console.log("Creating equipment categories...");
    const [catM, catE, catI, catP, catH] = await db
      .insert(schema.equipmentCategories)
      .values([
        {
          name: "M",
          label: "Mechanical",
          description: "Mechanical equipment and machinery",
        },
        {
          name: "E",
          label: "Electrical",
          description: "Electrical panels, motors, and controls",
        },
        {
          name: "I",
          label: "Instrumentation",
          description: "Sensors, gauges, and precision instruments",
        },
        {
          name: "P",
          label: "Pneumatic",
          description: "Compressed air systems and pneumatic tools",
        },
        {
          name: "H",
          label: "HVAC",
          description: "Heating, ventilation, and air conditioning",
        },
      ])
      .returning();
    console.log("  ✓ Created 5 equipment categories");

    // ==================== EQUIPMENT TYPES ====================
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
    const [typeCNC] = await db
      .insert(schema.equipmentTypes)
      .values({
        categoryId: catM.id,
        name: "CNC Mill",
        code: "CNC",
        description: "Computer numerical control milling",
      })
      .returning();
    const [typeLathe] = await db
      .insert(schema.equipmentTypes)
      .values({
        categoryId: catM.id,
        name: "Lathe",
        code: "LATHE",
        description: "Turning lathe machine",
      })
      .returning();
    const [typeScanner] = await db
      .insert(schema.equipmentTypes)
      .values({
        categoryId: catI.id,
        name: "Quality Scanner",
        code: "SCAN",
        description: "Optical inspection scanner",
      })
      .returning();
    const [typeCompressor] = await db
      .insert(schema.equipmentTypes)
      .values({
        categoryId: catP.id,
        name: "Air Compressor",
        code: "COMP",
        description: "Industrial air compressor",
      })
      .returning();
    const [typeAHU] = await db
      .insert(schema.equipmentTypes)
      .values({
        categoryId: catH.id,
        name: "Air Handler",
        code: "AHU",
        description: "Air handling unit",
      })
      .returning();
    const [typeChiller] = await db
      .insert(schema.equipmentTypes)
      .values({
        categoryId: catH.id,
        name: "Chiller",
        code: "CHIL",
        description: "Process water chiller",
      })
      .returning();
    const [typeMCC] = await db
      .insert(schema.equipmentTypes)
      .values({
        categoryId: catE.id,
        name: "Motor Control Center",
        code: "MCC",
        description: "Motor control center panel",
      })
      .returning();
    const [typeForklift] = await db
      .insert(schema.equipmentTypes)
      .values({
        categoryId: catM.id,
        name: "Forklift",
        code: "FORK",
        description: "Material handling forklift",
      })
      .returning();
    console.log("  ✓ Created 11 equipment types");

    // ==================== EQUIPMENT ====================
    console.log("Creating equipment...");
    // Injection Molders
    const [im1] = await db
      .insert(schema.equipment)
      .values({
        name: "Injection Molder A",
        code: "IM-001",
        typeId: typeMolder.id,
        locationId: moldArea.id,
        departmentId: deptMold.id,
        ownerId: moldManager.id,
        status: "operational",
      })
      .returning();
    const [im2] = await db
      .insert(schema.equipment)
      .values({
        name: "Injection Molder B",
        code: "IM-002",
        typeId: typeMolder.id,
        locationId: moldArea.id,
        departmentId: deptMold.id,
        ownerId: moldManager.id,
        status: "operational",
      })
      .returning();
    const [im3] = await db
      .insert(schema.equipment)
      .values({
        name: "Injection Molder C",
        code: "IM-003",
        typeId: typeMolder.id,
        locationId: moldArea.id,
        departmentId: deptMold.id,
        ownerId: moldManager.id,
        status: "maintenance",
      })
      .returning();
    // Sub-components for IM-001
    await db.insert(schema.equipment).values([
      {
        name: "IM-A Hydraulic Pump",
        code: "IM-001-PUMP",
        typeId: typeMolder.id,
        locationId: moldArea.id,
        departmentId: deptMold.id,
        parentId: im1.id,
        status: "operational",
      },
      {
        name: "IM-A Control Panel",
        code: "IM-001-CTRL",
        typeId: typeMCC.id,
        locationId: moldArea.id,
        departmentId: deptMold.id,
        parentId: im1.id,
        status: "operational",
      },
      {
        name: "IM-A Mold Heater",
        code: "IM-001-HTR",
        typeId: typeMolder.id,
        locationId: moldArea.id,
        departmentId: deptMold.id,
        parentId: im1.id,
        status: "operational",
      },
    ]);

    // Conveyors
    const [conv1] = await db
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
    const [conv2] = await db
      .insert(schema.equipment)
      .values({
        name: "Conveyor System 2",
        code: "CONV-002",
        typeId: typeConveyor.id,
        locationId: lineA2.id,
        departmentId: deptAssy.id,
        ownerId: assyManager.id,
        status: "operational",
      })
      .returning();
    await db.insert(schema.equipment).values({
      name: "CONV-1 Drive Motor",
      code: "CONV-001-MTR",
      typeId: typeConveyor.id,
      locationId: lineA1.id,
      departmentId: deptAssy.id,
      parentId: conv1.id,
      status: "operational",
    });

    // Robots
    const [_robot1] = await db
      .insert(schema.equipment)
      .values({
        name: "Packaging Robot A",
        code: "PKG-001",
        typeId: typeRobot.id,
        locationId: lineA3.id,
        departmentId: deptAssy.id,
        ownerId: assyManager.id,
        status: "operational",
      })
      .returning();
    const [robot2] = await db
      .insert(schema.equipment)
      .values({
        name: "Palletizing Robot",
        code: "PAL-001",
        typeId: typeRobot.id,
        locationId: lineA3.id,
        departmentId: deptAssy.id,
        ownerId: assyManager.id,
        status: "maintenance",
      })
      .returning();

    // CNC Machines
    const [cnc1] = await db
      .insert(schema.equipment)
      .values({
        name: "CNC Mill 1",
        code: "CNC-001",
        typeId: typeCNC.id,
        locationId: cncArea.id,
        departmentId: deptAssy.id,
        status: "down",
      })
      .returning();
    const [_cnc2] = await db
      .insert(schema.equipment)
      .values({
        name: "CNC Mill 2",
        code: "CNC-002",
        typeId: typeCNC.id,
        locationId: cncArea.id,
        departmentId: deptAssy.id,
        status: "operational",
      })
      .returning();
    const [_lathe1] = await db
      .insert(schema.equipment)
      .values({
        name: "CNC Lathe 1",
        code: "LATHE-001",
        typeId: typeLathe.id,
        locationId: cncArea.id,
        departmentId: deptAssy.id,
        status: "operational",
      })
      .returning();

    // Quality Equipment
    const [scanner1] = await db
      .insert(schema.equipment)
      .values({
        name: "Quality Scanner 1",
        code: "QS-001",
        typeId: typeScanner.id,
        locationId: moldQC.id,
        departmentId: deptQC.id,
        ownerId: qcManager.id,
        status: "operational",
      })
      .returning();
    await db.insert(schema.equipment).values({
      name: "Quality Scanner 2",
      code: "QS-002",
      typeId: typeScanner.id,
      locationId: lineA2.id,
      departmentId: deptQC.id,
      ownerId: qcManager.id,
      status: "operational",
    });

    // Utilities
    const [comp1] = await db
      .insert(schema.equipment)
      .values({
        name: "Air Compressor 1",
        code: "COMP-001",
        typeId: typeCompressor.id,
        locationId: utilRoom.id,
        departmentId: deptFclt.id,
        ownerId: fcltManager.id,
        status: "operational",
      })
      .returning();
    const [comp2] = await db
      .insert(schema.equipment)
      .values({
        name: "Air Compressor 2",
        code: "COMP-002",
        typeId: typeCompressor.id,
        locationId: utilRoom.id,
        departmentId: deptFclt.id,
        ownerId: fcltManager.id,
        status: "operational",
      })
      .returning();
    const [ahu1] = await db
      .insert(schema.equipment)
      .values({
        name: "AHU Hall A",
        code: "AHU-001",
        typeId: typeAHU.id,
        locationId: utilRoom.id,
        departmentId: deptFclt.id,
        ownerId: fcltManager.id,
        status: "operational",
      })
      .returning();
    const [chiller1] = await db
      .insert(schema.equipment)
      .values({
        name: "Process Chiller 1",
        code: "CHIL-001",
        typeId: typeChiller.id,
        locationId: utilRoom.id,
        departmentId: deptFclt.id,
        ownerId: fcltManager.id,
        status: "operational",
      })
      .returning();

    // Warehouse
    const [fork1] = await db
      .insert(schema.equipment)
      .values({
        name: "Forklift 1",
        code: "FORK-001",
        typeId: typeForklift.id,
        locationId: whseMain.id,
        departmentId: deptWhse.id,
        ownerId: whseManager.id,
        status: "operational",
      })
      .returning();
    await db.insert(schema.equipment).values([
      {
        name: "Forklift 2",
        code: "FORK-002",
        typeId: typeForklift.id,
        locationId: whseMain.id,
        departmentId: deptWhse.id,
        ownerId: whseManager.id,
        status: "operational",
      },
      {
        name: "Forklift 3",
        code: "FORK-003",
        typeId: typeForklift.id,
        locationId: whseRaw.id,
        departmentId: deptWhse.id,
        ownerId: whseManager.id,
        status: "maintenance",
      },
    ]);
    console.log("  ✓ Created 28 equipment items");

    // ==================== VENDORS ====================
    console.log("Creating vendors...");
    const [vendor1, vendor2, vendor3, vendor4, vendor5] = await db
      .insert(schema.vendors)
      .values([
        {
          name: "BearingWorld Inc.",
          code: "BWI",
          contactPerson: "Tom Phillips",
          email: "tom@bearingworld.com",
          phone: "555-0101",
          isActive: true,
        },
        {
          name: "HydroTech Solutions",
          code: "HTS",
          contactPerson: "Jane Cooper",
          email: "jane@hydrotech.com",
          phone: "555-0102",
          isActive: true,
        },
        {
          name: "ElectroParts Direct",
          code: "EPD",
          contactPerson: "Mike Ross",
          email: "mike@electroparts.com",
          phone: "555-0103",
          isActive: true,
        },
        {
          name: "Industrial Sensors Co.",
          code: "ISC",
          contactPerson: "Lisa Chen",
          email: "lisa@indsensors.com",
          phone: "555-0104",
          isActive: true,
        },
        {
          name: "HVAC Supply House",
          code: "HSH",
          contactPerson: "Bob Turner",
          email: "bob@hvacsupply.com",
          phone: "555-0105",
          isActive: true,
        },
      ])
      .returning();
    console.log("  ✓ Created 5 vendors");

    // ==================== SPARE PARTS ====================
    console.log("Creating spare parts...");
    const parts = await db
      .insert(schema.spareParts)
      .values([
        {
          sku: "BRG-6205",
          name: "Ball Bearing 6205",
          category: "mechanical",
          vendorId: vendor1.id,
          unitCost: 12.5,
          reorderPoint: 10,
        },
        {
          sku: "BRG-6208",
          name: "Ball Bearing 6208",
          category: "mechanical",
          vendorId: vendor1.id,
          unitCost: 18.0,
          reorderPoint: 8,
        },
        {
          sku: "BRG-6310",
          name: "Ball Bearing 6310",
          category: "mechanical",
          vendorId: vendor1.id,
          unitCost: 35.0,
          reorderPoint: 5,
        },
        {
          sku: "FLT-HYD-01",
          name: "Hydraulic Filter 10um",
          category: "hydraulic",
          vendorId: vendor2.id,
          unitCost: 45.0,
          reorderPoint: 5,
        },
        {
          sku: "FLT-HYD-02",
          name: "Hydraulic Filter 25um",
          category: "hydraulic",
          vendorId: vendor2.id,
          unitCost: 38.0,
          reorderPoint: 5,
        },
        {
          sku: "OIL-HYD-46",
          name: "Hydraulic Oil ISO 46 (5gal)",
          category: "hydraulic",
          vendorId: vendor2.id,
          unitCost: 65.0,
          reorderPoint: 10,
        },
        {
          sku: "SEAL-HYD-KIT",
          name: "Hydraulic Seal Kit",
          category: "hydraulic",
          vendorId: vendor2.id,
          unitCost: 125.0,
          reorderPoint: 3,
        },
        {
          sku: "MTR-3HP-1800",
          name: "3HP Motor 1800RPM",
          category: "electrical",
          vendorId: vendor3.id,
          unitCost: 450.0,
          reorderPoint: 2,
        },
        {
          sku: "MTR-5HP-1800",
          name: "5HP Motor 1800RPM",
          category: "electrical",
          vendorId: vendor3.id,
          unitCost: 650.0,
          reorderPoint: 2,
        },
        {
          sku: "VFD-5HP",
          name: "Variable Frequency Drive 5HP",
          category: "electrical",
          vendorId: vendor3.id,
          unitCost: 850.0,
          reorderPoint: 1,
        },
        {
          sku: "CONTACTOR-30A",
          name: "Contactor 30A",
          category: "electrical",
          vendorId: vendor3.id,
          unitCost: 85.0,
          reorderPoint: 5,
        },
        {
          sku: "RELAY-24V",
          name: "Control Relay 24V",
          category: "electrical",
          vendorId: vendor3.id,
          unitCost: 25.0,
          reorderPoint: 10,
        },
        {
          sku: "PROX-IND-8MM",
          name: "Proximity Sensor 8mm",
          category: "electrical",
          vendorId: vendor4.id,
          unitCost: 55.0,
          reorderPoint: 8,
        },
        {
          sku: "TEMP-TC-K",
          name: "Thermocouple Type K",
          category: "electrical",
          vendorId: vendor4.id,
          unitCost: 35.0,
          reorderPoint: 10,
        },
        {
          sku: "PRESS-0-100PSI",
          name: "Pressure Transducer 0-100PSI",
          category: "electrical",
          vendorId: vendor4.id,
          unitCost: 175.0,
          reorderPoint: 3,
        },
        {
          sku: "BELT-V-A68",
          name: "V-Belt A68",
          category: "mechanical",
          vendorId: vendor1.id,
          unitCost: 15.0,
          reorderPoint: 10,
        },
        {
          sku: "BELT-TIMING-XL",
          name: "Timing Belt XL Pitch",
          category: "mechanical",
          vendorId: vendor1.id,
          unitCost: 28.0,
          reorderPoint: 5,
        },
        {
          sku: "FILTER-AIR-20X20",
          name: "Air Filter 20x20x2",
          category: "consumable",
          vendorId: vendor5.id,
          unitCost: 12.0,
          reorderPoint: 20,
        },
        {
          sku: "REFRIG-R410A",
          name: "Refrigerant R410A (25lb)",
          category: "consumable",
          vendorId: vendor5.id,
          unitCost: 185.0,
          reorderPoint: 2,
        },
        {
          sku: "GREASE-NLGI2",
          name: "Grease NLGI2 (14oz)",
          category: "consumable",
          vendorId: vendor1.id,
          unitCost: 8.5,
          reorderPoint: 20,
        },
      ])
      .returning();
    console.log("  ✓ Created 20 spare parts");

    // ==================== INVENTORY LEVELS ====================
    console.log("Creating inventory levels...");
    await db.insert(schema.inventoryLevels).values([
      { partId: parts[0].id, locationId: whseParts.id, quantity: 45 },
      { partId: parts[1].id, locationId: whseParts.id, quantity: 32 },
      { partId: parts[2].id, locationId: whseParts.id, quantity: 18 },
      { partId: parts[3].id, locationId: whseParts.id, quantity: 12 },
      { partId: parts[4].id, locationId: whseParts.id, quantity: 15 },
      { partId: parts[5].id, locationId: whseParts.id, quantity: 8 },
      { partId: parts[6].id, locationId: whseParts.id, quantity: 6 },
      { partId: parts[7].id, locationId: whseParts.id, quantity: 3 },
      { partId: parts[8].id, locationId: whseParts.id, quantity: 2 },
      { partId: parts[9].id, locationId: whseParts.id, quantity: 2 },
      { partId: parts[10].id, locationId: whseParts.id, quantity: 8 },
      { partId: parts[11].id, locationId: whseParts.id, quantity: 25 },
      { partId: parts[12].id, locationId: whseParts.id, quantity: 15 },
      { partId: parts[13].id, locationId: whseParts.id, quantity: 20 },
      { partId: parts[14].id, locationId: whseParts.id, quantity: 5 },
      { partId: parts[15].id, locationId: whseParts.id, quantity: 30 },
      { partId: parts[16].id, locationId: whseParts.id, quantity: 12 },
      { partId: parts[17].id, locationId: whseParts.id, quantity: 50 },
      { partId: parts[18].id, locationId: whseParts.id, quantity: 4 },
      { partId: parts[19].id, locationId: whseParts.id, quantity: 35 },
    ]);
    console.log("  ✓ Created 20 inventory levels");

    // ==================== EQUIPMENT MODELS ====================
    console.log("Creating equipment models...");
    const [modelIM500, modelConv200, modelRobo6] = await db
      .insert(schema.equipmentModels)
      .values([
        { name: "IM-500 Series", manufacturer: "PlasticPro Industries" },
        { name: "ConveyorMax 200", manufacturer: "FlowTech Systems" },
        { name: "RoboArm 6-Axis", manufacturer: "AutoMotion Inc" },
      ])
      .returning();
    console.log("  ✓ Created 3 equipment models");

    // ==================== EQUIPMENT BOMs ====================
    console.log("Creating equipment BOMs...");
    await db.insert(schema.equipmentBoms).values([
      {
        modelId: modelIM500.id,
        partId: parts[0].id,
        quantityRequired: 8,
        notes: "Main shaft bearings",
      },
      {
        modelId: modelIM500.id,
        partId: parts[3].id,
        quantityRequired: 2,
        notes: "Hydraulic system filters",
      },
      {
        modelId: modelIM500.id,
        partId: parts[5].id,
        quantityRequired: 5,
        notes: "Initial fill hydraulic oil",
      },
      {
        modelId: modelConv200.id,
        partId: parts[15].id,
        quantityRequired: 4,
        notes: "Drive belts",
      },
      {
        modelId: modelConv200.id,
        partId: parts[0].id,
        quantityRequired: 12,
        notes: "Roller bearings",
      },
      {
        modelId: modelRobo6.id,
        partId: parts[19].id,
        quantityRequired: 6,
        notes: "Joint lubrication",
      },
    ]);
    console.log("  ✓ Created 6 BOM entries");

    // ==================== WORK ORDERS ====================
    console.log("Creating work orders...");
    const _now = new Date();

    // Critical - CNC down
    const [wo1] = await db
      .insert(schema.workOrders)
      .values({
        equipmentId: cnc1.id,
        type: "breakdown",
        reportedById: op1.id,
        assignedToId: techAssy1.id,
        departmentId: deptAssy.id,
        title: "CNC Mill not powering on",
        description:
          "Equipment fails to start. No response when power button is pressed. Checked breaker - appears OK.",
        priority: "critical",
        status: "in_progress",
        dueBy: hoursAgo(-4),
        createdAt: hoursAgo(3),
        updatedAt: hoursAgo(1),
      })
      .returning();

    // High - Robot maintenance
    const [wo2] = await db
      .insert(schema.workOrders)
      .values({
        equipmentId: robot2.id,
        type: "maintenance",
        reportedById: op1.id,
        assignedToId: techAssy2.id,
        departmentId: deptAssy.id,
        title: "Scheduled gripper replacement",
        description:
          "Gripper arms showing wear. Replace with new set from inventory. Calibration required after.",
        priority: "high",
        status: "in_progress",
        dueBy: daysFromNow(1),
        createdAt: hoursAgo(6),
        updatedAt: hoursAgo(2),
      })
      .returning();

    // Open tickets
    const [wo3] = await db
      .insert(schema.workOrders)
      .values({
        equipmentId: im1.id,
        type: "calibration",
        reportedById: op2.id,
        assignedToId: techMold1.id,
        departmentId: deptMold.id,
        title: "Temperature sensor drift detected",
        description:
          "Mold temperature readings seem 5-10°C higher than actual. QC flagged parts as out of spec.",
        priority: "high",
        status: "open",
        dueBy: hoursAgo(-8),
        createdAt: hoursAgo(2),
        updatedAt: hoursAgo(2),
      })
      .returning();

    const [wo4] = await db
      .insert(schema.workOrders)
      .values({
        equipmentId: conv1.id,
        type: "safety",
        reportedById: op1.id,
        assignedToId: techAssy1.id,
        departmentId: deptAssy.id,
        title: "Emergency stop button sticking",
        description:
          "E-stop button on station 3 requires excessive force. Safety concern - needs immediate attention.",
        priority: "critical",
        status: "open",
        dueBy: hoursAgo(-2),
        createdAt: hoursAgo(1),
        updatedAt: hoursAgo(1),
      })
      .returning();

    await db.insert(schema.workOrders).values([
      {
        equipmentId: comp1.id,
        type: "maintenance",
        reportedById: techFclt1.id,
        departmentId: deptFclt.id,
        title: "Compressor oil change due",
        description: "3000 hour service interval reached.",
        priority: "medium",
        status: "open",
        dueBy: daysFromNow(3),
        createdAt: daysAgo(1),
      },
      {
        equipmentId: fork1.id,
        type: "maintenance",
        reportedById: op4.id,
        departmentId: deptWhse.id,
        title: "Forklift annual inspection",
        description: "Annual safety inspection and certification required.",
        priority: "medium",
        status: "open",
        dueBy: daysFromNow(7),
      },
      {
        equipmentId: ahu1.id,
        type: "maintenance",
        reportedById: techFclt2.id,
        assignedToId: techFclt1.id,
        departmentId: deptFclt.id,
        title: "Replace AHU filters",
        description: "Quarterly filter replacement. Filters in stock.",
        priority: "low",
        status: "in_progress",
        dueBy: daysFromNow(2),
        createdAt: daysAgo(2),
        updatedAt: hoursAgo(4),
      },
      {
        equipmentId: scanner1.id,
        type: "calibration",
        reportedById: qcManager.id,
        departmentId: deptQC.id,
        title: "Monthly scanner calibration",
        description: "Standard monthly calibration per QC procedures.",
        priority: "medium",
        status: "open",
        dueBy: daysFromNow(5),
      },
    ]);

    // Resolved work orders (historical)
    await db.insert(schema.workOrders).values([
      {
        equipmentId: im2.id,
        type: "breakdown",
        reportedById: op2.id,
        assignedToId: techMold1.id,
        departmentId: deptMold.id,
        title: "Heater band failure",
        description: "Zone 3 heater not reaching temperature.",
        priority: "high",
        status: "resolved",
        resolvedAt: daysAgo(2),
        resolutionNotes: "Replaced heater band. Tested OK.",
        dueBy: daysAgo(3),
        createdAt: daysAgo(4),
        updatedAt: daysAgo(2),
      },
      {
        equipmentId: conv2.id,
        type: "maintenance",
        reportedById: op1.id,
        assignedToId: techAssy1.id,
        departmentId: deptAssy.id,
        title: "Belt tension adjustment",
        description: "Belt slipping under load.",
        priority: "medium",
        status: "resolved",
        resolvedAt: daysAgo(5),
        resolutionNotes: "Adjusted tension. Replaced one worn roller.",
        dueBy: daysAgo(4),
        createdAt: daysAgo(7),
        updatedAt: daysAgo(5),
      },
      {
        equipmentId: comp2.id,
        type: "safety",
        reportedById: techFclt1.id,
        assignedToId: techFclt2.id,
        departmentId: deptFclt.id,
        title: "Pressure relief valve test",
        description: "Annual safety valve testing.",
        priority: "high",
        status: "closed",
        resolvedAt: daysAgo(10),
        resolutionNotes: "Valve tested and certified. Next test in 12 months.",
        dueBy: daysAgo(8),
        createdAt: daysAgo(12),
        updatedAt: daysAgo(10),
      },
      {
        equipmentId: chiller1.id,
        type: "maintenance",
        reportedById: fcltManager.id,
        assignedToId: techFclt1.id,
        departmentId: deptFclt.id,
        title: "Chiller coil cleaning",
        description: "Condenser coils need cleaning for summer.",
        priority: "medium",
        status: "closed",
        resolvedAt: daysAgo(15),
        resolutionNotes: "Coils cleaned and inspected. Refrigerant levels OK.",
        dueBy: daysAgo(14),
        createdAt: daysAgo(20),
        updatedAt: daysAgo(15),
      },
    ]);
    console.log("  ✓ Created 12 work orders");

    // ==================== LABOR LOGS ====================
    console.log("Creating labor logs...");
    await db.insert(schema.laborLogs).values([
      {
        workOrderId: wo1.id,
        userId: techAssy1.id,
        startTime: hoursAgo(2),
        endTime: hoursAgo(1),
        notes: "Diagnosed power supply issue. Need to order replacement PSU.",
      },
      {
        workOrderId: wo1.id,
        userId: techMaint1.id,
        startTime: hoursAgo(1.5),
        endTime: hoursAgo(0.5),
        notes: "Assisted with diagnostics. Confirmed PSU failure.",
      },
      {
        workOrderId: wo2.id,
        userId: techAssy2.id,
        startTime: hoursAgo(4),
        endTime: hoursAgo(2),
        notes: "Removed old gripper assembly. Cleaned mounting surfaces.",
      },
      {
        workOrderId: wo2.id,
        userId: techAssy2.id,
        startTime: hoursAgo(1),
        notes: "Installing new gripper. In progress.",
      },
    ]);
    console.log("  ✓ Created 4 labor logs");

    // ==================== WORK ORDER LOGS ====================
    console.log("Creating work order logs...");
    await db.insert(schema.workOrderLogs).values([
      {
        workOrderId: wo1.id,
        action: "status_change",
        oldValue: "open",
        newValue: "in_progress",
        createdById: techAssy1.id,
        createdAt: hoursAgo(2),
      },
      {
        workOrderId: wo1.id,
        action: "comment",
        newValue:
          "Initial diagnosis complete. Appears to be power supply failure.",
        createdById: techAssy1.id,
        createdAt: hoursAgo(1.5),
      },
      {
        workOrderId: wo1.id,
        action: "comment",
        newValue: "Ordered replacement PSU from vendor. ETA 2 days.",
        createdById: techAssy1.id,
        createdAt: hoursAgo(1),
      },
      {
        workOrderId: wo2.id,
        action: "assignment",
        newValue: techAssy2.name,
        createdById: assyManager.id,
        createdAt: hoursAgo(5),
      },
      {
        workOrderId: wo2.id,
        action: "status_change",
        oldValue: "open",
        newValue: "in_progress",
        createdById: techAssy2.id,
        createdAt: hoursAgo(4),
      },
      {
        workOrderId: wo3.id,
        action: "comment",
        newValue: "Scheduled for calibration tomorrow morning.",
        createdById: techMold1.id,
        createdAt: hoursAgo(1),
      },
    ]);
    console.log("  ✓ Created 6 work order logs");

    // ==================== MAINTENANCE SCHEDULES ====================
    console.log("Creating maintenance schedules...");
    const [sched1] = await db
      .insert(schema.maintenanceSchedules)
      .values({
        equipmentId: im1.id,
        title: "Monthly Lubrication",
        type: "maintenance",
        frequencyDays: 30,
        nextDue: daysFromNow(15),
        isActive: true,
      })
      .returning();
    const [sched2] = await db
      .insert(schema.maintenanceSchedules)
      .values({
        equipmentId: im1.id,
        title: "Quarterly Calibration",
        type: "calibration",
        frequencyDays: 90,
        nextDue: daysFromNow(45),
        isActive: true,
      })
      .returning();
    await db.insert(schema.maintenanceSchedules).values([
      {
        equipmentId: im2.id,
        title: "Monthly Lubrication",
        type: "maintenance",
        frequencyDays: 30,
        nextDue: daysFromNow(20),
        isActive: true,
      },
      {
        equipmentId: comp1.id,
        title: "Oil Change 3000hr",
        type: "maintenance",
        frequencyDays: 90,
        nextDue: daysFromNow(3),
        isActive: true,
      },
      {
        equipmentId: comp2.id,
        title: "Oil Change 3000hr",
        type: "maintenance",
        frequencyDays: 90,
        nextDue: daysFromNow(30),
        isActive: true,
      },
      {
        equipmentId: fork1.id,
        title: "Annual Inspection",
        type: "maintenance",
        frequencyDays: 365,
        nextDue: daysFromNow(7),
        isActive: true,
      },
      {
        equipmentId: scanner1.id,
        title: "Monthly Calibration",
        type: "calibration",
        frequencyDays: 30,
        nextDue: daysFromNow(5),
        isActive: true,
      },
      {
        equipmentId: chiller1.id,
        title: "Quarterly Coil Cleaning",
        type: "maintenance",
        frequencyDays: 90,
        nextDue: daysFromNow(75),
        isActive: true,
      },
      {
        equipmentId: ahu1.id,
        title: "Quarterly Filter Change",
        type: "maintenance",
        frequencyDays: 90,
        nextDue: daysFromNow(2),
        isActive: true,
      },
    ]);
    console.log("  ✓ Created 9 maintenance schedules");

    // ==================== MAINTENANCE CHECKLISTS ====================
    console.log("Creating maintenance checklists...");
    await db.insert(schema.maintenanceChecklists).values([
      {
        scheduleId: sched1.id,
        stepNumber: 1,
        description: "Inspect hydraulic oil level",
        isRequired: true,
        estimatedMinutes: 5,
      },
      {
        scheduleId: sched1.id,
        stepNumber: 2,
        description: "Check for oil leaks at pump and cylinder seals",
        isRequired: true,
        estimatedMinutes: 10,
      },
      {
        scheduleId: sched1.id,
        stepNumber: 3,
        description: "Lubricate tie bar guides",
        isRequired: true,
        estimatedMinutes: 15,
      },
      {
        scheduleId: sched1.id,
        stepNumber: 4,
        description: "Grease toggle mechanism",
        isRequired: true,
        estimatedMinutes: 10,
      },
      {
        scheduleId: sched1.id,
        stepNumber: 5,
        description: "Inspect mold platens for wear",
        isRequired: false,
        estimatedMinutes: 5,
      },
      {
        scheduleId: sched2.id,
        stepNumber: 1,
        description: "Verify temperature controller accuracy",
        isRequired: true,
        estimatedMinutes: 20,
      },
      {
        scheduleId: sched2.id,
        stepNumber: 2,
        description: "Calibrate pressure sensors",
        isRequired: true,
        estimatedMinutes: 30,
      },
      {
        scheduleId: sched2.id,
        stepNumber: 3,
        description: "Check injection speed accuracy",
        isRequired: true,
        estimatedMinutes: 20,
      },
      {
        scheduleId: sched2.id,
        stepNumber: 4,
        description: "Document all readings",
        isRequired: true,
        estimatedMinutes: 15,
      },
    ]);
    console.log("  ✓ Created 9 checklist items");

    // ==================== NOTIFICATIONS ====================
    console.log("Creating notifications...");
    await db.insert(schema.notifications).values([
      {
        userId: techAssy1.id,
        type: "work_order_assigned",
        title: "New Work Order Assigned",
        message: "You have been assigned to WO: CNC Mill not powering on",
        link: getWorkOrderPath(wo1.displayId),
        isRead: true,
        createdAt: hoursAgo(2),
      },
      {
        userId: techAssy1.id,
        type: "work_order_escalated",
        title: "Critical Issue Reported",
        message: "Emergency stop button sticking reported on Conveyor System 1",
        link: getWorkOrderPath(wo4.displayId),
        isRead: false,
        createdAt: hoursAgo(1),
      },
      {
        userId: techAssy2.id,
        type: "work_order_assigned",
        title: "New Work Order Assigned",
        message: "You have been assigned to WO: Scheduled gripper replacement",
        link: getWorkOrderPath(wo2.displayId),
        isRead: true,
        createdAt: hoursAgo(5),
      },
      {
        userId: techMold1.id,
        type: "work_order_created",
        title: "New Work Order",
        message: "Temperature sensor drift detected on Injection Molder A",
        link: getWorkOrderPath(wo3.displayId),
        isRead: false,
        createdAt: hoursAgo(2),
      },
      {
        userId: op1.id,
        type: "work_order_status_changed",
        title: "Work Order Updated",
        message: "CNC Mill not powering on is now In Progress",
        isRead: true,
        createdAt: hoursAgo(2),
      },
      {
        userId: maintManager.id,
        type: "maintenance_due",
        title: "Maintenance Due Soon",
        message: "Compressor oil change due in 3 days",
        link: "/maintenance/schedules",
        isRead: false,
        createdAt: daysAgo(1),
      },
      {
        userId: fcltManager.id,
        type: "maintenance_due",
        title: "Maintenance Due",
        message: "AHU filter replacement is due",
        link: "/maintenance/schedules",
        isRead: true,
        createdAt: daysAgo(2),
      },
    ]);
    console.log("  ✓ Created 7 notifications");

    // ==================== EQUIPMENT STATUS LOGS ====================
    console.log("Creating equipment status logs...");
    await db.insert(schema.equipmentStatusLogs).values([
      {
        equipmentId: cnc1.id,
        oldStatus: "operational",
        newStatus: "down",
        changedById: op1.id,
        changedAt: hoursAgo(3),
      },
      {
        equipmentId: robot2.id,
        oldStatus: "operational",
        newStatus: "maintenance",
        changedById: assyManager.id,
        changedAt: hoursAgo(6),
      },
      {
        equipmentId: im3.id,
        oldStatus: "operational",
        newStatus: "maintenance",
        changedById: moldManager.id,
        changedAt: daysAgo(1),
      },
      {
        equipmentId: im2.id,
        oldStatus: "down",
        newStatus: "operational",
        changedById: techMold1.id,
        changedAt: daysAgo(2),
      },
      {
        equipmentId: im2.id,
        oldStatus: "operational",
        newStatus: "down",
        changedById: op2.id,
        changedAt: daysAgo(4),
      },
    ]);
    console.log("  ✓ Created 5 equipment status logs");

    // ==================== WORK ORDER PARTS ====================
    console.log("Creating work order parts...");
    await db.insert(schema.workOrderParts).values([
      {
        workOrderId: wo2.id,
        partId: parts[19].id,
        quantity: 2,
        unitCost: parts[19].unitCost,
        addedById: techAssy2.id,
      },
    ]);
    console.log("  ✓ Created 1 work order part");

    // ==================== INVENTORY TRANSACTIONS ====================
    console.log("Creating inventory transactions...");
    await db.insert(schema.inventoryTransactions).values([
      {
        partId: parts[0].id,
        locationId: whseParts.id,
        type: "in",
        quantity: 50,
        reference: "PO-2024-001",
        notes: "Initial stock",
        createdById: whseManager.id,
        createdAt: daysAgo(30),
      },
      {
        partId: parts[3].id,
        locationId: whseParts.id,
        type: "in",
        quantity: 20,
        reference: "PO-2024-002",
        notes: "Restocking",
        createdById: whseManager.id,
        createdAt: daysAgo(20),
      },
      {
        partId: parts[0].id,
        locationId: whseParts.id,
        type: "out",
        quantity: 4,
        reference: "WO-IM2-001",
        notes: "Used for IM-002 repair",
        createdById: techMold1.id,
        createdAt: daysAgo(5),
      },
      {
        partId: parts[3].id,
        locationId: whseParts.id,
        type: "out",
        quantity: 2,
        reference: "PM-IM1-001",
        notes: "Monthly PM on IM-001",
        createdById: techMold1.id,
        createdAt: daysAgo(15),
      },
      {
        partId: parts[19].id,
        locationId: whseParts.id,
        type: "out",
        quantity: 2,
        reference: `WO-${wo2.displayId}`,
        notes: "Gripper maintenance",
        createdById: techAssy2.id,
        createdAt: hoursAgo(3),
      },
    ]);
    console.log("  ✓ Created 5 inventory transactions");

    console.log("\n✅ Database seeded successfully!");
    console.log("\n📊 Summary:");
    console.log("   • 4 roles");
    console.log("   • 6 departments");
    console.log("   • 27 users");
    console.log("   • 15 locations");
    console.log("   • 5 equipment categories");
    console.log("   • 11 equipment types");
    console.log("   • 28 equipment items");
    console.log("   • 5 vendors");
    console.log("   • 20 spare parts");
    console.log("   • 20 inventory levels");
    console.log("   • 3 equipment models");
    console.log("   • 6 BOM entries");
    console.log("   • 12 work orders");
    console.log("   • 4 labor logs");
    console.log("   • 6 work order logs");
    console.log("   • 9 maintenance schedules");
    console.log("   • 9 checklist items");
    console.log("   • 7 notifications");
    console.log("   • 5 equipment status logs");
    console.log("   • 1 work order part");
    console.log("   • 5 inventory transactions");
    console.log("\n🔐 Default PINs:");
    console.log("   • Admin/Manager: 123456");
    console.log("   • Technician: 567890");
    console.log("   • Operator: 000000");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  });
