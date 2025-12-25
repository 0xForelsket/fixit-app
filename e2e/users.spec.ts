import { expect, test } from "./fixtures";

test.describe("Admin - User Management", () => {
  test.beforeEach(async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
  });

  test("should navigate to users list", async ({ page }) => {
    await page.goto("/admin/users");

    await expect(page).toHaveURL("/admin/users");
    await expect(page.locator("text=Users")).toBeVisible();
  });

  test("should view user details", async ({ page }) => {
    await page.goto("/admin/users");

    const userLink = page.locator('a[href*="/admin/users/"]').first();
    if (await userLink.isVisible()) {
      await userLink.click();
      await expect(page).toHaveURL(/\/admin\/users\/\d+/);
    }
  });

  test("should navigate to create user page", async ({ page }) => {
    await page.goto("/admin/users");

    await page.click('a[href="/admin/users/new"], button:has-text("New")');

    await expect(page).toHaveURL("/admin/users/new");
    await expect(page.locator('input[name="employeeId"]')).toBeVisible();
  });

  test("should create a new user", async ({ page }) => {
    await page.goto("/admin/users/new");

    // Fill the form
    await page.fill('input[name="employeeId"]', "E2E-USER-001");
    await page.fill('input[name="name"]', "E2E Test User");
    await page.fill('input[name="email"]', "e2e-test@example.com");
    await page.fill('input[name="pin"]', "1234");

    // Select role
    const roleSelect = page.locator(
      'button[role="combobox"]:has-text("Role"), select[name="role"]'
    );
    if (await roleSelect.isVisible()) {
      await roleSelect.click();
      await page.click(
        '[role="option"]:has-text("Operator"), option[value="operator"]'
      );
    }

    // Submit
    await page.click('button[type="submit"]');

    await expect(page.locator("text=success, text=created")).toBeVisible({
      timeout: 5000,
    });
  });

  test("should toggle user active status", async ({ page }) => {
    await page.goto("/admin/users");

    // Click on a user
    const userLink = page.locator('a[href*="/admin/users/"]').first();
    if (await userLink.isVisible()) {
      await userLink.click();
      await page.waitForURL(/\/admin\/users\/\d+/);

      // Find deactivate/activate button
      const toggleBtn = page.locator(
        'button:has-text("Deactivate"), button:has-text("Activate")'
      );
      if (await toggleBtn.isVisible()) {
        await toggleBtn.click();

        // Confirm if dialog appears
        const confirmBtn = page.locator('button:has-text("Confirm")');
        if (await confirmBtn.isVisible()) {
          await confirmBtn.click();
        }

        await expect(
          page.locator("text=success, text=deactivated, text=activated")
        ).toBeVisible({ timeout: 5000 });
      }
    }
  });
});
