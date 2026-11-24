export class CareersPage {
  static path = "/careers";

  static title = "[data-testid=careers-title]";
  static lede = "[data-testid=careers-lede]";
  static grid = "[data-testid=careers-grid]";
  static empty = "[data-testid=careers-empty]";
  static jobCard = "[data-testid^=job-card-]";
  static softwareEngineer = "[data-testid=job-card-software-engineer]";

  static visit(query = "") {
    cy.visit(`${CareersPage.path}${query}`);
  }

  static openSoftwareEngineerOrFirst() {
    cy.get("body").then(($body) => {
      if ($body.find(CareersPage.softwareEngineer).length > 0) {
        cy.get(CareersPage.softwareEngineer).click();
      } else {
        cy.get(CareersPage.jobCard).first().click();
      }
    });
  }
}

export class ApplyPage {
  static path = (slug: string) => `/careers/${slug}`;

  static title = "[data-testid=apply-title]";
  static form = "[data-testid=apply-form]";
  static name = "[data-testid=apply-name]";
  static email = "[data-testid=apply-email]";
  static submit = "[data-testid=apply-submit]";
  static back = "[data-testid=apply-back]";

  static visit(slug: string) {
    cy.visit(ApplyPage.path(slug));
  }
}
