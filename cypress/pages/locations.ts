export class LocationsPage {
  static path = "/locations";

  static title = "[data-testid=locations-title]";
  static lede = "[data-testid=locations-lede]";
  static grid = "[data-testid=locations-grid]";
  static card = "[data-testid^=location-card-]";

  static visit() {
    cy.visit(LocationsPage.path);
  }

  static openFirstLocation() {
    cy.get(LocationsPage.card).first().click();
  }
}

export class LocationPage {
  static path = (slug: string) => `/locations/${slug}`;

  static name = "[data-testid=location-name]";
  static address = "[data-testid=location-address]";
  static back = "[data-testid=location-back]";
  static inventory = "[data-testid=location-inventory]";

  static visit(slug: string) {
    cy.visit(LocationPage.path(slug));
  }
}
