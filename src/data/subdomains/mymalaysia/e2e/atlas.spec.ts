import { expect, test } from "@playwright/test";

// The Atlas: one persistent map with layers, inspector, timeline, search.
test.describe("atlas", () => {
  test("loads with the layer manager and a population choropleth", async ({ page }) => {
    await page.goto("/map");

    await expect(page.locator(".maplibregl-canvas")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Layers" })).toBeVisible();

    // Population is the default data layer, with legend + attribution.
    const populationToggle = page.getByTestId("layer-toggle-population");
    await expect(populationToggle).toHaveAttribute("data-state", "checked", { timeout: 15_000 });
    await expect(page.getByText("√ scale").first()).toBeVisible();

    // Data layers are exclusive: activating GDP deactivates population.
    await page.getByTestId("layer-toggle-gdp").click();
    await expect(page.getByTestId("layer-toggle-gdp")).toHaveAttribute("data-state", "checked");
    await expect(populationToggle).toHaveAttribute("data-state", "unchecked");
  });

  test("timeline scrubs the active layer through its years", async ({ page }) => {
    await page.goto("/map");
    await expect(page.getByTestId("timeline-bar")).toBeVisible({ timeout: 20_000 });

    const year = page.getByTestId("timeline-year");
    const before = await year.textContent();
    const slider = page.getByRole("slider", { name: /Population year/ });
    await slider.focus();
    await page.keyboard.press("ArrowLeft");
    await expect(year).not.toHaveText(before ?? "", { timeout: 5_000 });
  });

  test("search flies to a district and opens the inspector with figures", async ({ page }) => {
    await page.goto("/map");
    await page.getByTestId("atlas-search-button").click();
    await page.getByTestId("atlas-search-input").fill("Kuching");
    await page
      .getByRole("option", { name: /Kuching/ })
      .first()
      .click();

    await expect(page.getByTestId("inspector-heading")).toHaveText("Kuching", {
      timeout: 15_000,
    });
    const inspector = page.getByLabel("Inspector panel");
    await expect(inspector).toContainText("Population");
    await expect(inspector).toContainText(/\d{1,3}(,\d{3})+/);
  });

  test("deep links open a state in the inspector", async ({ page }) => {
    await page.goto("/map?state=6");
    await expect(page.getByTestId("inspector-heading")).toHaveText("Pahang", {
      timeout: 15_000,
    });
    await expect(page.getByLabel("Inspector panel")).toContainText("Largest districts");
  });

  test("legacy routes redirect into the atlas", async ({ page }) => {
    await page.goto("/explorer?state=12");
    await page.waitForURL("**/map?state=12");
    await expect(page.getByTestId("inspector-heading")).toHaveText("Sabah", { timeout: 15_000 });

    await page.goto("/live");
    await page.waitForURL("**/map?panel=live");
    await expect(page.getByRole("heading", { name: "Live" })).toBeVisible();
  });
});
