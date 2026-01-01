import { test as base, expect } from "@playwright/test";

/**
 * Extended test fixtures with authentication helpers.
 * Credentials match seed.ts:
 *   Admin:    ADMIN-001     / 123456
 *   Tech:     TECH-ASSY-01  / 567890
 *   Operator: OP-001        / 000000
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
      await page.fill('input[name="pin"]', "123456");
      await page.click('button[type="submit"]');
      // Wait for redirect away from login
      await page.waitForURL((url) => !url.pathname.includes("/login"), {
        timeout: 30000,
      });
    };
    await use(login);
  },

  loginAsTech: async ({ page }, use) => {
    const login = async () => {
      await page.goto("/login");
      await page.fill('input[name="employeeId"]', "TECH-ASSY-01");
      await page.fill('input[name="pin"]', "567890");
      await page.click('button[type="submit"]');
      // Wait for redirect away from login
      await page.waitForURL((url) => !url.pathname.includes("/login"), {
        timeout: 30000,
      });
    };
    await use(login);
  },

  loginAsOperator: async ({ page }, use) => {
    const login = async () => {
      await page.goto("/login");
      await page.fill('input[name="employeeId"]', "OP-001");
      await page.fill('input[name="pin"]', "000000");
      await page.click('button[type="submit"]');
      // Wait for redirect away from login
      await page.waitForURL((url) => !url.pathname.includes("/login"), {
        timeout: 30000,
      });
    };
    await use(login);
  },
});

export { expect };
