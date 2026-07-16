import { expect, test } from "@playwright/test";

// The Explorer foundation: data loads, sidebar drives the map selection,
// district detail shows real figures with attribution.
test.describe("explorer", () => {
  test("drills from country to state to district via the sidebar", async ({ page }) => {
    await page.goto("/explorer");

    await expect(page.getByTestId("explorer-heading")).toHaveText("Malaysia");
    await expect(page.locator(".maplibregl-canvas")).toBeVisible({ timeout: 15_000 });

    // Country level: all 16 states listed once data arrives.
    const stateList = page.getByTestId("state-list");
    await expect(stateList.getByRole("button")).toHaveCount(16, { timeout: 15_000 });

    // Population figures joined from the real artifact.
    const johor = stateList.getByRole("button", { name: /^Johor/ });
    await expect(johor).toContainText(/\d{1,3}(,\d{3})+/);

    await johor.click();
    await expect(page.getByTestId("explorer-heading")).toHaveText("Johor");
    const districtList = page.getByTestId("district-list");
    await expect(districtList.getByRole("button").first()).toBeVisible();

    await districtList.getByRole("button", { name: /^Batu Pahat/ }).click();
    await expect(page.getByTestId("explorer-heading")).toHaveText("Batu Pahat");
    const detail = page.getByTestId("district-detail");
    await expect(detail).toContainText("Population");
    await expect(detail).toContainText(/\d{1,3}(,\d{3})+/);

    // Attribution is present with a quality status.
    await expect(
      page.getByLabel("Explorer data panel").getByRole("link", { name: "OpenDOSM" }),
    ).toBeVisible();

    // Back navigation: district → state → country.
    await page.getByRole("button", { name: /Johor/ }).first().click();
    await expect(page.getByTestId("explorer-heading")).toHaveText("Johor");
    await page
      .getByRole("button", { name: /Malaysia/ })
      .first()
      .click();
    await expect(page.getByTestId("explorer-heading")).toHaveText("Malaysia");
  });

  test("map click selects a state", async ({ page }) => {
    await page.goto("/explorer");
    const canvas = page.locator(".maplibregl-canvas");
    await expect(canvas).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(2500);
    const box = await canvas.boundingBox();
    if (!box) throw new Error("no canvas box");

    // Probe land points until a click changes the heading off "Malaysia".
    const heading = page.getByTestId("explorer-heading");
    const landPoints: Array<[number, number]> = [
      [0.82, 0.35],
      [0.15, 0.55],
      [0.85, 0.3],
      [0.17, 0.45],
    ];
    await expect(async () => {
      for (const [fx, fy] of landPoints) {
        await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy);
        await page.waitForTimeout(300);
        if ((await heading.textContent()) !== "Malaysia") return;
      }
      throw new Error("no state hit yet");
    }).toPass({ timeout: 20_000 });
  });
});
