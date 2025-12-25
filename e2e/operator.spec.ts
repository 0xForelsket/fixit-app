import { expect, test } from "./fixtures";

test.describe("Operator", () => {
  test("Operator lands on home page", async ({ page, loginAsOperator }) => {
    await loginAsOperator();
    await expect(page).toHaveURL("/");
  });

  test("Operator can view profile", async ({ page, loginAsOperator }) => {
    await loginAsOperator();
    await page.goto("/profile");
    await expect(page).toHaveURL("/profile");
  });
});
