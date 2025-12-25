import { test as base, expect } from "@playwright/test";

/**
 * Extended test fixtures with authentication helpers.
 * Credentials match seed.ts:
 *   Admin:    ADMIN-001 / 1234
 *   Tech:     TECH-001  / 5678
 *   Operator: OP-001    / 0000
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
      // Wait for redirect away from login
      await page.waitForURL((url) => !url.pathname.includes("/login"), {
        timeout: 10000,
      });
    };
    await use(login);
  },

  loginAsTech: async ({ page }, use) => {
    const login = async () => {
      await page.goto("/login");
      await page.fill('input[name="employeeId"]', "TECH-001");
      await page.fill('input[name="pin"]', "5678");
      await page.click('button[type="submit"]');
      // Wait for redirect away from login
      await page.waitForURL((url) => !url.pathname.includes("/login"), {
        timeout: 10000,
      });
    };
    await use(login);
  },

  loginAsOperator: async ({ page }, use) => {
    const login = async () => {
      await page.goto("/login");
      await page.fill('input[name="employeeId"]', "OP-001");
      await page.fill('input[name="pin"]', "0000");
      await page.click('button[type="submit"]');
      // Wait for redirect away from login
      await page.waitForURL((url) => !url.pathname.includes("/login"), {
        timeout: 10000,
      });
    };
    await use(login);
  },
});

export { expect };
