import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { api } from "./api";
import { Empty } from "./Empty";
import { money } from "./format";
import type { Product } from "./types";

export function CategoryPage() {
  const { category = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const page = Number(params.get("page") ?? "1");
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const pageSize = 12;

  useEffect(() => {
    let stop = false;
    const query = new URLSearchParams({
      category,
      page: String(page),
      pageSize: String(pageSize),
    });
    setError("");
    api<{ products: Product[]; total: number }>(`/api/products?${query}`)
      .then((result) => {
        if (stop) return;
        setProducts(result.products);
        setTotal(result.total);
        setReady(true);
      })
      .catch((err: Error) => {
        if (!stop) setError(err.message);
      });
    return () => {
      stop = true;
    };
  }, [category, page]);

  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <p className="sku">
        <Link to="/" data-testid="category-shop">
          Shop
        </Link>
      </p>
      <h1 data-testid="category-title">{category}</h1>
      <p className="lede" data-testid="category-count">
        {total} products
      </p>
      {error ? (
        <p className="error" data-testid="category-error">
          {error}
        </p>
      ) : null}
      {ready && total === 0 && !error ? (
        <Empty testId="category-empty" message="No products in this category." />
      ) : (
        <div className="grid" data-testid="category-grid">
          {products.map((product) => (
            <Link
              className="card"
              key={product.sku}
              to={`/products/${product.sku}`}
              data-testid={`product-card-${product.sku}`}
            >
              <strong data-testid={`product-name-${product.sku}`}>{product.name}</strong>
              <span className="price" data-testid={`product-price-${product.sku}`}>
                {money(product.priceCents)}
              </span>
              <span className="hint" data-testid={`product-stock-${product.sku}`}>
                {product.available > 0 ? `${product.available} available` : "Out of stock"}
              </span>
            </Link>
          ))}
        </div>
      )}
      {total > 0 ? (
        <div className="pager" data-testid="category-pager">
          <button
            className="quiet"
            type="button"
            data-testid="category-previous"
            disabled={page <= 1}
            onClick={() => {
              const next = new URLSearchParams(params);
              next.set("page", String(page - 1));
              setParams(next);
            }}
          >
            Previous
          </button>
          <span data-testid="category-page">
            Page {page} of {pages}
          </span>
          <button
            className="quiet"
            type="button"
            data-testid="category-next"
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
      ) : null}
    </>
  );
}
