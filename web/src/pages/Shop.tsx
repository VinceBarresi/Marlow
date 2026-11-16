import { FormEvent, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { money } from "../format";
import type { Product } from "../types";

export function Shop() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const category = params.get("category") ?? "";
  const page = Number(params.get("page") ?? "1");
  const [draft, setDraft] = useState(q);
  const [categories, setCategories] = useState<{ category: string; products: number }[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const pageSize = 12;

  useEffect(() => setDraft(q), [q]);

  useEffect(() => {
    let stop = false;
    api<{ categories: { category: string; products: number }[] }>("/api/categories")
      .then((result) => {
        if (!stop) setCategories(result.categories);
      })
      .catch(() => {});
    return () => {
      stop = true;
    };
  }, []);

  useEffect(() => {
    let stop = false;
    const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (q) query.set("q", q);
    if (category) query.set("category", category);
    setError("");
    api<{ products: Product[]; total: number }>(`/api/products?${query}`)
      .then((result) => {
        if (stop) return;
        setProducts(result.products);
        setTotal(result.total);
      })
      .catch((err: Error) => {
        if (!stop) setError(err.message);
      });
    return () => {
      stop = true;
    };
  }, [q, category, page]);

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
      <h1 data-testid="shop-title">Shop</h1>
      <p className="lede" data-testid="shop-count">{total} products in the current catalog.</p>
      <form className="filters" onSubmit={search} data-testid="shop-search-form">
        <label>
          Search
          <input data-testid="shop-search" value={draft} onChange={(event) => setDraft(event.target.value)} />
        </label>
        <label>
          Category
          <select
            data-testid="shop-category"
            value={category}
            onChange={(event) => {
              const next = new URLSearchParams(params);
              if (event.target.value) next.set("category", event.target.value);
              else next.delete("category");
              next.delete("page");
              setParams(next);
            }}
          >
            <option value="" data-testid="shop-category-all">All</option>
            {categories.map((item) => (
              <option key={item.category} value={item.category} data-testid={`shop-category-${item.category}`}>
                {item.category}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" data-testid="shop-search-submit">Search</button>
      </form>
      {error ? <p className="error" data-testid="shop-error">{error}</p> : null}
      <div className="grid" data-testid="shop-grid">
        {products.map((product) => (
          <Link className="card" key={product.sku} to={`/products/${product.sku}`} data-testid={`product-card-${product.sku}`}>
            <span className="category" data-testid={`product-category-${product.sku}`}>{product.category}</span>
            <strong data-testid={`product-name-${product.sku}`}>{product.name}</strong>
            <span className="price" data-testid={`product-price-${product.sku}`}>{money(product.priceCents)}</span>
            <span className="hint" data-testid={`product-stock-${product.sku}`}>{product.available > 0 ? `${product.available} available` : "Out of stock"}</span>
          </Link>
        ))}
      </div>
      <div className="pager" data-testid="shop-pager">
        <button
          className="quiet"
          type="button"
          data-testid="shop-previous"
          disabled={page <= 1}
          onClick={() => {
            const next = new URLSearchParams(params);
            next.set("page", String(page - 1));
            setParams(next);
          }}
        >
          Previous
        </button>
        <span data-testid="shop-page">
          Page {page} of {pages}
        </span>
        <button
          className="quiet"
          type="button"
          data-testid="shop-next"
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
