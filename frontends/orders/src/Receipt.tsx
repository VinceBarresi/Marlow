import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "./api";
import { money } from "./format";
import type { OrderDetail } from "./types";

export function Receipt() {
  const { number = "" } = useParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let stop = false;
    api<{ order: OrderDetail }>(`/api/orders/${number}`)
      .then((result) => {
        if (!stop) setOrder(result.order);
      })
      .catch((err: Error) => {
        if (!stop) setError(err.message);
      });
    return () => {
      stop = true;
    };
  }, [number]);

  if (error && !order)
    return (
      <p className="error" data-testid="receipt-error">
        {error}
      </p>
    );
  if (!order) return <p data-testid="receipt-loading">Loading receipt…</p>;

  return (
    <>
      <h1 data-testid="receipt-title">
        {order.fulfillment === "pickup" ? "Pickup receipt" : "Receipt"}
      </h1>
      <p className="lede" data-testid="receipt-number">
        Order {order.number} is {order.status.replaceAll("_", " ")}
        {order.fulfillment === "pickup" && order.location
          ? ` for pickup at ${order.location.name}`
          : ""}
        .
      </p>
      <section className="panel stack" style={{ maxWidth: 560 }} data-testid="receipt-card">
        <div data-testid="receipt-total">
          <strong>Total {money(order.totalCents)}</strong>
        </div>
        <div data-testid="receipt-ship">
          {order.shipTo.name}
          <div className="hint">
            {order.shipTo.line1}, {order.shipTo.city}, {order.shipTo.region}{" "}
            {order.shipTo.postalCode}
          </div>
        </div>
        <ul data-testid="receipt-lines">
          {order.lines.map((line) => (
            <li key={line.sku} data-testid={`receipt-line-${line.sku}`}>
              {line.quantity} × {line.name}
              <span className="hint"> {money(line.lineTotalCents)}</span>
            </li>
          ))}
        </ul>
        <Link className="button" to={`/orders/${order.number}`} data-testid="receipt-order">
          View order
        </Link>
      </section>
    </>
  );
}
