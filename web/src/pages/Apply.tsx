import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

type Job = {
  slug: string;
  title: string;
  department: string;
  workplace: string;
  summary: string;
  description: string;
  location: {
    slug: string;
    name: string;
    city: string;
    line1: string;
    region: string;
    postalCode: string;
  } | null;
};

export function Apply() {
  const { slug = "" } = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let stop = false;
    fetch(`/api/jobs/${slug}`, { credentials: "include" })
      .then(async (response) => {
        const data = (await response.json()) as { job?: Job; error?: string };
        if (!response.ok) throw new Error(data.error ?? "Job not found.");
        if (!stop && data.job) setJob(data.job);
      })
      .catch((err: Error) => {
        if (!stop) setError(err.message);
      });
    return () => {
      stop = true;
    };
  }, [slug]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const response = await fetch(`/api/jobs/${slug}/applications`, {
      method: "POST",
      credentials: "include",
      body: new FormData(event.currentTarget),
    });
    const data = (await response.json()) as { application?: { id: string }; error?: string };
    setPending(false);
    if (!response.ok || !data.application) {
      setError(data.error ?? "Could not send the application.");
      return;
    }
    setApplicationId(data.application.id);
  }

  if (error && !job)
    return (
      <p className="error" data-testid="apply-error">
        {error}
      </p>
    );
  if (!job) return <p data-testid="apply-loading">Loading role…</p>;
  if (applicationId) {
    return (
      <>
        <h1 data-testid="apply-sent">Application received</h1>
        <p className="lede" data-testid="apply-confirmation">
          Thanks. Your application for {job.title} is in. Reference {applicationId}.
        </p>
        <Link to="/careers" data-testid="apply-back">
          Back to careers
        </Link>
      </>
    );
  }

  return (
    <>
      <p className="sku">
        <Link to="/careers" data-testid="apply-back">
          Careers
        </Link>
      </p>
      <h1 data-testid="apply-title">{job.title}</h1>
      <p className="lede" data-testid="apply-where">
        {job.department} · {job.workplace === "remote" ? "Remote" : job.location?.name}
      </p>
      <p data-testid="apply-description">{job.description}</p>
      <form
        className="stack apply"
        onSubmit={(event) => void submit(event)}
        data-testid="apply-form"
      >
        <label>
          Name
          <input name="name" required data-testid="apply-name" />
        </label>
        <label>
          Email
          <input name="email" type="email" required data-testid="apply-email" />
        </label>
        <label>
          Phone
          <input name="phone" type="tel" required data-testid="apply-phone" />
        </label>
        <label>
          City
          <input name="city" required data-testid="apply-city" />
        </label>
        <label>
          Authorized to work in the United States
          <select
            name="workAuthorization"
            required
            defaultValue=""
            data-testid="apply-authorization"
          >
            <option value="" disabled>
              Choose
            </option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </label>
        <label>
          Earliest start date
          <input name="startDate" type="date" required data-testid="apply-start" />
        </label>
        <label>
          LinkedIn
          <input name="linkedin" data-testid="apply-linkedin" />
        </label>
        <label>
          Website
          <input name="website" data-testid="apply-website" />
        </label>
        <label>
          Why this role
          <textarea name="coverLetter" required minLength={20} data-testid="apply-letter" />
        </label>
        <label>
          Resume (PDF or Word, 5 MB)
          <input
            name="resume"
            type="file"
            required
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            data-testid="apply-resume"
          />
        </label>
        {error ? (
          <p className="error" data-testid="apply-error">
            {error}
          </p>
        ) : null}
        <button type="submit" disabled={pending} data-testid="apply-submit">
          {pending ? "Sending…" : "Submit application"}
        </button>
      </form>
    </>
  );
}
