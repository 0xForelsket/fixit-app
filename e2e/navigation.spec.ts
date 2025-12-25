import { expect, test } from "./fixtures";

test.describe("Navigation", () => {
  test("Admin sees dashboard after login", async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await expect(page).not.toHaveURL("/login");
  });

  test("Admin can navigate to equipment", async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await page.goto("/admin/equipment");
    await expect(page).toHaveURL("/admin/equipment");
  });

  test("Admin can navigate to users", async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await page.goto("/admin/users");
    await expect(page).toHaveURL("/admin/users");
  });

  test("Admin can navigate to inventory", async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await page.goto("/admin/inventory");
    await expect(page).toHaveURL("/admin/inventory");
  });

  test("Tech sees dashboard after login", async ({ page, loginAsTech }) => {
    await loginAsTech();
    await expect(page).not.toHaveURL("/login");
  });
});
