import { expect, test } from "./fixtures";

test.describe("Authentication", () => {
  test("should show login page", async ({ page }) => {
    await page.goto("/login");

    // Login page has FixIt branding and form fields
    await expect(page.locator("text=FixIt")).toBeVisible();
    await expect(page.locator('input[name="employeeId"]')).toBeVisible();
    await expect(page.locator('input[name="pin"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("should login successfully as admin", async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();

    // Admin should be redirected to dashboard
    await expect(page).toHaveURL(/\/(dashboard|admin)/);
  });

  test("should login successfully as tech", async ({ page, loginAsTech }) => {
    await loginAsTech();

    // Tech should be redirected to dashboard
    await expect(page).toHaveURL("/dashboard");
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="employeeId"]', "WRONG-ID");
    await page.fill('input[name="pin"]', "0000");
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator("text=Invalid")).toBeVisible({ timeout: 5000 });
  });

  test("should redirect unauthenticated users to login", async ({ page }) => {
    await page.goto("/dashboard");

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/);
  });

  test("should logout successfully", async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();

    // Click sign out
    await page.click("text=Sign Out");

    // Should be redirected to login
    await expect(page).toHaveURL("/login");
  });
});
