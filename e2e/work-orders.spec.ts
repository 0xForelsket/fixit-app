import { expect, test } from "./fixtures";

test.describe("Technician - Work Orders", () => {
  test.beforeEach(async ({ loginAsTech }) => {
    await loginAsTech();
  });

  test("Tech can view work order list and search", async ({ page }) => {
    await page.goto("/maintenance/work-orders");
    await expect(
      page.getByRole("heading", { name: /Work Order Queue/i })
    ).toBeVisible();

    // Check for stats
    await expect(page.getByText("Open", { exact: true }).first()).toBeVisible();
    await expect(
      page.getByText("In Progress", { exact: true }).first()
    ).toBeVisible();

    // Basic search functionality
    const searchInput = page.getByPlaceholder(/FILTER BY TITLE/i);
    await searchInput.fill("Maintenance");
    await page.keyboard.press("Enter");

    // URL should update with search param - wait for it
    await page.waitForURL(/search=Maintenance/);
    await expect(page.url()).toContain("search=Maintenance");
  });

  test("Tech can interact with checklist and persistence", async ({ page }) => {
    await page.goto("/maintenance/work-orders");

    // Find the first maintenance or calibration work order (they have checklists usually)
    const workOrderRow = page
      .locator('tr:has-text("Maintenance"), tr:has-text("Calibration")')
      .first();
    const isVisible = await workOrderRow
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (!isVisible) {
      console.log("No maintenance work orders found to test checklist");
      return;
    }

    await workOrderRow.click();
    await page.waitForURL(/\/maintenance\/work-orders\/\d+/);

    // Verify Procedure section
    const procedureHeader = page.getByText(/Maintenance Procedure/i);
    const hasProcedure = await procedureHeader
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (!hasProcedure) {
      console.log(
        "Work order has no procedure attached, skipping checklist test"
      );
      return;
    }

    // Find first checklist item toggle button within the Procedure section
    const procedureSection = page.locator(
      'div:has-text("Maintenance Procedure")'
    );
    const firstCheckItem = procedureSection.locator("button").first();

    // Toggle it
    await firstCheckItem.click();

    // Check if it became 'completed' (background primary color)
    await expect(firstCheckItem).toHaveClass(/bg-primary-500/);

    // Refresh page to verify persistence
    await page.reload();
    await expect(firstCheckItem).toHaveClass(/bg-primary-500/);

    // Toggle back to pending
    await firstCheckItem.click();
    await expect(firstCheckItem).not.toHaveClass(/bg-primary-500/);
  });

  test("Tech can log time using the timer", async ({ page }) => {
    await page.goto("/maintenance/work-orders");
    await page.locator("tr").nth(1).click();
    await page.waitForURL(/\/maintenance\/work-orders\/\d+/);

    // Switch to Resources tab
    await page.getByRole("tab", { name: "Resources" }).click();

    // Find Start Timer button
    const startButton = page.getByRole("button", { name: /Start Timer/i });
    await expect(startButton).toBeVisible();
    await startButton.click();

    // Timer should now show Stop Work
    const stopButton = page.getByRole("button", { name: /Stop Work/i });
    await expect(stopButton).toBeVisible();

    // Timer should be counting (at least 00:00:00 will show up)
    await expect(page.getByText(/Session Active/i)).toBeVisible();

    // Fill notes during session
    const uniqueNote = `E2E Test Session ${Math.floor(Math.random() * 10000)}`;
    const notesInput = page.getByPlaceholder("What are you working on?");
    await notesInput.fill(uniqueNote);

    // Wait to ensure duration > 0
    await page.waitForTimeout(3000);

    // Stop timer
    const responsePromise = page.waitForResponse(
      (res) => res.url().includes("/api/labor") && res.status() === 201
    );
    await stopButton.click();
    await responsePromise;

    // Reload page to ensure server state is fresh
    await page.reload();

    // Check labor log section for the note we entered
    await expect(page.getByText(uniqueNote).first()).toBeVisible({
      timeout: 15000,
    });
  });

  test("Tech can add manual labor entry", async ({ page }) => {
    await page.goto("/maintenance/work-orders");
    await page.locator("tr").nth(1).click();
    await page.waitForURL(/\/maintenance\/work-orders\/\d+/);

    // Switch to Resources tab
    await page.getByRole("tab", { name: "Resources" }).click();

    // Toggle manual entry form
    await page.getByLabel("Add manual time entry").first().click();

    // Fill manual entry form
    const uniqueNote = `Manual E2E Entry ${Math.floor(Math.random() * 10000)}`;
    await page.getByPlaceholder("Min").fill("45");
    await page
      .getByPlaceholder("e.g., Completed inspection...")
      .fill(uniqueNote);

    const responsePromise = page.waitForResponse(
      (res) => res.url().includes("/api/labor") && res.status() === 201
    );
    await page.getByRole("button", { name: /Confirm Entry/i }).click();
    await responsePromise;

    // Reload page
    await page.reload();

    // Verify entry in history
    await expect(page.getByText(uniqueNote).first()).toBeVisible({
      timeout: 10000,
    });
    await expect(
      page
        .getByText(uniqueNote)
        .first()
        .locator("..")
        .locator("..")
        .getByText("45m")
        .first()
    ).toBeVisible();
  });

  test("Tech can transition work order status and add comments", async ({
    page,
  }) => {
    await page.goto("/maintenance/work-orders?status=open");

    const openRow = page.locator("tr").filter({ hasText: "Open" }).first();
    const isVisible = await openRow.isVisible().catch(() => false);
    if (!isVisible) {
      console.log("No open work orders found for status transition test");
      return;
    }

    await openRow.click();
    await page.waitForURL(/\/maintenance\/work-orders\/\d+/);

    // Add a comment
    await page.getByRole("button", { name: "Comment" }).click();
    const commentArea = page.getByPlaceholder("Type your comment...");
    await commentArea.fill("E2E Test Comment");
    await page.getByRole("button", { name: "Post" }).click();

    // Comment should appear in activity log
    await page.getByRole("tab", { name: "Activity" }).click();
    await expect(page.getByText("E2E Test Comment").first()).toBeVisible();

    // Resolve Work Order
    const resolveBtn = page.getByRole("button", {
      name: /^Resolve$/i,
    });
    if (await resolveBtn.isVisible()) {
      await resolveBtn.click();

      const notesArea = page.getByPlaceholder("What was done?");
      await notesArea.fill("Fixed via E2E test");

      await page.getByRole("button", { name: /Confirm|Resolve/i }).click();

      // Wait for navigation or reload
      await page.waitForTimeout(2000); // Give time for server action
      await page.reload();

      // Status should update to Resolved
      await expect(page.getByText(/Resolved/i).first()).toBeVisible();
      await expect(page.getByText("Fixed via E2E test").first()).toBeVisible();
    }
  });
});
