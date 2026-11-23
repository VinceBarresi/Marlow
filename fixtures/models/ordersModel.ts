export interface EmptyCartResponseModel {
  items: unknown[];
  subtotalCents: number;
}

export interface EmptyOrdersResponseModel {
  orders: unknown[];
  page: number;
  pageSize: number;
  total: number;
}

export const emptyCartResponseModel = {
  items: [],
  subtotalCents: 0,
} satisfies EmptyCartResponseModel;

export const emptyOrdersListResponseModel = {
  orders: [],
  page: 1,
  pageSize: 20,
  total: 0,
} satisfies EmptyOrdersResponseModel;

export interface CartItemRequestModel {
  sku: string;
  quantity: number;
}

export interface CheckoutShipRequestModel {
  fulfillment: "ship";
  shipName: string;
  shipLine1: string;
  shipCity: string;
  shipRegion: string;
  shipPostalCode: string;
}

export interface CheckoutPickupRequestModel {
  fulfillment: "pickup";
  locationId: string;
  shipName: string;
}

export const shipCheckoutRequestModel = {
  fulfillment: "ship",
  shipName: "Mina Adler",
  shipLine1: "100 Congress Ave",
  shipCity: "Austin",
  shipRegion: "TX",
  shipPostalCode: "78701",
} satisfies CheckoutShipRequestModel;

export const cartItemKeys = [
  "available",
  "lineTotalCents",
  "name",
  "priceCents",
  "quantity",
  "sku",
] as const;

export const checkoutOrderKeys = [
  "number",
  "shippingCents",
  "status",
  "subtotalCents",
  "taxCents",
  "totalCents",
] as const;

export const shipRequestModel = {
  carrier: "UPS",
  service: "Ground",
} as const;
