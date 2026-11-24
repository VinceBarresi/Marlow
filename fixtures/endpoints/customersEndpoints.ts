export const customersEndpoints = {
  customers: "/api/customers",
  customer: (id: string) => `/api/customers/${encodeURIComponent(id)}`,
};
