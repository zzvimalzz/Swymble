import { expect, test } from "@playwright/test";
import GtfsRealtimeBindings from "gtfs-realtime-bindings";

/** A one-vehicle GTFS-Realtime feed, encoded like the real upstream. */
function transitFixture(lat: number, lng: number): Buffer {
  const message = GtfsRealtimeBindings.transit_realtime.FeedMessage.create({
    header: { gtfsRealtimeVersion: "2.0", timestamp: Math.floor(Date.now() / 1000) },
    entity: [
      {
        id: "veh-1",
        vehicle: {
          position: { latitude: lat, longitude: lng, bearing: 45 },
          trip: { routeId: "TEST" },
        },
      },
    ],
  });
  return Buffer.from(GtfsRealtimeBindings.transit_realtime.FeedMessage.encode(message).finish());
}

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

    // …and radio-style: the active data layer can't be un-toggled, so the
    // map never goes empty.
    await page.getByTestId("layer-toggle-gdp").click();
    await expect(page.getByTestId("layer-toggle-gdp")).toHaveAttribute("data-state", "checked");
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

  test("live transit layer polls the feed and reports per-agency counts", async ({ page }) => {
    await page.route("https://api.data.gov.my/gtfs-realtime/**", async (route) => {
      await route.fulfill({
        contentType: "application/octet-stream",
        body: transitFixture(3.14, 101.69),
      });
    });

    await page.goto("/map?layer=transit");
    await expect(page.locator(".maplibregl-canvas")).toBeVisible({ timeout: 15_000 });

    // Transit layer is on via the deep link; each agency reports 1 vehicle.
    await expect(page.getByTestId("layer-toggle-transit")).toHaveAttribute("data-state", "checked");
    await expect(page.getByText("KTM trains")).toBeVisible();
    await expect(page.getByText(/^updated/)).toBeVisible({ timeout: 15_000 });
  });

  test("dataset detail pages open from the data panel", async ({ page }) => {
    await page.goto("/data/fuel-price");
    await expect(page.getByRole("heading", { name: "Fuel prices" })).toBeVisible();
    await expect(page.getByText("dependability tier A")).toBeVisible();
    await expect(page.getByRole("img", { name: /Weekly fuel prices/ })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("the legacy explorer route redirects into the atlas", async ({ page }) => {
    await page.goto("/explorer?state=12");
    await page.waitForURL("**/map?state=12");
    await expect(page.getByTestId("inspector-heading")).toHaveText("Sabah", { timeout: 15_000 });
  });

  test("module pages stand on their own", async ({ page }) => {
    await page.route("https://api.data.gov.my/gtfs-realtime/**", async (route) => {
      await route.fulfill({
        contentType: "application/octet-stream",
        body: transitFixture(3.14, 101.69),
      });
    });

    await page.goto("/transit");
    await expect(page.locator(".maplibregl-canvas")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("transit-total")).toContainText("4", { timeout: 15_000 });

    await page.goto("/population");
    await expect(page.getByRole("heading", { name: /Who lives where/ })).toBeVisible();
    await expect(page.getByRole("table")).toContainText(/\d{1,3}(,\d{3})+/, { timeout: 15_000 });

    await page.goto("/economy");
    await expect(page.getByRole("heading", { name: /What Malaysia earns/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /GDP \(all sectors\)/ })).toBeVisible({
      timeout: 15_000,
    });
  });
});
