import { useEffect, useState } from "react";
import { NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";
import { api, type ResponseMeta } from "./api";
import { useAuth } from "./auth";
import type { CartItem } from "./types";

export function Shell() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [count, setCount] = useState(0);
  const [meta, setMeta] = useState<ResponseMeta | null>(null);

  useEffect(() => {
    function onResponse(event: Event) {
      setMeta((event as CustomEvent<ResponseMeta>).detail);
    }
    window.addEventListener("marlow-response", onResponse);
    return () => window.removeEventListener("marlow-response", onResponse);
  }, []);

  useEffect(() => {
    api<{ items: CartItem[] }>("/api/cart")
      .then((result) => setCount(result.items.reduce((sum, item) => sum + item.quantity, 0)))
      .catch(() => setCount(0));
  }, [meta?.path]);

  async function logout() {
    await api("/api/logout", { method: "POST" });
    setUser(null);
    navigate("/login");
  }

  return (
    <div className="shell" data-testid="app-shell">
      <header className="bar" data-testid="app-header">
        <NavLink className="wordmark" to="/" data-testid="nav-home">
          Marlow
        </NavLink>
        <nav className="nav" data-testid="app-nav">
          <NavLink to="/" end data-testid="nav-shop">
            Shop
          </NavLink>
          <NavLink to="/orders" data-testid="nav-orders">
            Orders
          </NavLink>
          <NavLink to="/cart" data-testid="nav-cart">
            Cart ({count})
          </NavLink>
          {user?.role === "staff" ? (
            <>
              <NavLink to="/staff/orders" data-testid="nav-fulfillment">
                Fulfillment
              </NavLink>
              <NavLink to="/staff/inventory" data-testid="nav-inventory">
                Inventory
              </NavLink>
            </>
          ) : null}
        </nav>
        <span className="spacer" data-testid="nav-user">{user?.email}</span>
        <button className="quiet" type="button" data-testid="nav-logout" onClick={() => void logout()}>
          Log out
        </button>
      </header>
      <main className="page" data-testid="page">
        <Outlet />
      </main>
      <footer className="foot" data-testid="response-meta">
        {meta
          ? `${meta.status} ${meta.path} · ${meta.ms} ms · ${meta.cache ?? "no cache"} · ${meta.bytes} bytes`
          : "No request yet"}
      </footer>
    </div>
  );
}

export function RequireAuth() {
  const { user, ready } = useAuth();
  if (!ready) return <p className="page" data-testid="session-checking">Checking session…</p>;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function RequireStaff() {
  const { user } = useAuth();
  if (user?.role !== "staff") return <Navigate to="/" replace />;
  return <Outlet />;
}
