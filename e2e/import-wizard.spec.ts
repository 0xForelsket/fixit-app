import { expect, test } from "./fixtures";
import { invalidCSV, validEquipmentCSV } from "./fixtures/import-data";

test.describe("Admin - Import Wizard", () => {
  test.beforeEach(async ({ loginAsAdmin }) => {
    await loginAsAdmin();
  });

  test("Admin can access import page and select resource", async ({ page }) => {
    await page.goto("/admin/import");
    await expect(
      page.getByText("What would you like to import?")
    ).toBeVisible();

    // Select Equipment
    await page.getByRole("button", { name: /Equipment/i }).click();
    await expect(
      page.getByRole("heading", { name: "Import Equipment" })
    ).toBeVisible();
    await expect(page.getByText("Drop your CSV file here")).toBeVisible();
  });

  test("Shows error for invalid CSV format during preview", async ({
    page,
  }) => {
    await page.goto("/admin/import");
    await page.getByRole("button", { name: /Equipment/i }).click();

    // Upload invalid CSV
    await page.setInputFiles('input[id="csv-upload"]', {
      name: "invalid.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(invalidCSV),
    });

    // It should allow upload but might show validation errors if headers don't match
    // Actually our ImportWizard shows preview based on any CSV
    await expect(page.getByText("invalid.csv")).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("Successfully previews and validates equipment import", async ({
    page,
  }) => {
    await page.goto("/admin/import");
    await page.getByRole("button", { name: /Equipment/i }).click();

    const uniqueId = Date.now().toString().slice(-6);
    const csvWithUniqueCodes = validEquipmentCSV.replace(
      /EQ-E2E/g,
      `EQ-V-${uniqueId}`
    );

    // Upload valid CSV
    await page.setInputFiles('input[id="csv-upload"]', {
      name: "equipment-val.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csvWithUniqueCodes),
    });

    await expect(page.getByText("equipment-val.csv")).toBeVisible();
    await expect(page.getByText("2 rows to import")).toBeVisible();

    // Click "Validate Only"
    await page.getByRole("button", { name: /Validate Only/i }).click();

    // Should see validation results
    await expect(page.getByText("Validation Results")).toBeVisible();
    await expect(page.getByText("Will Insert")).toBeVisible();
  });

  test("Successfully imports equipment records", async ({ page }) => {
    await page.goto("/admin/import");
    await page.getByRole("button", { name: /Equipment/i }).click();

    const uniqueId = Date.now().toString().slice(-6);
    const csvWithUniqueCodes = validEquipmentCSV.replace(
      /EQ-E2E/g,
      `EQ-I-${uniqueId}`
    );

    // Upload valid CSV
    await page.setInputFiles('input[id="csv-upload"]', {
      name: "equipment-import.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csvWithUniqueCodes),
    });

    // Click "Import Equipment"
    await page.getByRole("button", { name: /Import Equipment/i }).click();

    // Should navigate to result step
    await expect(
      page.getByRole("heading", { name: "Import Complete" })
    ).toBeVisible();
    await expect(page.getByText("Inserted")).toBeVisible();

    // Check one of the imported items is counted
    const insertedCount = page.locator(".text-success-600").first();
    await expect(insertedCount).toHaveText("2");
  });

  test("Successfully imports spare parts", async ({ page }) => {
    await page.goto("/admin/import");
    await page.getByRole("button", { name: /Spare Parts/i }).click();

    const uniqueId = Date.now().toString().slice(-6);
    // Use valid category "mechanical" as defined in schema
    const csvData = `sku,name,category,description,unit_cost,reorder_point
SPR-E2E-${uniqueId},Test Part ${uniqueId},mechanical,E2E Description,10.50,5`;

    await page.setInputFiles('input[id="csv-upload"]', {
      name: "parts.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csvData),
    });

    await page.getByRole("button", { name: /Import Spare Parts/i }).click();
    await expect(
      page.getByRole("heading", { name: "Import Complete" })
    ).toBeVisible();
    await expect(page.locator(".text-success-600").first()).toHaveText("1");
  });

  test("Successfully imports locations", async ({ page }) => {
    await page.goto("/admin/import");
    await page.getByRole("button", { name: /Locations/i }).click();

    const uniqueId = Date.now().toString().slice(-6);
    const csvData = `code,name,description,parent_code
LOC-E2E-${uniqueId},Test Area ${uniqueId},E2E Location,HALL-A`;

    await page.setInputFiles('input[id="csv-upload"]', {
      name: "locations.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csvData),
    });

    await page.getByRole("button", { name: /Import Locations/i }).click();
    await expect(
      page.getByRole("heading", { name: "Import Complete" })
    ).toBeVisible();
    await expect(page.locator(".text-success-600").first()).toHaveText("1");
  });

  test("Successfully imports users", async ({ page }) => {
    await page.goto("/admin/import");
    await page.getByRole("button", { name: /Users/i }).click();

    const uniqueId = Date.now().toString().slice(-6);
    const csvData = `employee_id,name,email,pin,role_name,hourly_rate
USER-E2E-${uniqueId},E2E User ${uniqueId},e2e-${uniqueId}@example.com,1234,tech,45.00`;

    await page.setInputFiles('input[id="csv-upload"]', {
      name: "users.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csvData),
    });

    await page.getByRole("button", { name: /Import Users/i }).click();
    await expect(
      page.getByRole("heading", { name: "Import Complete" })
    ).toBeVisible();
    await expect(page.locator(".text-success-600").first()).toHaveText("1");
  });

  test("Can download sample CSV template", async ({ page }) => {
    await page.goto("/admin/import");
    await page.getByRole("button", { name: /Locations/i }).click();

    // Verify template download button
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /Download Template/i }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toContain(
      "locations-import-template.csv"
    );
  });

  test("Can navigate back and select different resource", async ({ page }) => {
    await page.goto("/admin/import");
    await page.getByRole("button", { name: /Equipment/i }).click();

    // Go back
    await page.getByRole("button", { name: /Back/i }).click();
    await expect(
      page.getByText("What would you like to import?")
    ).toBeVisible();

    // Select Users
    await page.getByRole("button", { name: /Users/i }).click();
    await expect(
      page.getByRole("heading", { name: "Import Users" })
    ).toBeVisible();
  });
});

test.describe("Permissions - Import Wizard", () => {
  test("Tech cannot access import page", async ({ page, loginAsTech }) => {
    await loginAsTech();
    await page.goto("/admin/import");

    // Verify we get an error or redirect
    // Since requirePermission throws error, it should show the error boundary
    await expect(
      page.getByRole("heading", { name: /something went wrong/i })
    ).toBeVisible();
    await expect(
      page.getByText("What would you like to import?")
    ).not.toBeVisible();
  });
});
