import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "./api";
import { Empty } from "./Empty";
import { money, when } from "./format";
import type { OrderSummary } from "./types";

export function Orders({ staff = false }: { staff?: boolean }) {
  const [params, setParams] = useSearchParams();
  const status = params.get("status") ?? "";
  const page = Number(params.get("page") ?? "1");
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const pageSize = 20;

  useEffect(() => {
    let stop = false;
    const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (status) query.set("status", status);
    api<{ orders: OrderSummary[]; total: number }>(`/api/orders?${query}`)
      .then((result) => {
        if (stop) return;
        setOrders(result.orders);
        setTotal(result.total);
        setReady(true);
      })
      .catch((err: Error) => {
        if (!stop) setError(err.message);
      });
    return () => {
      stop = true;
    };
  }, [status, page]);

  const pages = Math.max(1, Math.ceil(total / pageSize));
  const prefix = staff ? "fulfillment" : "orders";

  return (
    <>
      <h1 data-testid={`${prefix}-title`}>{staff ? "All orders" : "Your orders"}</h1>
      <p className="lede" data-testid={`${prefix}-count`}>
        {total} orders
      </p>
      <label>
        Status
        <select
          data-testid={`${prefix}-status`}
          value={status}
          onChange={(event) => {
            const next = new URLSearchParams(params);
            if (event.target.value) next.set("status", event.target.value);
            else next.delete("status");
            next.delete("page");
            setParams(next);
          }}
        >
          <option value="">All</option>
          {["paid", "picking", "shipped", "out_for_delivery", "delivered", "cancelled"].map(
            (item) => (
              <option key={item} value={item} data-testid={`${prefix}-status-${item}`}>
                {item.replaceAll("_", " ")}
              </option>
            ),
          )}
        </select>
      </label>
      {error ? (
        <p className="error" data-testid={`${prefix}-error`}>
          {error}
        </p>
      ) : null}
      {ready && total === 0 && !error ? (
        <Empty
          testId={`${prefix}-empty`}
          message={
            status
              ? "No orders with that status."
              : staff
                ? "No orders yet."
                : "You have no orders yet."
          }
        />
      ) : null}
      {total > 0 ? (
        <>
          <table data-testid={`${prefix}-table`}>
            <thead>
              <tr>
                <th>Order</th>
                <th>Status</th>
                {staff ? <th>Customer</th> : null}
                <th>Placed</th>
                <th className="num">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.number} data-testid={`${prefix}-row-${order.number}`}>
                  <td>
                    <Link
                      to={`/orders/${order.number}`}
                      data-testid={`${prefix}-link-${order.number}`}
                    >
                      {order.number}
                    </Link>
                    <div className="hint" data-testid={`${prefix}-meta-${order.number}`}>
                      {order.lineCount} lines ·{" "}
                      {order.fulfillment === "pickup"
                        ? `Pickup at ${order.locationName ?? order.shipCity}`
                        : `${order.shipCity}, ${order.shipRegion}`}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`pill ${order.status}`}
                      data-testid={`${prefix}-status-${order.number}`}
                    >
                      {order.status.replaceAll("_", " ")}
                    </span>
                  </td>
                  {staff ? (
                    <td data-testid={`${prefix}-customer-${order.number}`}>
                      {order.customerEmail}
                    </td>
                  ) : null}
                  <td data-testid={`${prefix}-placed-${order.number}`}>{when(order.placedAt)}</td>
                  <td className="num" data-testid={`${prefix}-total-${order.number}`}>
                    {money(order.totalCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pager" data-testid={`${prefix}-pager`}>
            <button
              className="quiet"
              type="button"
              data-testid={`${prefix}-previous`}
              disabled={page <= 1}
              onClick={() => {
                const next = new URLSearchParams(params);
                next.set("page", String(page - 1));
                setParams(next);
              }}
            >
              Previous
            </button>
            <span data-testid={`${prefix}-page`}>
              Page {page} of {pages}
            </span>
            <button
              className="quiet"
              type="button"
              data-testid={`${prefix}-next`}
              disabled={page >= pages}
              onClick={() => {
                const next = new URLSearchParams(params);
                next.set("page", String(page + 1));
                setParams(next);
              }}
            >
              Next
            </button>
          </div>
        </>
      ) : null}
    </>
  );
}
