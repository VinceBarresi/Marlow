import { useAuth } from "../auth";

export function Account() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <>
      <h1 data-testid="account-title">Account</h1>
      <p className="lede" data-testid="account-lede">
        This is the person signed in to Marlow.
      </p>
      <section className="panel stack" style={{ maxWidth: 480 }} data-testid="account-card">
        <div>
          <div className="hint">Name</div>
          <div data-testid="account-name">{user.name}</div>
        </div>
        <div>
          <div className="hint">Email</div>
          <div data-testid="account-email">{user.email}</div>
        </div>
        <div>
          <div className="hint">Role</div>
          <div data-testid="account-role">{user.role}</div>
        </div>
      </section>
    </>
  );
}
