export class OrdersPage {
  static customerPath = "/orders";
  static staffPath = "/staff/orders";

  static title = "[data-testid=orders-title]";
  static count = "[data-testid=orders-count]";
  static empty = "[data-testid=orders-empty]";
  static table = "[data-testid=orders-table]";
  static status = "[data-testid=orders-status]";
  static row = "[data-testid^=orders-row-]";

  static fulfillmentTitle = "[data-testid=fulfillment-title]";
  static fulfillmentCount = "[data-testid=fulfillment-count]";
  static fulfillmentEmpty = "[data-testid=fulfillment-empty]";
  static fulfillmentTable = "[data-testid=fulfillment-table]";

  static visitCustomer(query = "") {
    cy.visit(`${OrdersPage.customerPath}${query}`);
  }

  static visitStaff(query = "") {
    cy.visit(`${OrdersPage.staffPath}${query}`);
  }
}
