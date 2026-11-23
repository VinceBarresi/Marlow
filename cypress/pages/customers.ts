export class CustomersPage {
  static path = "/staff/customers";

  static title = "[data-testid=customers-title]";
  static count = "[data-testid=customers-count]";
  static table = "[data-testid=customers-table]";
  static row = "[data-testid^=customers-row-]";
  static link = "[data-testid^=customers-link-]";

  static visit(query = "") {
    cy.visit(`${CustomersPage.path}${query}`);
  }

  static openFirstCustomer() {
    cy.get(CustomersPage.link).first().click();
  }
}

export class CustomerPage {
  static path = (id: string) => `/staff/customers/${id}`;

  static name = "[data-testid=customer-name]";
  static email = "[data-testid=customer-email]";
  static back = "[data-testid=customer-back]";
  static orders = "[data-testid=customer-orders]";

  static visit(id: string) {
    cy.visit(CustomerPage.path(id));
  }
}
