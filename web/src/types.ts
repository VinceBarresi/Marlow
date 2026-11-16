export type User = {
  id: string;
  email: string;
  name: string;
  role: "customer" | "staff" | "admin";
};

export type Product = {
  sku: string;
  name: string;
  category: string;
  description: string;
  priceCents: number;
  onHand: number;
  reserved: number;
  available: number;
};

export type CartItem = {
  sku: string;
  name: string;
  priceCents: number;
  quantity: number;
  available: number;
  lineTotalCents: number;
};

export type OrderSummary = {
  number: string;
  status: string;
  fulfillment: "ship" | "pickup";
  locationName: string | null;
  placedAt: string;
  totalCents: number;
  shipCity: string;
  shipRegion: string;
  customerEmail: string;
  lineCount: number;
};

export type OrderDetail = {
  number: string;
  status: string;
  placedAt: string;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  shipTo: {
    name: string;
    line1: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
  };
  lines: {
    sku: string;
    name: string;
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
  }[];
  events: { status: string; note: string; createdAt: string; actorEmail: string | null }[];
  shipment: {
    carrier: string;
    service: string;
    trackingNumber: string;
    status: string;
    shippedAt: string;
    estimatedDelivery: string | null;
    deliveredAt: string | null;
    scans: { status: string; location: string; message: string; happenedAt: string }[];
  } | null;
};

export type InventoryRow = {
  sku: string;
  name: string;
  category: string;
  priceCents: number;
  onHand: number;
  reserved: number;
  available: number;
  reorderPoint: number;
  bin: string;
};
