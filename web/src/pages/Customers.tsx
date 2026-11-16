import { FormEvent, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { money } from "../format";

type Customer = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  orders: number;
  spentCents: number;
};

export function Customers() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const page = Number(params.get("page") ?? "1");
  const [draft, setDraft] = useState(q);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const pageSize = 25;

  useEffect(() => setDraft(q), [q]);

  useEffect(() => {
    let stop = false;
    const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (q) query.set("q", q);
    api<{ customers: Customer[]; total: number }>(`/api/customers?${query}`)
      .then((result) => {
        if (stop) return;
        setCustomers(result.customers);
        setTotal(result.total);
      })
      .catch((err: Error) => {
        if (!stop) setError(err.message);
      });
    return () => {
      stop = true;
    };
  }, [q, page]);

  function search(event: FormEvent) {
    event.preventDefault();
    const next = new URLSearchParams(params);
    if (draft) next.set("q", draft);
    else next.delete("q");
    next.delete("page");
    setParams(next);
  }

  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <h1 data-testid="customers-title">Customers</h1>
      <p className="lede" data-testid="customers-count">
        {total} customers
      </p>
      <form className="filters" onSubmit={search} data-testid="customers-search-form">
        <label>
          Search
          <input
            data-testid="customers-search"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
        </label>
        <button type="submit" data-testid="customers-search-submit">
          Search
        </button>
      </form>
      {error ? (
        <p className="error" data-testid="customers-error">
          {error}
        </p>
      ) : null}
      <table data-testid="customers-table">
        <thead>
          <tr>
            <th>Customer</th>
            <th className="num">Orders</th>
            <th className="num">Spent</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id} data-testid={`customers-row-${customer.id}`}>
              <td>
                <Link
                  to={`/staff/customers/${customer.id}`}
                  data-testid={`customers-link-${customer.id}`}
                >
                  {customer.name}
                </Link>
                <div className="hint" data-testid={`customers-email-${customer.id}`}>
                  {customer.email}
                </div>
              </td>
              <td className="num" data-testid={`customers-orders-${customer.id}`}>
                {customer.orders}
              </td>
              <td className="num" data-testid={`customers-spent-${customer.id}`}>
                {money(customer.spentCents)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pager" data-testid="customers-pager">
        <button
          className="quiet"
          type="button"
          data-testid="customers-previous"
          disabled={page <= 1}
          onClick={() => {
            const next = new URLSearchParams(params);
            next.set("page", String(page - 1));
            setParams(next);
          }}
        >
          Previous
        </button>
        <span data-testid="customers-page">
          Page {page} of {pages}
        </span>
        <button
          className="quiet"
          type="button"
          data-testid="customers-next"
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
  );
}
