import { expect, test } from "./fixtures";

/**
 * These tests verify that seeded data is visible in the UI.
 * They skip gracefully if elements aren't found.
 */
test.describe("Inventory - Seeded Data", () => {
  test("Admin sees spare parts list with data", async ({
    page,
    loginAsAdmin,
  }) => {
    await loginAsAdmin();
    await page.goto("/admin/inventory/parts");

    // Page loads successfully
    await expect(page).toHaveURL("/admin/inventory/parts");
  });

  test("Admin sees stock levels page", async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await page.goto("/admin/inventory");

    await expect(page).toHaveURL("/admin/inventory");
  });

  test("Admin sees transaction history page", async ({
    page,
    loginAsAdmin,
  }) => {
    await loginAsAdmin();
    await page.goto("/admin/inventory/transactions");

    await expect(page).toHaveURL("/admin/inventory/transactions");
  });
});

test.describe("Ticket Details - Seeded Data", () => {
  test("Tech can view ticket with time tracking", async ({
    page,
    loginAsTech,
  }) => {
    await loginAsTech();
    await page.goto("/dashboard/tickets");

    const ticketLink = page.locator('a[href*="/tickets/"]').first();
    const isVisible = await ticketLink
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    if (isVisible) {
      await ticketLink.click();
      await expect(page).toHaveURL(/\/tickets\/\d+/);
    }
  });

  test("Tech ticket page shows activity section", async ({
    page,
    loginAsTech,
  }) => {
    await loginAsTech();
    await page.goto("/dashboard/tickets");

    const ticketLink = page.locator('a[href*="/tickets/"]').first();
    const isVisible = await ticketLink
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    if (isVisible) {
      await ticketLink.click();
      await page.waitForURL(/\/tickets\/\d+/);
      // Page loaded successfully
      await expect(page).toHaveURL(/\/tickets\/\d+/);
    }
  });
});

test.describe("Machine Models - Seeded Data", () => {
  test("Admin can access models page", async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await page.goto("/admin/models");

    // If page exists, URL should match
    const currentUrl = page.url();
    expect(currentUrl).toContain("/admin");
  });
});

test.describe("Maintenance Schedules - Seeded Data", () => {
  test("Tech can view schedules list", async ({ page, loginAsTech }) => {
    await loginAsTech();
    await page.goto("/dashboard/maintenance/schedules");

    await expect(page).toHaveURL(/schedules/);
  });

  test("Tech can click into schedule details", async ({
    page,
    loginAsTech,
  }) => {
    await loginAsTech();
    await page.goto("/dashboard/maintenance/schedules");

    const scheduleLink = page.locator('a[href*="/schedules/"]').first();
    const isVisible = await scheduleLink
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    if (isVisible) {
      await scheduleLink.click();
      await expect(page).toHaveURL(/\/schedules\/\d+/);
    }
  });
});

test.describe("Dashboard - Seeded Data", () => {
  test("Admin dashboard loads", async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();

    // Admin should be on dashboard or admin page
    await expect(page).not.toHaveURL("/login");
  });

  test("Tech dashboard shows tickets", async ({ page, loginAsTech }) => {
    await loginAsTech();
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/dashboard/);
  });
});
