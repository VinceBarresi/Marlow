import { expect, type Page } from "@playwright/test";

export class CareersPage {
  readonly path = "/careers";

  constructor(private readonly page: Page) {}

  async goto(query = "") {
    await this.page.goto(`${this.path}${query}`);
  }

  async openSoftwareEngineerOrFirst() {
    const software = this.page.getByTestId("job-card-software-engineer");
    if (await software.count()) {
      await software.click();
      return;
    }
    await this.page.locator("[data-testid^=job-card-]").first().click();
  }

  async expectLoaded() {
    await expect(this.page.getByTestId("careers-title")).toHaveText("Careers", {
      timeout: 20000,
    });
    await expect(this.page.getByTestId("careers-grid")).toBeVisible();
  }
}

export class ApplyPage {
  constructor(private readonly page: Page) {}

  async goto(slug: string) {
    await this.page.goto(`/careers/${slug}`);
  }

  async expectFormVisible() {
    await expect(this.page.getByTestId("apply-form")).toBeVisible({ timeout: 20000 });
    await expect(this.page.getByTestId("apply-title")).toBeVisible();
  }
}
