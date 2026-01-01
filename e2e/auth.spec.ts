import { expect, test } from "./fixtures";

test.describe("Authentication", () => {
  test("should show login page", async ({ page }) => {
    await page.goto("/login");

    // Login page has FixIt branding and form fields
    await expect(
      page.getByRole("heading", { name: "FixIt CMMS" })
    ).toBeVisible();
    await expect(page.locator('input[name="employeeId"]')).toBeVisible();
    await expect(page.locator('input[name="pin"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("should login successfully as admin", async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    // Admin logged in successfully if we're not on login page
    await expect(page).not.toHaveURL("/login");
  });

  test("should login successfully as tech", async ({ page, loginAsTech }) => {
    await loginAsTech();
    // Tech logged in successfully if we're not on login page
    await expect(page).not.toHaveURL("/login");
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="employeeId"]', "WRONG-ID");
    await page.fill('input[name="pin"]', "0000");
    await page.click('button[type="submit"]');

    // Wait a bit for error to appear
    await page.waitForTimeout(1000);
    // Should still be on login page with error
    await expect(page).toHaveURL(/\/login/);
  });

  test("should redirect unauthenticated users to login", async ({ page }) => {
    await page.goto("/dashboard");
    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/);
  });

  test("should logout successfully", async ({ loginAsAdmin, page }) => {
    await loginAsAdmin();

    // Open user menu in sidebar
    await page
      .locator("aside")
      .getByRole("button", { name: "System Admin" })
      .click();

    // Click Log out
    await page.getByRole("menuitem", { name: "Log out" }).click();

    await page.waitForURL(/\/login/);
    await expect(page).toHaveURL(/\/login/);
  });
});
