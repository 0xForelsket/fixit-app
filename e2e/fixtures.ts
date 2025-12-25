import { test as base, expect } from "@playwright/test";

/**
 * Extended test fixtures with authentication helpers.
 */
export const test = base.extend<{
  loginAsAdmin: () => Promise<void>;
  loginAsTech: () => Promise<void>;
  loginAsOperator: () => Promise<void>;
}>({
  loginAsAdmin: async ({ page }, use) => {
    const login = async () => {
      await page.goto("/login");
      await page.fill('input[name="employeeId"]', "ADMIN-001");
      await page.fill('input[name="pin"]', "1234");
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/(dashboard|admin)/);
    };
    await use(login);
  },

  loginAsTech: async ({ page }, use) => {
    const login = async () => {
      await page.goto("/login");
      await page.fill('input[name="employeeId"]', "TECH-001");
      await page.fill('input[name="pin"]', "1234");
      await page.click('button[type="submit"]');
      await page.waitForURL("/dashboard");
    };
    await use(login);
  },

  loginAsOperator: async ({ page }, use) => {
    const login = async () => {
      await page.goto("/login");
      await page.fill('input[name="employeeId"]', "OP-001");
      await page.fill('input[name="pin"]', "1234");
      await page.click('button[type="submit"]');
      await page.waitForURL("/");
    };
    await use(login);
  },
});

export { expect };
