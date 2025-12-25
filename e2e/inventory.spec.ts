import { expect, test } from "./fixtures";

test.describe("Admin - Inventory Management", () => {
  test.beforeEach(async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
  });

  test("should navigate to inventory page", async ({ page }) => {
    await page.goto("/admin/inventory");

    await expect(page).toHaveURL("/admin/inventory");
    await expect(page.locator("text=Inventory, text=Stock")).toBeVisible();
  });

  test("should view parts list", async ({ page }) => {
    await page.goto("/admin/inventory/parts");

    await expect(page.locator("text=Parts, text=SKU")).toBeVisible();
  });

  test("should create a new part", async ({ page }) => {
    await page.goto("/admin/inventory/parts/new");

    // Fill form
    await page.fill('input[name="sku"]', "E2E-PART-001");
    await page.fill('input[name="name"]', "E2E Test Part");
    await page.fill('input[name="unitCost"]', "19.99");

    // Select category if exists
    const categorySelect = page.locator(
      'button[role="combobox"]:has-text("Category"), select[name="category"]'
    );
    if (await categorySelect.isVisible()) {
      await categorySelect.click();
      await page.click('[role="option"]:first-child');
    }

    await page.click('button[type="submit"]');

    await expect(page.locator("text=success, text=created")).toBeVisible({
      timeout: 5000,
    });
  });

  test("should receive stock", async ({ page }) => {
    await page.goto("/admin/inventory/receive");

    // Select part
    const partSelect = page.locator(
      'button[role="combobox"]:has-text("Part"), select[name="partId"]'
    );
    if (await partSelect.isVisible()) {
      await partSelect.click();
      await page.click('[role="option"]:first-child');
    }

    // Select location
    const locationSelect = page.locator(
      'button[role="combobox"]:has-text("Location"), select[name="locationId"]'
    );
    if (await locationSelect.isVisible()) {
      await locationSelect.click();
      await page.click('[role="option"]:first-child');
    }

    // Enter quantity
    await page.fill('input[name="quantity"]', "10");

    // Submit
    await page.click('button[type="submit"]');

    await expect(page.locator("text=success, text=received")).toBeVisible({
      timeout: 5000,
    });
  });

  test("should view stock levels", async ({ page }) => {
    await page.goto("/admin/inventory");

    // Should show stock levels table or cards
    await expect(
      page.locator("text=Stock Level, text=Quantity, text=Location")
    ).toBeVisible();
  });

  test("should view transaction history", async ({ page }) => {
    await page.goto("/admin/inventory/transactions");

    await expect(page.locator("text=Transaction, text=History")).toBeVisible();
  });
});

test.describe("Tech - Parts Consumption", () => {
  test("should add part to ticket", async ({ page, loginAsTech }) => {
    await loginAsTech();

    // Navigate to a ticket
    await page.goto("/dashboard/tickets");
    const ticketLink = page.locator('a[href*="/tickets/"]').first();

    if (await ticketLink.isVisible()) {
      await ticketLink.click();
      await page.waitForURL(/\/tickets\/\d+/);

      // Click Add Part button
      const addPartBtn = page.locator('button:has-text("Add Part")');
      if (await addPartBtn.isVisible()) {
        await addPartBtn.click();

        // Fill modal
        const partSelect = page.locator(
          'button[role="combobox"]:has-text("Part"), select[name="partId"]'
        );
        if (await partSelect.isVisible()) {
          await partSelect.click();
          await page.click('[role="option"]:first-child');
        }

        const locationSelect = page.locator(
          'button[role="combobox"]:has-text("Location"), select[name="locationId"]'
        );
        if (await locationSelect.isVisible()) {
          await locationSelect.click();
          await page.click('[role="option"]:first-child');
        }

        await page.fill('input[name="quantity"]', "1");
        await page.click('button[type="submit"]:has-text("Add")');

        await expect(page.locator("text=success, text=added")).toBeVisible({
          timeout: 5000,
        });
      }
    }
  });
});
