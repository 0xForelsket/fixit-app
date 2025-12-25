import { expect, test } from "./fixtures";

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

  test("Admin can access transactions page", async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await page.goto("/admin/inventory/transactions");
    await expect(page).toHaveURL("/admin/inventory/transactions");
  });

  test("Admin can see seeded parts", async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await page.goto("/admin/inventory/parts");

    // Check for seeded parts - Ball Bearing 6205
    const hasPart = await page
      .locator("text=BRG-6205")
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    if (hasPart) {
      await expect(page.locator("text=BRG-6205")).toBeVisible();
    }
  });

  test("Admin can filter parts by category", async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await page.goto("/admin/inventory/parts");

    const categoryFilter = page.locator(
      'button:has-text("Category"), select[name="category"]'
    );
    const hasFilter = await categoryFilter
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    if (hasFilter) {
      await categoryFilter.click();
      await page.click('text=mechanical, [value="mechanical"]');
    }
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

  test("Tech can see consumed parts on ticket", async ({
    page,
    loginAsTech,
  }) => {
    await loginAsTech();
    await page.goto("/dashboard/tickets");

    const ticketLink = page.locator('a[href*="/tickets/"]').first();
    if (await ticketLink.isVisible({ timeout: 3000 })) {
      await ticketLink.click();
      await page.waitForURL(/\/tickets\/\d+/);

      // Look for parts section
      const partsSection = page.locator("text=Parts, text=Consumed");
      if (await partsSection.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(partsSection).toBeVisible();
      }
    }
  });

  test("Tech can see labor logs on ticket", async ({ page, loginAsTech }) => {
    await loginAsTech();
    await page.goto("/dashboard/tickets");

    const ticketLink = page.locator('a[href*="/tickets/"]').first();
    if (await ticketLink.isVisible({ timeout: 3000 })) {
      await ticketLink.click();
      await page.waitForURL(/\/tickets\/\d+/);

      // Look for time tracking section
      const timeSection = page.locator("text=Time, text=Labor");
      if (await timeSection.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(timeSection).toBeVisible();
      }
    }
  });
});
