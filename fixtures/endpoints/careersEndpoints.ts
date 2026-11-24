export const careersEndpoints = {
  jobs: "/api/jobs",
  job: (slug: string) => `/api/jobs/${encodeURIComponent(slug)}`,
  applications: (slug: string) => `/api/jobs/${encodeURIComponent(slug)}/applications`,
  applicationsList: "/api/applications",
  resume: (id: string) => `/api/applications/${encodeURIComponent(id)}/resume`,
};

export const seedJobSlug = "software-engineer";
