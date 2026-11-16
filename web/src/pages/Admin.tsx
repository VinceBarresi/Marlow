import { Link } from "react-router-dom";
import { useAuth } from "../auth";

export function Admin() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <>
      <h1 data-testid="admin-title">Admin</h1>
      <p className="lede" data-testid="admin-lede">
        {user.name} can change rows in the database console. Staff can only read.
      </p>
      <section className="panel stack" style={{ maxWidth: 520 }} data-testid="admin-card">
        <div data-testid="admin-name">{user.email}</div>
        <p className="hint" data-testid="admin-access">
          Insert, update, and delete are allowed for admins. Schema changes are still refused.
        </p>
        <a className="button" href="http://127.0.0.1:4003" data-testid="admin-console">
          Open the database console
        </a>
        <p className="hint">
          <Link to="/locations" data-testid="admin-locations">
            Add or remove stores
          </Link>
          {" · "}
          <Link to="/careers" data-testid="admin-jobs">
            Add or remove roles
          </Link>
        </p>
      </section>
    </>
  );
}
