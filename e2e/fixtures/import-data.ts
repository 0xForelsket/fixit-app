// Valid test data that matches seed.ts references
// Location codes: MAIN, HALL-A, HALL-B, AL-01, AL-02, MOLD
// Equipment type codes: MOLD, CONV, ROB, CNC, SCAN
// User employee IDs: ADMIN-001, MGT-MOLD, TECH-MOLD-01, TECH-ASSY-01, etc.

export const validEquipmentCSV = `code,name,location_code,model_name,type_code,owner_employee_id,status
EQ-E2E-001,E2E Test Lathe,HALL-A,Haas VF-2,CNC,MGT-MOLD,operational
EQ-E2E-002,E2E Test Conveyor,HALL-B,Parker 500T,CONV,,maintenance`;

export const validLocationsCSV = `code,name,description,parent_code
LOC-E2E-A,E2E Test Plant A,Test facility,
LOC-E2E-A-L1,E2E Test Line 1,Test assembly line,LOC-E2E-A`;

export const validSparePartsCSV = `sku,name,category,description,barcode,unit_cost,reorder_point,lead_time_days
SPR-E2E-001,E2E Test Seal Kit,hydraulic,Test seals,,25.50,10,7`;

export const validUsersCSV = `employee_id,name,email,pin,role_name,hourly_rate
USER-E2E-001,E2E Test User,test-e2e@example.com,9999,tech,50.00`;

export const invalidCSV = `invalid,headers,only
data1,data2,data3`;

export const missingRequiredCSV = `name,location_code
Missing Code,MAIN`;
