import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "./api";
import { money, when } from "./format";
import type { OrderDetail } from "./types";

function useRole() {
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => {
    api<{ user: { role: string } }>("/api/me")
      .then((result) => setRole(result.user.role))
      .catch(() => setRole(null));
  }, []);
  return role;
}

export function OrderPage() {
  const { number = "" } = useParams();
  const user = { role: useRole() };
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState("");
  const [carrier, setCarrier] = useState("UPS");
  const [service, setService] = useState("Ground");
  const [trackingNumber, setTrackingNumber] = useState("");

  function load() {
    api<{ order: OrderDetail }>(`/api/orders/${number}`)
      .then((result) => {
        setOrder(result.order);
        setTrackingNumber(result.order.shipment?.trackingNumber ?? "");
      })
      .catch((err: Error) => setError(err.message));
  }

  useEffect(load, [number]);

  async function act(path: string, body?: unknown) {
    setError("");
    try {
      await api(path, { method: "POST", body: body ? JSON.stringify(body) : undefined });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the order.");
    }
  }

  if (error && !order)
    return (
      <p className="error" data-testid="order-error">
        {error}
      </p>
    );
  if (!order) return <p data-testid="order-loading">Loading order…</p>;
  const open = order.status === "paid" || order.status === "picking";

  return (
    <>
      <p className="sku" data-testid="order-placed">
        {when(order.placedAt)}
      </p>
      <h1 data-testid="order-number">{order.number}</h1>
      <p>
        <span className={`pill ${order.status}`} data-testid="order-status">
          {order.status.replaceAll("_", " ")}
        </span>
      </p>
      {error ? (
        <p className="error" data-testid="order-error">
          {error}
        </p>
      ) : null}
      <div className="split">
        <div>
          <table data-testid="order-lines">
            <thead>
              <tr>
                <th>Item</th>
                <th className="num">Qty</th>
                <th className="num">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.lines.map((line) => (
                <tr key={line.sku} data-testid={`order-line-${line.sku}`}>
                  <td>
                    <span data-testid={`order-line-name-${line.sku}`}>{line.name}</span>
                    <div className="hint">{line.sku}</div>
                  </td>
                  <td className="num" data-testid={`order-line-qty-${line.sku}`}>
                    {line.quantity}
                  </td>
                  <td className="num" data-testid={`order-line-total-${line.sku}`}>
                    {money(line.lineTotalCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p data-testid="order-breakdown">
            Subtotal {money(order.subtotalCents)} · Shipping {money(order.shippingCents)} · Tax{" "}
            {money(order.taxCents)}
          </p>
          <p>
            <strong data-testid="order-total">Total {money(order.totalCents)}</strong>
          </p>
        </div>
        <div className="stack">
          <section className="panel" data-testid="order-ship-to">
            <strong>Ship to</strong>
            <div data-testid="order-ship-name">{order.shipTo.name}</div>
            <div data-testid="order-ship-line">{order.shipTo.line1}</div>
            <div data-testid="order-ship-city">
              {order.shipTo.city}, {order.shipTo.region} {order.shipTo.postalCode}
            </div>
          </section>
          {order.shipment ? (
            <section className="panel" data-testid="order-tracking">
              <strong>Tracking</strong>
              <div className="tracking-number" data-testid="order-tracking-number">
                {order.shipment.trackingNumber}
              </div>
              <div data-testid="order-tracking-carrier">
                {order.shipment.carrier} {order.shipment.service}
              </div>
              <div className="hint" data-testid="order-tracking-status">
                {order.shipment.status.replaceAll("_", " ")}
                {order.shipment.estimatedDelivery
                  ? ` · estimated ${when(order.shipment.estimatedDelivery)}`
                  : ""}
              </div>
              <div className="scans">
                {order.shipment.scans.map((scan, index) => (
                  <div
                    key={`${scan.happenedAt}-${scan.message}`}
                    data-testid={`order-scan-${index}`}
                  >
                    <strong>{scan.message}</strong>
                    <div className="hint">
                      {scan.location} · {when(scan.happenedAt)}
                    </div>
                  </div>
                ))}
              </div>
              {user?.role === "staff" ? (
                <form
                  className="actions"
                  data-testid="order-tracking-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void act(`/api/orders/${order.number}/tracking`, { trackingNumber });
                  }}
                >
                  <label>
                    Tracking number
                    <input
                      data-testid="order-tracking-input"
                      value={trackingNumber}
                      onChange={(event) => setTrackingNumber(event.target.value)}
                    />
                  </label>
                  <button type="submit" data-testid="order-tracking-submit">
                    Update tracking
                  </button>
                </form>
              ) : null}
            </section>
          ) : (
            <section className="panel" data-testid="order-tracking-empty">
              <strong>Tracking</strong>
              <div className="hint">Tracking starts when the order ships.</div>
            </section>
          )}
          <section className="panel" data-testid="order-history">
            <strong>History</strong>
            {order.events.map((event, index) => (
              <div key={`${event.status}-${event.createdAt}`} data-testid={`order-event-${index}`}>
                {event.note}
                <div className="hint">{when(event.createdAt)}</div>
              </div>
            ))}
          </section>
          <div className="actions" data-testid="order-actions">
            {open ? (
              <button
                className="danger"
                type="button"
                data-testid="order-cancel"
                onClick={() => act(`/api/orders/${order.number}/cancel`)}
              >
                Cancel order
              </button>
            ) : null}
            {user?.role === "staff" && order.status === "paid" ? (
              <button
                type="button"
                data-testid="order-pick"
                onClick={() => act(`/api/orders/${order.number}/pick`)}
              >
                Start picking
              </button>
            ) : null}
            {user?.role === "staff" && order.status === "shipped" ? (
              <button
                type="button"
                data-testid="order-out-for-delivery"
                onClick={() => act(`/api/orders/${order.number}/out-for-delivery`)}
              >
                Out for delivery
              </button>
            ) : null}
            {user?.role === "staff" && order.status === "out_for_delivery" ? (
              <button
                type="button"
                data-testid="order-deliver"
                onClick={() => act(`/api/orders/${order.number}/deliver`)}
              >
                Mark delivered
              </button>
            ) : null}
          </div>
          {user?.role === "staff" && order.status === "picking" ? (
            <form
              className="actions"
              data-testid="order-ship-form"
              onSubmit={(event) => {
                event.preventDefault();
                void act(`/api/orders/${order.number}/ship`, { carrier, service });
              }}
            >
              <label>
                Carrier
                <select
                  data-testid="order-carrier"
                  value={carrier}
                  onChange={(event) => setCarrier(event.target.value)}
                >
                  {["UPS", "FedEx", "USPS", "DHL"].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label>
                Service
                <select
                  data-testid="order-service"
                  value={service}
                  onChange={(event) => setService(event.target.value)}
                >
                  <option>Ground</option>
                  <option>Express</option>
                </select>
              </label>
              <button type="submit" data-testid="order-ship">
                Ship
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </>
  );
}
