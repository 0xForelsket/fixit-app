import { expect, test } from "./fixtures";

test.describe("Navigation & Layout", () => {
  test.describe("Admin Navigation", () => {
    test.beforeEach(async ({ page, loginAsAdmin }) => {
      await loginAsAdmin();
    });

    test("should have sidebar navigation", async ({ page }) => {
      await expect(page.locator("text=Dashboard")).toBeVisible();
      await expect(page.locator("text=Machines")).toBeVisible();
      await expect(page.locator("text=Users")).toBeVisible();
      await expect(page.locator("text=Inventory")).toBeVisible();
      await expect(page.locator("text=Settings")).toBeVisible();
    });

    test("should navigate via sidebar", async ({ page }) => {
      await page.click("text=Machines");
      await expect(page).toHaveURL(/\/machines/);

      await page.click("text=Users");
      await expect(page).toHaveURL(/\/users/);

      await page.click("text=Settings");
      await expect(page).toHaveURL(/\/settings/);
    });
  });

  test.describe("Tech Navigation", () => {
    test.beforeEach(async ({ page, loginAsTech }) => {
      await loginAsTech();
    });

    test("should have sidebar navigation", async ({ page }) => {
      await expect(page.locator("text=Dashboard")).toBeVisible();
      await expect(page.locator("text=Tickets")).toBeVisible();
      await expect(page.locator("text=Maintenance")).toBeVisible();
    });

    test("should navigate to tickets", async ({ page }) => {
      await page.click("text=Tickets");
      await expect(page).toHaveURL(/\/tickets/);
    });

    test("should navigate to maintenance", async ({ page }) => {
      await page.click("text=Maintenance");
      await expect(page).toHaveURL(/\/maintenance/);
    });
  });

  test.describe("Responsive Design", () => {
    test("should show mobile menu on small screens", async ({
      page,
      loginAsTech,
    }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await loginAsTech();

      // Look for hamburger menu
      const menuBtn = page.locator(
        'button[aria-label*="menu"], button:has-text("☰")'
      );
      if (await menuBtn.isVisible()) {
        await menuBtn.click();
        await expect(page.locator("text=Dashboard")).toBeVisible();
      }
    });
  });
});

test.describe("Admin Settings", () => {
  test.beforeEach(async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
  });

  test("should view settings page", async ({ page }) => {
    await page.goto("/admin/settings");

    await expect(page).toHaveURL("/admin/settings");
    await expect(page.locator("text=Settings")).toBeVisible();
  });

  test("should view locations", async ({ page }) => {
    await page.goto("/admin/locations");

    await expect(page.locator("text=Location")).toBeVisible();
  });

  test("should create a location", async ({ page }) => {
    await page.goto("/admin/locations/new");

    await page.fill('input[name="name"]', "E2E Test Location");

    await page.click('button[type="submit"]');

    await expect(page.locator("text=success, text=created")).toBeVisible({
      timeout: 5000,
    });
  });
});

test.describe("QR Codes", () => {
  test.beforeEach(async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
  });

  test("should navigate to QR codes page", async ({ page }) => {
    await page.goto("/admin/qr-codes");

    await expect(page.locator("text=QR, text=Code")).toBeVisible();
  });

  test("should generate QR code for machine", async ({ page }) => {
    await page.goto("/admin/machines");

    const machineLink = page.locator('a[href*="/admin/machines/"]').first();
    if (await machineLink.isVisible()) {
      await machineLink.click();
      await page.waitForURL(/\/admin\/machines\/\d+/);

      // Look for QR code section or button
      const qrSection = page.locator("text=QR Code, canvas, svg");
      await expect(qrSection).toBeVisible();
    }
  });
});
