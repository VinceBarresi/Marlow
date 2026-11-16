import { FormEvent, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";

type Job = {
  slug: string;
  title: string;
  department: string;
  workplace: string;
  summary: string;
  location: { slug: string; name: string; city: string } | null;
};

type Store = { slug: string; name: string; city: string };

const departments = ["marketing", "sales", "engineering", "retail"];

export function Careers() {
  const { user } = useAuth();
  const admin = user?.role === "admin";
  const [params, setParams] = useSearchParams();
  const department = params.get("department") ?? "";
  const workplace = params.get("workplace") ?? "";
  const location = params.get("location") ?? "";
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState("");
  const [workplaceDraft, setWorkplaceDraft] = useState("remote");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    api<{ locations: Store[] }>("/api/locations")
      .then((result) => setStores(result.locations))
      .catch(() => setStores([]));
  }, []);

  useEffect(() => {
    const query = new URLSearchParams();
    if (department) query.set("department", department);
    if (workplace) query.set("workplace", workplace);
    if (location) query.set("location", location);
    const suffix = query.toString();
    api<{ jobs: Job[] }>(`/api/jobs${suffix ? `?${suffix}` : ""}`)
      .then((result) => {
        setJobs(result.jobs);
        setError("");
      })
      .catch((err: Error) => setError(err.message));
  }, [department, workplace, location, revision]);

  async function addJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setError("");
    try {
      const result = await api<{ job: { title: string } }>("/api/jobs", {
        method: "POST",
        body: JSON.stringify({
          title: data.get("title"),
          department: data.get("department"),
          workplace: data.get("workplace"),
          locationSlug: data.get("locationSlug") || undefined,
          summary: data.get("summary"),
          description: data.get("description"),
        }),
      });
      form.reset();
      setWorkplaceDraft("remote");
      setNotice(`${result.job.title} is posted.`);
      setRevision((value) => value + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add the role.");
    }
  }

  async function removeJob(job: Job) {
    setError("");
    try {
      await api(`/api/jobs/${job.slug}`, { method: "DELETE" });
      setPending("");
      setNotice(`${job.title} was removed.`);
      setRevision((value) => value + 1);
    } catch (err) {
      setPending("");
      setError(err instanceof Error ? err.message : "Could not remove the role.");
    }
  }

  function filter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next = new URLSearchParams();
    for (const key of ["department", "workplace", "location"]) {
      const value = String(data.get(key) ?? "");
      if (value) next.set(key, value);
    }
    setParams(next);
  }

  return (
    <>
      <h1 data-testid="careers-title">Careers</h1>
      <p className="lede" data-testid="careers-lede">
        Marketing, sales, and engineering roles are remote. Floor jobs are posted at each store.
      </p>
      <form
        className="filters"
        key={`${department}|${workplace}|${location}|${stores.length}`}
        onSubmit={filter}
        data-testid="careers-filters"
      >
        <label>
          Department
          <select name="department" defaultValue={department} data-testid="careers-department">
            <option value="">All</option>
            {departments.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label>
          Workplace
          <select name="workplace" defaultValue={workplace} data-testid="careers-workplace">
            <option value="">All</option>
            <option value="remote">Remote</option>
            <option value="store">In store</option>
          </select>
        </label>
        <label>
          Store
          <select name="location" defaultValue={location} data-testid="careers-location">
            <option value="">All stores</option>
            {stores.map((store) => (
              <option key={store.slug} value={store.slug}>
                {store.name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" data-testid="careers-filter-submit">
          Filter
        </button>
      </form>
      {notice ? (
        <p className="hint" data-testid="careers-notice">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className="error" data-testid="careers-error">
          {error}
        </p>
      ) : null}
      {admin ? (
        <form
          className="stack apply panel"
          onSubmit={(event) => void addJob(event)}
          data-testid="job-form"
        >
          <strong>Add a role</strong>
          <label>
            Title
            <input name="title" required data-testid="job-form-title" />
          </label>
          <label>
            Department
            <select name="department" defaultValue="retail" data-testid="job-form-department">
              {departments.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label>
            Workplace
            <select
              name="workplace"
              value={workplaceDraft}
              data-testid="job-form-workplace"
              onChange={(event) => setWorkplaceDraft(event.target.value)}
            >
              <option value="remote">Remote</option>
              <option value="store">In store</option>
            </select>
          </label>
          {workplaceDraft === "store" ? (
            <label>
              Store
              <select name="locationSlug" required data-testid="job-form-store">
                <option value="">Choose a store</option>
                {stores.map((store) => (
                  <option key={store.slug} value={store.slug}>
                    {store.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label>
            Summary
            <input name="summary" required minLength={10} data-testid="job-form-summary" />
          </label>
          <label>
            Description
            <textarea
              name="description"
              required
              minLength={20}
              data-testid="job-form-description"
            />
          </label>
          <button type="submit" data-testid="job-form-submit">
            Add role
          </button>
        </form>
      ) : null}
      <div className="grid" data-testid="careers-grid">
        {jobs.map((job) => (
          <article className="card" key={job.slug} data-testid={`job-card-${job.slug}`}>
            <Link className="card-link" to={`/careers/${job.slug}`}>
              <span className="category">{job.department}</span>
              <strong>{job.title}</strong>
              <span className="hint">
                {job.workplace === "remote" ? "Remote" : (job.location?.name ?? "In store")}
              </span>
              <span>{job.summary}</span>
            </Link>
            {admin ? (
              <div className="card-actions">
                {pending === job.slug ? (
                  <>
                    <button
                      className="danger"
                      type="button"
                      data-testid={`job-confirm-${job.slug}`}
                      onClick={() => void removeJob(job)}
                    >
                      Confirm remove
                    </button>
                    <button className="quiet" type="button" onClick={() => setPending("")}>
                      Keep
                    </button>
                  </>
                ) : (
                  <button
                    className="quiet"
                    type="button"
                    data-testid={`job-remove-${job.slug}`}
                    onClick={() => setPending(job.slug)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ) : null}
          </article>
        ))}
      </div>
      {jobs.length === 0 && !error ? (
        <p className="hint" data-testid="careers-empty">
          No openings match those filters.
        </p>
      ) : null}
    </>
  );
}
