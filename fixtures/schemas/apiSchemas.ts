import { z } from "zod";

export const roleSchema = z.enum(["customer", "staff", "admin"]);

export const userSchema = z.object({
  id: z.string().min(1),
  email: z.string().min(1),
  name: z.string().min(1),
  role: roleSchema,
});

export const userResponseSchema = z.object({
  user: userSchema,
});

export const errorSchema = z.object({
  error: z.string().min(1),
});

export const healthSchema = z.object({
  ok: z.boolean(),
  postgres: z.boolean(),
  redis: z.boolean(),
});

export const okSchema = z.object({
  ok: z.literal(true),
});

export const productSchema = z.object({
  sku: z.string().min(1),
  name: z.string(),
  category: z.string(),
  description: z.string(),
  priceCents: z.number().int(),
  onHand: z.number().int(),
  reserved: z.number().int(),
  available: z.number().int(),
});

export const productListSchema = z.object({
  products: z.array(productSchema),
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
});

export const productResponseSchema = z.object({
  product: productSchema,
});

export const categorySchema = z.object({
  category: z.string(),
  products: z.number().int(),
});

export const categoryListSchema = z.object({
  categories: z.array(categorySchema),
});

export const inventoryRowSchema = z.object({
  sku: z.string().min(1),
  name: z.string(),
  category: z.string(),
  priceCents: z.number().int(),
  onHand: z.number().int(),
  reserved: z.number().int(),
  available: z.number().int(),
  reorderPoint: z.number().int(),
  bin: z.string(),
  updatedAt: z.string().min(1),
});

export const inventoryListSchema = z.object({
  inventory: z.array(inventoryRowSchema),
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
});

export const cartItemSchema = z.object({
  sku: z.string().min(1),
  name: z.string(),
  priceCents: z.number().int(),
  quantity: z.number().int(),
  available: z.number().int(),
  lineTotalCents: z.number().int(),
});

export const cartSchema = z.object({
  items: z.array(cartItemSchema),
  subtotalCents: z.number().int(),
});

export const cartItemResultSchema = z.object({
  ok: z.boolean(),
  sku: z.string().min(1),
  quantity: z.number().int(),
});

export const orderStatusSchema = z.enum([
  "paid",
  "picking",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
]);

export const checkoutOrderSchema = z.object({
  number: z.string().min(1),
  status: orderStatusSchema,
  subtotalCents: z.number().int(),
  shippingCents: z.number().int(),
  taxCents: z.number().int(),
  totalCents: z.number().int(),
});

export const checkoutResponseSchema = z.object({
  order: checkoutOrderSchema,
});

export const orderSummarySchema = z.object({
  number: z.string().min(1),
  status: orderStatusSchema,
  placedAt: z.string().min(1),
  totalCents: z.number().int(),
  shipCity: z.string(),
  shipRegion: z.string(),
  customerEmail: z.string(),
  lineCount: z.number().int(),
});

export const orderListSchema = z.object({
  orders: z.array(orderSummarySchema),
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
});

export const orderLineSchema = z.object({
  sku: z.string().min(1),
  name: z.string(),
  quantity: z.number().int(),
  unitPriceCents: z.number().int(),
  lineTotalCents: z.number().int(),
});

export const shipToSchema = z.object({
  name: z.string(),
  line1: z.string(),
  city: z.string(),
  region: z.string(),
  postalCode: z.string(),
  country: z.string(),
});

export const orderEventSchema = z.object({
  status: z.string(),
  note: z.string(),
  createdAt: z.string().min(1),
  actorEmail: z.string().nullable().optional(),
});

export const trackingScanSchema = z.object({
  status: z.string(),
  location: z.string(),
  message: z.string(),
  happenedAt: z.string().min(1),
});

export const shipmentSchema = z.object({
  carrier: z.enum(["UPS", "FedEx", "USPS", "DHL"]),
  service: z.enum(["Ground", "Express"]),
  trackingNumber: z.string(),
  status: z.string(),
  shippedAt: z.string().optional(),
  estimatedDelivery: z.string().nullable().optional(),
  deliveredAt: z.string().nullable().optional(),
  scans: z.array(trackingScanSchema),
});

export const orderDetailSchema = z.object({
  number: z.string().min(1),
  status: orderStatusSchema,
  placedAt: z.string().min(1),
  subtotalCents: z.number().int(),
  shippingCents: z.number().int(),
  taxCents: z.number().int(),
  totalCents: z.number().int(),
  shipTo: shipToSchema,
  lines: z.array(orderLineSchema),
  events: z.array(orderEventSchema),
  shipment: shipmentSchema.nullable().optional(),
});

export const orderResponseSchema = z.object({
  order: orderDetailSchema,
});

export const customerSchema = z.object({
  id: z.string().min(1),
  email: z.string().min(1),
  name: z.string(),
  createdAt: z.string().min(1),
  orders: z.number().int(),
  spentCents: z.number().int(),
});

export const customerListSchema = z.object({
  customers: z.array(customerSchema),
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
});

export const locationSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string(),
  city: z.string(),
  line1: z.string(),
  region: z.string(),
  postalCode: z.string(),
  phone: z.string(),
  hours: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  productsInStock: z.number().int(),
});

export const locationListSchema = z.object({
  locations: z.array(locationSchema),
});

export const jobLocationSchema = z
  .object({
    slug: z.string(),
    name: z.string(),
    city: z.string(),
    line1: z.string().optional(),
    region: z.string().optional(),
    postalCode: z.string().optional(),
  })
  .nullable();

export const jobSchema = z.object({
  slug: z.string().min(1),
  title: z.string(),
  department: z.enum(["marketing", "sales", "engineering", "retail"]),
  workplace: z.enum(["remote", "store"]),
  summary: z.string(),
  description: z.string().optional(),
  location: jobLocationSchema.optional(),
});

export const jobListSchema = z.object({
  jobs: z.array(jobSchema),
});
