export const customerListItemKeys = [
  "createdAt",
  "email",
  "id",
  "name",
  "orders",
  "spentCents",
] as const;

export const customerDetailKeys = ["createdAt", "email", "id", "name"] as const;

export const customerOrderKeys = [
  "lineCount",
  "number",
  "placedAt",
  "shipCity",
  "shipRegion",
  "status",
  "totalCents",
] as const;
