import { expect, test } from "./fixtures";

test.describe("Maintenance", () => {
  test("Tech can access maintenance page", async ({ page, loginAsTech }) => {
    await loginAsTech();
    await page.goto("/dashboard/maintenance");
    await expect(page).toHaveURL(/maintenance/);
  });

  test("Tech can access schedules page", async ({ page, loginAsTech }) => {
    await loginAsTech();
    await page.goto("/dashboard/maintenance/schedules");
    await expect(page).toHaveURL(/schedules/);
  });
});
