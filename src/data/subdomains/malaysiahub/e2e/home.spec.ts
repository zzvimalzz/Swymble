import { expect, test } from "@playwright/test";

test.describe("global shell", () => {
  test("homepage responds with branding and navigation", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.ok()).toBe(true);

    await expect(page).toHaveTitle(/MalaysiaHub/);
    await expect(
      page.getByRole("banner").getByRole("link", { name: /MalaysiaHub — home/i }),
    ).toBeVisible();
    await expect(page.getByRole("contentinfo")).toContainText("CC BY 4.0");
  });

  test("404 page is designed, not default", async ({ page }) => {
    const response = await page.goto("/definitely-not-a-page");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("map");
  });

  test("command palette opens with keyboard shortcut", async ({ page }) => {
    await page.goto("/");
    // The shortcut listener attaches after hydration; retry the keypress
    // until React is interactive.
    await expect(async () => {
      await page.keyboard.press("ControlOrMeta+k");
      await expect(page.getByPlaceholder("Where to?")).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 15_000 });
  });
});
