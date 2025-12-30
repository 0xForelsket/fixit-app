import { expect, test } from "./fixtures";

test.describe("Marketing Landing Page", () => {
  // Override baseURL for this specific test suite to test the root domain
  test.use({ baseURL: "http://localhost:3000" });

  test("should render marketing page on root domain", async ({ page }) => {
    await page.goto("/");
    // Check for marketing content - the nav has "FIXIT" text
    const navBrand = page.locator('nav span:has-text("FIXIT")');
    await expect(navBrand).toBeVisible();
    // Check for hero content
    await expect(page.locator("h1")).toContainText("Maintenance");
  });

  test("should have CTA buttons pointing to app subdomain", async ({
    page,
  }) => {
    await page.goto("/");

    // Check for "Get Started" and "Start Managing" buttons
    const getStartedBtn = page.getByRole("link", { name: /Get Started/i });
    await expect(getStartedBtn).toBeVisible();

    const startManagingBtn = page.getByRole("link", {
      name: /Start Managing/i,
    });
    await expect(startManagingBtn).toBeVisible();
  });

  test("should display feature sections", async ({ page }) => {
    await page.goto("/");

    // Check for feature cards
    await expect(page.locator("text=Asset Intelligence")).toBeVisible();
    await expect(page.locator("text=Preventative Scheduling")).toBeVisible();
  });
});
