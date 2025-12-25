import { expect, test } from "./fixtures";

test.describe("Admin - Machine Management", () => {
  test.beforeEach(async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
  });

  test("should navigate to machines list", async ({ page }) => {
    await page.goto("/admin/machines");

    await expect(page).toHaveURL("/admin/machines");
    await expect(page.locator("text=Machines")).toBeVisible();
  });

  test("should filter machines by status", async ({ page }) => {
    await page.goto("/admin/machines");

    // Click on status filter
    const statusFilter = page.locator(
      'button:has-text("Status"), select[name="status"]'
    );
    if (await statusFilter.isVisible()) {
      await statusFilter.click();
      await page.click('text=Down, [value="down"]');

      // URL should update with filter
      await expect(page).toHaveURL(/status=down/);
    }
  });

  test("should view machine details", async ({ page }) => {
    await page.goto("/admin/machines");

    // Click on first machine
    const machineLink = page.locator('a[href*="/admin/machines/"]').first();
    if (await machineLink.isVisible()) {
      await machineLink.click();

      // Should be on detail page
      await expect(page).toHaveURL(/\/admin\/machines\/\d+/);
      await expect(page.locator("text=History, text=Details")).toBeVisible();
    }
  });

  test("should navigate to create machine page", async ({ page }) => {
    await page.goto("/admin/machines");

    // Click new machine button
    await page.click('a[href="/admin/machines/new"], button:has-text("New")');

    await expect(page).toHaveURL("/admin/machines/new");
    await expect(page.locator('input[name="name"]')).toBeVisible();
  });

  test("should create a new machine", async ({ page }) => {
    await page.goto("/admin/machines/new");

    // Fill out the form
    await page.fill('input[name="name"]', "E2E Test Machine");
    await page.fill('input[name="assetTag"]', "E2E-TEST-001");

    // Select location if dropdown exists
    const locationSelect = page.locator(
      'button[role="combobox"]:has-text("Location"), select[name="locationId"]'
    );
    if (await locationSelect.isVisible()) {
      await locationSelect.click();
      await page.click('[role="option"]:first-child, option:first-child');
    }

    // Submit
    await page.click('button[type="submit"]');

    // Should show success or redirect
    await expect(
      page.locator("text=success, text=created, text=Machine")
    ).toBeVisible({ timeout: 5000 });
  });

  test("should edit machine details", async ({ page }) => {
    await page.goto("/admin/machines");

    // Click on first machine to view details
    const machineLink = page.locator('a[href*="/admin/machines/"]').first();
    if (await machineLink.isVisible()) {
      await machineLink.click();
      await page.waitForURL(/\/admin\/machines\/\d+/);

      // Click edit button
      const editBtn = page.locator(
        'a:has-text("Edit"), button:has-text("Edit")'
      );
      if (await editBtn.isVisible()) {
        await editBtn.click();
        await expect(page).toHaveURL(/\/edit/);

        // Make a change
        await page.fill('textarea[name="notes"]', "Updated via E2E test");
        await page.click('button[type="submit"]');

        // Should see success
        await expect(page.locator("text=success, text=updated")).toBeVisible({
          timeout: 5000,
        });
      }
    }
  });
});
