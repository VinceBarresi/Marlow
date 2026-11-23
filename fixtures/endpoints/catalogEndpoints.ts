export const catalogEndpoints = {
  products: "/api/products",
  product: (sku: string) => `/api/products/${encodeURIComponent(sku)}`,
  categories: "/api/categories",
  inventory: "/api/inventory",
};
