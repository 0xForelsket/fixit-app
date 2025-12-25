import { expect, test } from "./fixtures";

test.describe("Maintenance Schedules", () => {
  test.describe("Admin - Manage Schedules", () => {
    test.beforeEach(async ({ page, loginAsAdmin }) => {
      await loginAsAdmin();
    });

    test("should navigate to maintenance page", async ({ page }) => {
      await page.goto("/admin/maintenance");

      await expect(page).toHaveURL(/\/admin\/maintenance/);
      await expect(
        page.locator("text=Maintenance, text=Schedule")
      ).toBeVisible();
    });

    test("should view schedule list", async ({ page }) => {
      await page.goto("/admin/maintenance/schedules");

      await expect(page.locator("text=Schedule, text=Frequency")).toBeVisible();
    });

    test("should create a new schedule", async ({ page }) => {
      await page.goto("/admin/maintenance/schedules/new");

      // Fill form
      await page.fill('input[name="name"]', "E2E Test Schedule");

      // Select machine
      const machineSelect = page.locator(
        'button[role="combobox"]:has-text("Machine"), select[name="machineId"]'
      );
      if (await machineSelect.isVisible()) {
        await machineSelect.click();
        await page.click('[role="option"]:first-child');
      }

      // Select frequency
      const freqSelect = page.locator(
        'button[role="combobox"]:has-text("Frequency"), select[name="frequency"]'
      );
      if (await freqSelect.isVisible()) {
        await freqSelect.click();
        await page.click(
          '[role="option"]:has-text("Weekly"), option[value="weekly"]'
        );
      }

      // Fill description
      await page.fill(
        'textarea[name="description"]',
        "E2E test maintenance schedule"
      );

      await page.click('button[type="submit"]');

      await expect(page.locator("text=success, text=created")).toBeVisible({
        timeout: 5000,
      });
    });

    test("should view schedule details", async ({ page }) => {
      await page.goto("/admin/maintenance/schedules");

      const scheduleLink = page
        .locator('a[href*="/maintenance/schedules/"]')
        .first();
      if (await scheduleLink.isVisible()) {
        await scheduleLink.click();
        await expect(page).toHaveURL(/\/schedules\/\d+/);
      }
    });
  });

  test.describe("Tech - View Maintenance", () => {
    test.beforeEach(async ({ page, loginAsTech }) => {
      await loginAsTech();
    });

    test("should view maintenance calendar", async ({ page }) => {
      await page.goto("/dashboard/maintenance");

      await expect(
        page.locator("text=Maintenance, text=Calendar")
      ).toBeVisible();
    });

    test("should view upcoming maintenance", async ({ page }) => {
      await page.goto("/dashboard/maintenance/schedules");

      await expect(page.locator("text=Schedule, text=Upcoming")).toBeVisible();
    });

    test("should view schedule details", async ({ page }) => {
      await page.goto("/dashboard/maintenance/schedules");

      const scheduleLink = page.locator('a[href*="/schedules/"]').first();
      if (await scheduleLink.isVisible()) {
        await scheduleLink.click();
        await expect(page).toHaveURL(/\/schedules\/\d+/);
        await expect(
          page.locator("text=Description, text=Frequency")
        ).toBeVisible();
      }
    });
  });
});
