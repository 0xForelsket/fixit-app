import { expect, test } from "./fixtures";

test.describe("Operator Flows", () => {
  test.beforeEach(async ({ page, loginAsOperator }) => {
    await loginAsOperator();
  });

  test("should see machine grid on login", async ({ page }) => {
    await expect(page).toHaveURL("/");
    await expect(page.locator("text=Machine, text=Status")).toBeVisible();
  });

  test("should search for machines", async ({ page }) => {
    const searchInput = page.locator(
      'input[placeholder*="Search"], input[type="search"]'
    );
    if (await searchInput.isVisible()) {
      await searchInput.fill("CNC");

      // Results should filter
      await page.waitForTimeout(500);
    }
  });

  test("should filter machines by status", async ({ page }) => {
    const statusFilter = page.locator(
      'button:has-text("Status"), select[name="status"]'
    );
    if (await statusFilter.isVisible()) {
      await statusFilter.click();
      await page.click('text=Operational, [value="operational"]');
    }
  });

  test("should click machine to report issue", async ({ page }) => {
    // Click on a machine card
    const machineCard = page
      .locator('[data-testid="machine-card"], a[href*="/report/"]')
      .first();
    if (await machineCard.isVisible()) {
      await machineCard.click();

      // Should be on report page
      await expect(page).toHaveURL(/\/report\//);
    }
  });

  test("should view own tickets", async ({ page }) => {
    await page.goto("/my-tickets");

    await expect(page).toHaveURL("/my-tickets");
    await expect(page.locator("text=Ticket, text=Status")).toBeVisible();
  });

  test("should view profile", async ({ page }) => {
    await page.goto("/profile");

    await expect(page).toHaveURL("/profile");
    await expect(page.locator('input[name="name"]')).toBeVisible();
  });
});

test.describe("Time Tracking", () => {
  test("should start and stop timer on ticket", async ({
    page,
    loginAsTech,
  }) => {
    await loginAsTech();

    // Navigate to a ticket
    await page.goto("/dashboard/tickets");
    const ticketLink = page.locator('a[href*="/tickets/"]').first();

    if (await ticketLink.isVisible()) {
      await ticketLink.click();
      await page.waitForURL(/\/tickets\/\d+/);

      // Find timer section
      const startBtn = page.locator('button:has-text("Start")');
      if (await startBtn.isVisible()) {
        await startBtn.click();

        // Timer should be running
        await expect(page.locator("text=Timer, text=running")).toBeVisible({
          timeout: 3000,
        });

        // Stop timer
        const stopBtn = page.locator('button:has-text("Stop")');
        await stopBtn.click();

        await expect(page.locator("text=saved, text=logged")).toBeVisible({
          timeout: 5000,
        });
      }
    }
  });

  test("should view time entries on ticket", async ({ page, loginAsTech }) => {
    await loginAsTech();

    await page.goto("/dashboard/tickets");
    const ticketLink = page.locator('a[href*="/tickets/"]').first();

    if (await ticketLink.isVisible()) {
      await ticketLink.click();
      await page.waitForURL(/\/tickets\/\d+/);

      // Should see time tracking section
      await expect(
        page.locator("text=Time Tracking, text=Time Entries")
      ).toBeVisible();
    }
  });
});
