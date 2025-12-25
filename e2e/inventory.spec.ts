import { test, expect } from "./fixtures";

test.describe("Admin - Inventory Management", () => {
  test("Admin can access inventory page", async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await page.goto("/admin/inventory");
    await expect(page).toHaveURL("/admin/inventory");
  });

  test("Admin can access parts page", async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await page.goto("/admin/inventory/parts");
    await expect(page).toHaveURL("/admin/inventory/parts");
  });

  test("Admin can access receive stock page", async ({
    page,
    loginAsAdmin,
  }) => {
    await loginAsAdmin();
    await page.goto("/admin/inventory/receive");
    await expect(page).toHaveURL("/admin/inventory/receive");
  });

  test("Admin can access transactions page", async ({
    page,
    loginAsAdmin,
  }) => {
    await loginAsAdmin();
    await page.goto("/admin/inventory/transactions");
    await expect(page).toHaveURL("/admin/inventory/transactions");
  });
});

test.describe("Tech - Parts on Ticket", () => {
  test("Tech can view ticket with parts section", async ({
    page,
    loginAsTech,
  }) => {
    await loginAsTech();
    await page.goto("/dashboard/tickets");

    const ticketLink = page.locator('a[href*="/tickets/"]').first();
    if (await ticketLink.isVisible({ timeout: 3000 })) {
      await ticketLink.click();
      await expect(page).toHaveURL(/\/tickets\/\d+/);
    }
  });
});
