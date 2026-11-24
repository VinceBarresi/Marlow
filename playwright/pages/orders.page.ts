import { expect, type Page } from "@playwright/test";

export class OrdersPage {
  constructor(private readonly page: Page) {}

  async gotoCustomer(query = "") {
    await this.page.goto(`/orders${query}`);
  }

  async gotoStaff(query = "") {
    await this.page.goto(`/staff/orders${query}`);
  }

  async expectCustomerEmpty(message = "You have no orders yet.") {
    await expect(this.page.getByTestId("orders-title")).toHaveText("Your orders", {
      timeout: 20000,
    });
    await expect(this.page.getByTestId("orders-count")).toContainText("0 orders");
    await expect(this.page.getByTestId("orders-empty")).toHaveText(message);
    await expect(this.page.getByTestId("orders-table")).toHaveCount(0);
  }

  async expectCustomerFilteredEmpty() {
    await this.expectCustomerEmpty("No orders with that status.");
  }

  async expectCustomerHasOrders() {
    await expect(this.page.getByTestId("orders-title")).toHaveText("Your orders", {
      timeout: 20000,
    });
    await expect(this.page.getByTestId("orders-table")).toBeVisible();
    await expect(this.page.locator("[data-testid^=orders-row-]").first()).toBeVisible();
  }

  async expectFulfillmentEmpty(message = "No orders yet.") {
    await expect(this.page.getByTestId("fulfillment-title")).toHaveText("All orders", {
      timeout: 20000,
    });
    await expect(this.page.getByTestId("fulfillment-count")).toContainText("0 orders");
    await expect(this.page.getByTestId("fulfillment-empty")).toHaveText(message);
    await expect(this.page.getByTestId("fulfillment-table")).toHaveCount(0);
  }

  async expectFulfillmentFilteredEmpty() {
    await expect(this.page.getByTestId("fulfillment-title")).toHaveText("All orders", {
      timeout: 20000,
    });
    await expect(this.page.getByTestId("fulfillment-empty")).toHaveText(
      "No orders with that status.",
    );
  }
}
