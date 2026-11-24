export type Product = {
  sku: string;
  name: string;
  category: string;
  description: string;
  priceCents: number;
  onHand: number;
  reserved: number;
  available: number;
  imageId?: string | null;
  imageUrl?: string | null;
};
