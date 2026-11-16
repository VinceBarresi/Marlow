import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { Empty } from "../Empty";
import { money, when } from "../format";

type CustomerOrder = {
  number: string;
  status: string;
  placedAt: string;
  totalCents: number;
  shipCity: string;
  shipRegion: string;
  lineCount: number;
};

type CustomerDetail = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};

export function Customer() {
  const { id = "" } = useParams();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let stop = false;
    api<{ customer: CustomerDetail; orders: CustomerOrder[] }>(`/api/customers/${id}`)
      .then((result) => {
        if (stop) return;
        setCustomer(result.customer);
        setOrders(result.orders);
      })
      .catch((err: Error) => {
        if (!stop) setError(err.message);
      });
    return () => {
      stop = true;
    };
  }, [id]);

  if (error && !customer)
    return (
      <p className="error" data-testid="customer-error">
        {error}
      </p>
    );
  if (!customer) return <p data-testid="customer-loading">Loading customer…</p>;

  return (
    <>
      <p className="sku">
        <Link to="/staff/customers" data-testid="customer-back">
          Customers
        </Link>
      </p>
      <h1 data-testid="customer-name">{customer.name}</h1>
      <p className="lede" data-testid="customer-email">
        {customer.email}
      </p>
      {orders.length > 0 ? (
        <table data-testid="customer-orders">
          <thead>
            <tr>
              <th>Order</th>
              <th>Status</th>
              <th>Placed</th>
              <th className="num">Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.number} data-testid={`customer-order-${order.number}`}>
                <td>
                  <Link
                    to={`/orders/${order.number}`}
                    data-testid={`customer-order-link-${order.number}`}
                  >
                    {order.number}
                  </Link>
                  <div className="hint">
                    {order.lineCount} lines · {order.shipCity}, {order.shipRegion}
                  </div>
                </td>
                <td>
                  <span className={`pill ${order.status}`}>
                    {order.status.replaceAll("_", " ")}
                  </span>
                </td>
                <td>{when(order.placedAt)}</td>
                <td className="num">{money(order.totalCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <Empty testId="customer-orders-empty" message="No orders yet." />
      )}
    </>
  );
}
