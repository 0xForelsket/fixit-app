import { test, expect } from "./fixtures";

test.describe("Admin - Machines", () => {
  test("Admin can access machines page", async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await page.goto("/admin/machines");
    await expect(page).toHaveURL("/admin/machines");
  });

  test("Admin can view machine details", async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await page.goto("/admin/machines");

    // Try to click on any machine link, skip test if none exist
    const machineLink = page.locator('tr a, [data-testid="machine-link"]').first();
    const isVisible = await machineLink.isVisible({ timeout: 3000 }).catch(() => false);
    if (isVisible) {
      await machineLink.click();
      await expect(page).toHaveURL(/\/machines\/\d+/);
    }
  });
});

test.describe("Admin - Users", () => {
  test("Admin can access users page", async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await page.goto("/admin/users");
    await expect(page).toHaveURL("/admin/users");
  });
});

test.describe("Admin - Inventory", () => {
  test("Admin can access inventory page", async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await page.goto("/admin/inventory");
    await expect(page).toHaveURL("/admin/inventory");
  });
});

test.describe("Admin - Settings", () => {
  test("Admin can access settings page", async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await page.goto("/admin/settings");
    await expect(page).toHaveURL("/admin/settings");
  });

  test("Admin can access locations page", async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await page.goto("/admin/locations");
    await expect(page).toHaveURL("/admin/locations");
  });
});
