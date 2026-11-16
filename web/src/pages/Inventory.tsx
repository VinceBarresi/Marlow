import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api";
import type { InventoryRow } from "../types";

export function Inventory() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const lowStock = params.get("lowStock") === "true";
  const page = Number(params.get("page") ?? "1");
  const [draft, setDraft] = useState(q);
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const pageSize = 25;

  useEffect(() => setDraft(q), [q]);

  useEffect(() => {
    let stop = false;
    const query = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      lowStock: String(lowStock),
    });
    if (q) query.set("q", q);
    api<{ inventory: InventoryRow[]; total: number }>(`/api/inventory?${query}`)
      .then((result) => {
        if (stop) return;
        setRows(result.inventory);
        setTotal(result.total);
      })
      .catch((err: Error) => {
        if (!stop) setError(err.message);
      });
    return () => {
      stop = true;
    };
  }, [q, lowStock, page]);

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
      <h1 data-testid="inventory-title">Inventory</h1>
      <p className="lede" data-testid="inventory-count">
        {total} bins{lowStock ? " at or below the reorder point" : ""}.
      </p>
      <form className="filters" onSubmit={search} data-testid="inventory-search-form">
        <label>
          Search
          <input
            data-testid="inventory-search"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
        </label>
        <label>
          <span>Low stock</span>
          <input
            data-testid="inventory-low-stock"
            type="checkbox"
            checked={lowStock}
            onChange={(event) => {
              const next = new URLSearchParams(params);
              if (event.target.checked) next.set("lowStock", "true");
              else next.delete("lowStock");
              next.delete("page");
              setParams(next);
            }}
          />
        </label>
        <button type="submit" data-testid="inventory-search-submit">
          Search
        </button>
      </form>
      {error ? (
        <p className="error" data-testid="inventory-error">
          {error}
        </p>
      ) : null}
      <table data-testid="inventory-table">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Name</th>
            <th>Bin</th>
            <th className="num">On hand</th>
            <th className="num">Reserved</th>
            <th className="num">Available</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.sku} data-testid={`inventory-row-${row.sku}`}>
              <td data-testid={`inventory-sku-${row.sku}`}>{row.sku}</td>
              <td>
                <span data-testid={`inventory-name-${row.sku}`}>{row.name}</span>
                <div className="hint">{row.category}</div>
              </td>
              <td data-testid={`inventory-bin-${row.sku}`}>{row.bin}</td>
              <td className="num" data-testid={`inventory-on-hand-${row.sku}`}>
                {row.onHand}
              </td>
              <td className="num" data-testid={`inventory-reserved-${row.sku}`}>
                {row.reserved}
              </td>
              <td className="num" data-testid={`inventory-available-${row.sku}`}>
                {row.available}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pager" data-testid="inventory-pager">
        <button
          className="quiet"
          type="button"
          data-testid="inventory-previous"
          disabled={page <= 1}
          onClick={() => {
            const next = new URLSearchParams(params);
            next.set("page", String(page - 1));
            setParams(next);
          }}
        >
          Previous
        </button>
        <span data-testid="inventory-page">
          Page {page} of {pages}
        </span>
        <button
          className="quiet"
          type="button"
          data-testid="inventory-next"
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
