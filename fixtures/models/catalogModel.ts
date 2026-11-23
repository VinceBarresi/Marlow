export interface ProductModel {
  sku: string;
  name: string;
  category: string;
  description: string;
  priceCents: number;
  onHand: number;
  reserved: number;
  available: number;
}

export const productKeys = [
  "available",
  "category",
  "description",
  "name",
  "onHand",
  "priceCents",
  "reserved",
  "sku",
] as const;

export const inventoryItemKeys = [
  "available",
  "bin",
  "category",
  "name",
  "onHand",
  "priceCents",
  "reorderPoint",
  "reserved",
  "sku",
  "updatedAt",
] as const;

export const categoryKeys = ["category", "products"] as const;
