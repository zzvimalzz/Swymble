import { expect, test } from "@playwright/test";

// The Live lens inside the atlas: fuel from the committed artifact (real
// data), weather via an intercepted MET response so the spec is
// deterministic offline.
const weatherFixture = (city: string) => [
  {
    location: { location_id: "Ds000", location_name: city },
    date: new Date().toISOString().slice(0, 10),
    morning_forecast: "Tiada hujan",
    afternoon_forecast: "Hujan di beberapa tempat",
    night_forecast: "Tiada hujan",
    summary_forecast: "Hujan di beberapa tempat",
    summary_when: "Petang",
    min_temp: 24,
    max_temp: 33,
  },
];

test.describe("live lens", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("https://api.data.gov.my/weather/forecast/**", async (route) => {
      const url = new URL(route.request().url());
      const city = decodeURIComponent(url.searchParams.get("contains") ?? "").split("@")[0];
      await route.fulfill({ json: weatherFixture(city || "Kuala Lumpur") });
    });
  });

  test("shows pump prices, the chart, and forecasts beside the map", async ({ page }) => {
    await page.goto("/map?panel=live");

    // The map stays alive next to the panel.
    await expect(page.locator(".maplibregl-canvas")).toBeVisible({ timeout: 15_000 });

    // Fuel tiles carry real artifact prices.
    await expect(page.getByTestId("fuel-ron95")).toContainText(/RM \d\.\d{2}/, {
      timeout: 15_000,
    });
    await expect(page.getByTestId("fuel-diesel")).toContainText(/vs last week|unchanged/);

    // The chart renders with its table fallback.
    await expect(page.getByRole("img", { name: /Weekly fuel prices/ })).toBeVisible();
    await page.getByText("View recent weeks as a table").click();
    await expect(page.getByRole("table")).toBeVisible();

    // Weather tiles from the (intercepted) MET feed.
    await expect(page.getByTestId("weather-tile").first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("weather-tile")).toHaveCount(8);

    // Attribution for the fuel dataset within the panel.
    await expect(
      page.getByLabel("Live panel").getByRole("link", { name: "data.gov.my", exact: true }),
    ).toBeVisible();
  });
});
