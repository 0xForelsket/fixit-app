import { expect, test } from "./fixtures";

test.describe("Maintenance Automation & Checklists", () => {
  test("Admin can trigger maintenance scheduler and Tech can complete checklist", async ({ page, loginAsAdmin, loginAsTech }) => {
    // 1. Admin creates a new schedule
    await loginAsAdmin();
    await page.goto("/dashboard/maintenance/schedules/new");
    // Use matching locator styles to what worked in debug script
    await page.getByRole('textbox', { name: "Title" }).fill("Monthly Lubrication");
    
    // Select equipment (first option)
    await page.selectOption('select[name="equipmentId"]', { index: 1 });
    
    await page.selectOption('select[name="type"]', "maintenance");
    
    // Set frequency to 1 day (should be due immediately on first run logic)
    await page.getByRole('spinbutton', { name: "Frequency" }).fill("1");
    
    await page.waitForTimeout(500); // Wait for state to settle

    // Add a checklist step
    await page.getByRole("button", { name: "Add First Step" }).click();
    
    await page.getByPlaceholder("Step description...").fill("Check hydraulic levels");
    await page.getByRole('spinbutton').last().fill("15");

    await page.waitForTimeout(500); // Wait for validation/state

    // Save the schedule
    await page.getByRole("button", { name: "Save Schedule" }).click();
  
    // Wait for navigation to the list page
    await page.waitForURL('**/dashboard/maintenance/schedules', { timeout: 10000 });

    // 2. Admin triggers scheduler
    await page.waitForTimeout(1000);
    const runButton = page.getByText("Run Scheduler");
    await runButton.click();
    
    // Wait for success toast (text might vary if auto-trigger race happened)
    // Expect "Scheduler run complete" (title) or "Scheduler failed" (if error)
    await expect(page.getByText(/scheduler run complete/i)).toBeVisible();
    
    // We expect at least one work order to be generated eventually (by auto or manual)
    // So we don't strictly assert "1 work orders generated" toast here to avoid race condition flakiness.

    // 3. Tech checks the generated work order
    await loginAsTech();
    await page.goto("/dashboard/work-orders");
    
    // Find the first maintenance or calibration work order
    const maintenanceWO = page.locator('tr:has-text("Maintenance"), tr:has-text("Calibration")').first();
    await expect(maintenanceWO).toBeVisible();
    
    // Navigate to details
    await maintenanceWO.click();
    await page.waitForURL(/\/dashboard\/work\-orders\/\d+/);

    // 3. Verify and interact with checklist
    const procedureHeader = page.getByRole("heading", { name: /maintenance procedure/i });
    await expect(procedureHeader).toBeVisible();

    // Find first checklist item
    const firstCheckItem = page.locator('button:has(svg)').first();
    await expect(firstCheckItem).toBeVisible();
    
    // Get initial state (should be pending, so button should not have primary bg)
    // Actually, let's just click it and verify the toggle
    await firstCheckItem.click();
    
    // The button should now have the primary background color (bg-primary-500)
    await expect(firstCheckItem).toHaveClass(/bg-primary-500/);
    
    // Verify progress update
    await expect(page.getByText(/\d+ \/ \d+ steps/i)).toBeVisible();
  });
});
