export const jobListItemKeys = [
  "department",
  "location",
  "slug",
  "summary",
  "title",
  "workplace",
] as const;

export const jobDetailKeys = [
  "department",
  "description",
  "location",
  "slug",
  "summary",
  "title",
  "workplace",
] as const;

export interface CreateJobRequestModel {
  title: string;
  department: string;
  workplace: string;
  summary: string;
  description: string;
  locationSlug?: string;
}

export function uniqueRemoteJobRequest(stamp = Date.now()): CreateJobRequestModel {
  return {
    title: `API Test Role ${stamp}`,
    department: "engineering",
    workplace: "remote",
    summary: "Short summary for an API test role.",
    description: "Longer description used by API tests for a remote role.",
  };
}

/** Minimal PDF contents accepted by the careers upload (PDF/Word only; not text/plain). */
export const minimalResumePdfContents = "%PDF-1.1\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n";

export const applicationFieldValues = {
  name: "Alex Applicant",
  email: "alex.applicant@example.com",
  phone: "512-555-0188",
  city: "Austin",
  workAuthorization: "yes",
  startDate: "2026-06-01",
  coverLetter: "I would love to join the engineering team at Marlow.",
} as const;
