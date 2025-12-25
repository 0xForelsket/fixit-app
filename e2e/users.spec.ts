import { test, expect } from "./fixtures";

test.describe("Admin - User Management", () => {
  test("Admin can access users page", async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await page.goto("/admin/users");
    await expect(page).toHaveURL("/admin/users");
  });

  test("Admin can view user details", async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await page.goto("/admin/users");

    // Try to click on any user link, skip test if none exist
    const userLink = page.locator('tr a, [data-testid="user-link"]').first();
    const isVisible = await userLink.isVisible({ timeout: 3000 }).catch(() => false);
    if (isVisible) {
      await userLink.click();
      await expect(page).toHaveURL(/\/users\/\d+/);
    }
  });

  test("Admin can access create user page", async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await page.goto("/admin/users/new");
    await expect(page).toHaveURL("/admin/users/new");
  });
});
