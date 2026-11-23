export const locationsEndpoints = {
  locations: "/api/locations",
  location: (slug: string) => `/api/locations/${encodeURIComponent(slug)}`,
};

export const seedLocationSlug = "austin-domain";
