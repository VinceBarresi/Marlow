import { expect, type Page } from "@playwright/test";

export class LocationsPage {
  readonly path = "/locations";

  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto(this.path);
  }

  async openFirstLocation() {
    await this.page.locator("[data-testid^=location-card-]").first().click();
  }

  async expectLoaded() {
    await expect(this.page.getByTestId("locations-title")).toHaveText("Locations", {
      timeout: 20000,
    });
    await expect(this.page.getByTestId("locations-grid")).toBeVisible();
  }
}

export class LocationPage {
  constructor(private readonly page: Page) {}

  async goto(slug: string) {
    await this.page.goto(`/locations/${slug}`);
  }

  async expectLoaded() {
    await expect(this.page.getByTestId("location-name")).toBeVisible({ timeout: 20000 });
  }
}
