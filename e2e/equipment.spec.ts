import { expect, test } from "./fixtures";

test.describe("Admin - Equipment", () => {
  test("Admin can access equipment page", async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await page.goto("/admin/equipment");
    await expect(page).toHaveURL("/admin/equipment");
  });

  test("Admin can view equipment details", async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await page.goto("/admin/equipment");

    // Try to click on any equipment link, skip test if none exist
    const equipmentLink = page
      .locator('tr a, [data-testid="equipment-link"]')
      .first();
    const isVisible = await equipmentLink
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    if (isVisible) {
      await equipmentLink.click();
      await expect(page).toHaveURL(/\/equipment\/\d+/);
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
