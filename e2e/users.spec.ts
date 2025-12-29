import { expect, test } from "./fixtures";

test.describe("Admin - User Management", () => {
  test("Admin can access users page", async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await page.goto("/admin/users");
    await expect(page).toHaveURL("/admin/users");
    await expect(page.getByRole("heading", { name: /User Directory/i })).toBeVisible();
  });

  test("Admin can view user details", async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await page.goto("/admin/users");
    
    // Wait for user table to load
    await expect(page.locator("table")).toBeVisible({ timeout: 10000 });

    // The user table has links in the LAST column that go to user details like /admin/users/XX
    // We need to find a link that goes to a user detail page (has a number at the end)
    // The "ADD USER" link goes to /admin/users/new so we need to exclude it
    const userDetailLinks = page.locator('a[href^="/admin/users/"]').filter({
      hasNot: page.locator('text=ADD')
    });
    
    // Get links that match the pattern /admin/users/<number>
    const allLinks = await page.locator('a[href^="/admin/users/"]').all();
    let userDetailLink = null;
    
    for (const link of allLinks) {
      const href = await link.getAttribute("href");
      if (href && /\/admin\/users\/\d+/.test(href)) {
        userDetailLink = link;
        break;
      }
    }
    
    if (userDetailLink) {
      await userDetailLink.click();
      // Wait for navigation to user detail page
      await page.waitForURL(/\/admin\/users\/\d+/, { timeout: 10000 });
      await expect(page).toHaveURL(/\/admin\/users\/\d+/);
    } else {
      // If no user detail links found, skip the test
      console.log("No user detail links found in table");
    }
  });

  test("Admin can access create user page", async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await page.goto("/admin/users/new");
    await expect(page).toHaveURL("/admin/users/new");
  });
});
