export const locationKeys = [
  "city",
  "hours",
  "id",
  "latitude",
  "line1",
  "longitude",
  "name",
  "phone",
  "postalCode",
  "productsInStock",
  "region",
  "slug",
] as const;

export interface CreateLocationRequestModel {
  name: string;
  city: string;
  line1: string;
  region: string;
  postalCode: string;
  phone: string;
  hours: string;
  latitude: number;
  longitude: number;
}

export function uniqueLocationRequest(stamp = Date.now()): CreateLocationRequestModel {
  return {
    name: `API Test Store ${stamp}`,
    city: "Austin",
    line1: "100 Test Street",
    region: "TX",
    postalCode: "78701",
    phone: "512-555-0199",
    hours: "Daily 9am–5pm",
    latitude: 30.2672,
    longitude: -97.7431,
  };
}
