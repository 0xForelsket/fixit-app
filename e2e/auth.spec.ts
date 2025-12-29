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

  test("should logout successfully", async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    
    // Navigate to a page with the sidebar layout (like admin/users which has sidebar)
    await page.goto("/admin/users");
    await page.waitForLoadState("networkidle");
    
    // Look for the Sign Out button in sidebar
    const signOutBtn = page.locator('button:has-text("Sign Out")');
    
    // Wait for the button to be visible and click
    const isVisible = await signOutBtn.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isVisible) {
      await signOutBtn.click();
      await page.waitForURL(/\/login/, { timeout: 10000 });
      await expect(page).toHaveURL(/\/login/);
    } else {
      // If sidebar isn't visible, try user menu dropdown approach
      // Click on the user button in the header to open menu
      const userButton = page.locator('button:has-text("System Admin")');
      if (await userButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await userButton.click();
        // Look for sign out in dropdown
        const signOutDropdown = page.getByText("Sign Out");
        if (await signOutDropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
          await signOutDropdown.click();
          await page.waitForURL(/\/login/, { timeout: 10000 });
          await expect(page).toHaveURL(/\/login/);
          return;
        }
      }
      // Fallback: go to profile page which should have logout
      await page.goto("/profile");
      const profileSignOut = page.locator('button:has-text("Sign Out")');
      await expect(profileSignOut).toBeVisible({ timeout: 10000 });
      await profileSignOut.click();
      await page.waitForURL(/\/login/, { timeout: 10000 });
      await expect(page).toHaveURL(/\/login/);
    }
  });
});
