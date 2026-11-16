import { FormEvent, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import type { User } from "../types";

export function Login() {
  const { user, setUser } = useAuth();
  const [email, setEmail] = useState("customer@marlow.test");
  const [password, setPassword] = useState("datalab");
  const [error, setError] = useState("");

  if (user) return <Navigate to="/" replace />;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const result = await api<{ user: User }>("/api/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setUser(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    }
  }

  return (
    <main className="login" data-testid="login-page">
      <h1 data-testid="login-title">Marlow</h1>
      <p className="lede" data-testid="login-lede">Sign in to shop, or to pick and ship orders.</p>
      <form onSubmit={onSubmit} data-testid="login-form">
        <label>
          Email
          <input
            data-testid="login-email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
          />
        </label>
        <label>
          Password
          <input
            data-testid="login-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
        </label>
        {error ? <p className="error" data-testid="login-error">{error}</p> : null}
        <button type="submit" data-testid="login-submit">Sign in</button>
      </form>
      <p className="hint" data-testid="login-hint">
        Customer: customer@marlow.test / datalab
        <br />
        Staff: staff@marlow.test / datalab
      </p>
    </main>
  );
}
