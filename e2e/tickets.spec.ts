import { expect, test } from "./fixtures";

test.describe("Ticket Management", () => {
  test.describe("Create Ticket (Operator)", () => {
    test("should create a new ticket", async ({ page, loginAsOperator }) => {
      await loginAsOperator();

      // Should be on machine list
      await expect(page).toHaveURL("/");

      // Click on a machine to report an issue
      const machineCard = page.locator('[data-testid="machine-card"]').first();
      if (await machineCard.isVisible()) {
        await machineCard.click();
      } else {
        // Try clicking any machine link
        await page.click('a[href*="/report/"]');
      }

      // Fill out the ticket form
      await page.waitForURL(/\/report\//);

      // Select ticket type (first available)
      await page.click(
        'button[role="combobox"]:has-text("Type"), select[name="type"]'
      );
      await page.click('[role="option"]:first-child, option:first-child');

      // Fill in title
      await page.fill('input[name="title"]', "E2E Test - Machine Issue");

      // Fill in description
      await page.fill(
        'textarea[name="description"]',
        "This is an automated E2E test ticket."
      );

      // Submit the form
      await page.click('button[type="submit"]');

      // Should show success or redirect
      await expect(page.locator("text=success, text=created")).toBeVisible({
        timeout: 10000,
      });
    });
  });

  test.describe("Manage Tickets (Tech)", () => {
    test("should view ticket list on dashboard", async ({
      page,
      loginAsTech,
    }) => {
      await loginAsTech();

      // Should see tickets section
      await expect(page.locator("text=Tickets, text=Active")).toBeVisible();
    });

    test("should view ticket details", async ({ page, loginAsTech }) => {
      await loginAsTech();

      // Navigate to tickets list
      await page.click('a[href*="/tickets"], text=Tickets');
      await page.waitForURL(/\/tickets/);

      // Click on a ticket to view details
      const ticketRow = page.locator('a[href*="/tickets/"]').first();
      if (await ticketRow.isVisible()) {
        await ticketRow.click();

        // Should be on ticket detail page
        await expect(page).toHaveURL(/\/tickets\/\d+/);
        await expect(page.locator("text=Description")).toBeVisible();
      }
    });

    test("should resolve a ticket", async ({ page, loginAsTech }) => {
      await loginAsTech();

      // Navigate to an open ticket
      await page.goto("/dashboard/tickets");

      // Find an open ticket
      const openTicket = page
        .locator('a[href*="/tickets/"]:has-text("Open")')
        .first();
      if (await openTicket.isVisible()) {
        await openTicket.click();
        await page.waitForURL(/\/tickets\/\d+/);

        // Click resolve button
        const resolveBtn = page.locator('button:has-text("Resolve")');
        if (await resolveBtn.isVisible()) {
          await resolveBtn.click();

          // Fill resolution notes
          await page.fill(
            'textarea[name="resolutionNotes"]',
            "Fixed via E2E test"
          );

          // Submit
          await page.click('button[type="submit"]:has-text("Resolve")');

          // Should show resolved status
          await expect(page.locator("text=Resolved")).toBeVisible({
            timeout: 5000,
          });
        }
      }
    });
  });
});
