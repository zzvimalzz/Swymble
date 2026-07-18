import { expect, test } from "@playwright/test";

// Exercises the mapping engine through the /dev/map harness: canvas boots,
// boundaries load, hover + click selection work, levels switch.
test.describe("map engine", () => {
  test("boots, hovers, selects, and switches levels", async ({ page }) => {
    await page.goto("/dev/map");

    const canvas = page.locator(".maplibregl-canvas");
    await expect(canvas).toBeVisible({ timeout: 15_000 });

    // Wait for tiles/sources to settle, then hover roughly over Borneo
    // (right half of the canvas) until a state name appears.
    await page.waitForTimeout(2500);
    const box = await canvas.boundingBox();
    if (!box) throw new Error("canvas has no bounding box");

    // Candidate points over land (Borneo, then the peninsula) — the exact
    // pixel depends on viewport aspect, so probe until one hits a state.
    const landPoints: Array<[number, number]> = [
      [0.82, 0.35],
      [0.15, 0.55],
      [0.85, 0.3],
      [0.17, 0.45],
    ];
    const hovered = page.getByTestId("hovered-name");
    let hit: [number, number] | null = null;
    await expect(async () => {
      for (const [fx, fy] of landPoints) {
        await page.mouse.move(box.x + box.width * fx, box.y + box.height * fy, { steps: 4 });
        await page.waitForTimeout(250);
        if ((await hovered.textContent()) !== "—") {
          hit = [fx, fy];
          return;
        }
      }
      throw new Error("no state under any probe point yet");
    }).toPass({ timeout: 20_000 });

    // Click selects and names the feature.
    const [fx, fy] = hit!;
    await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy);
    await expect(page.getByTestId("selected-name")).toContainText("selected:", {
      timeout: 10_000,
    });

    // Switching to districts clears selection and keeps the map alive.
    await page.getByRole("button", { name: "Districts" }).click();
    await expect(page.getByTestId("selected-name")).toHaveText("");
    await expect(canvas).toBeVisible();
  });
});
