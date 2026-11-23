export function loginAsAdmin() {
  cy.request("POST", "/api/login", {
    email: "admin@marlow.test",
    password: "datalab",
  });
}

export function loginAsStaff() {
  cy.request("POST", "/api/login", {
    email: "staff@marlow.test",
    password: "datalab",
  });
}

export function loginAsCustomer() {
  cy.request("POST", "/api/login", {
    email: "customer@marlow.test",
    password: "datalab",
  });
}
