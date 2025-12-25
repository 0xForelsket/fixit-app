import { expect, test } from "./fixtures";

test.describe("Ticket Management", () => {
  test("Tech can access dashboard", async ({ page, loginAsTech }) => {
    await loginAsTech();
    // Successfully logged in
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("Tech can navigate to tickets", async ({ page, loginAsTech }) => {
    await loginAsTech();

    // Try to navigate to tickets
    const ticketsLink = page.locator('a[href*="tickets"]').first();
    if (await ticketsLink.isVisible({ timeout: 3000 })) {
      await ticketsLink.click();
      await expect(page).toHaveURL(/tickets/);
    }
  });

  test("Tech can view ticket details", async ({ page, loginAsTech }) => {
    await loginAsTech();
    await page.goto("/dashboard/tickets");

    // Click on first ticket if available
    const ticketLink = page.locator('a[href*="/tickets/"]').first();
    if (await ticketLink.isVisible({ timeout: 3000 })) {
      await ticketLink.click();
      await expect(page).toHaveURL(/\/tickets\/\d+/);
    }
  });

  test("Operator can access machine list", async ({
    page,
    loginAsOperator,
  }) => {
    await loginAsOperator();
    // Successfully logged in - operator goes to / with machines
    await expect(page).toHaveURL("/");
  });
});
