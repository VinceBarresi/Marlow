import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

type Application = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  createdAt: string;
  resumeName: string;
  job: {
    slug: string;
    title: string;
    department: string;
    workplace: string;
    city: string | null;
  };
};

export function Applications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ applications: Application[] }>("/api/applications")
      .then((result) => setApplications(result.applications))
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <>
      <h1 data-testid="applications-title">Applications</h1>
      <p className="lede">Resumes submitted for open roles.</p>
      {error ? (
        <p className="error" data-testid="applications-error">
          {error}
        </p>
      ) : null}
      <table data-testid="applications-table">
        <thead>
          <tr>
            <th>Applicant</th>
            <th>Role</th>
            <th>Resume</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((application) => (
            <tr key={application.id} data-testid={`application-${application.id}`}>
              <td>
                <strong>{application.name}</strong>
                <div className="hint">
                  {application.email}
                  <br />
                  {application.city}
                </div>
              </td>
              <td>
                <Link to={`/careers/${application.job.slug}`}>{application.job.title}</Link>
                <div className="hint">
                  {application.job.department}
                  {application.job.city ? ` · ${application.job.city}` : " · Remote"}
                </div>
              </td>
              <td>
                <a
                  href={`/api/applications/${application.id}/resume`}
                  data-testid={`resume-${application.id}`}
                >
                  {application.resumeName}
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {applications.length === 0 && !error ? (
        <p className="hint" data-testid="applications-empty">
          No applications yet.
        </p>
      ) : null}
    </>
  );
}
