import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { money } from "../format";
import { StoreMap } from "../StoreMap";

type Store = {
  slug: string;
  name: string;
  city: string;
  line1: string;
  region: string;
  postalCode: string;
  phone: string;
  hours: string;
  latitude: number;
  longitude: number;
  productsInStock: number;
};

type ShelfItem = {
  sku: string;
  name: string;
  category: string;
  priceCents: number;
  onHand: number;
};

type ProductType = {
  category: string;
  products: number;
};

export function Location() {
  const { slug = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const category = params.get("category") ?? "";
  const page = Number(params.get("page") ?? "1");
  const [draft, setDraft] = useState(q);
  const [store, setStore] = useState<Store | null>(null);
  const [types, setTypes] = useState<ProductType[]>([]);
  const [products, setProducts] = useState<ShelfItem[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const pageSize = 24;

  useEffect(() => setDraft(q), [q]);

  useEffect(() => {
    let stop = false;
    const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (q) query.set("q", q);
    if (category) query.set("category", category);
    api<{ location: Store; categories: ProductType[]; products: ShelfItem[]; total: number }>(
      `/api/locations/${slug}?${query}`,
    )
      .then((result) => {
        if (stop) return;
        setStore(result.location);
        setTypes(result.categories);
        setProducts(result.products);
        setTotal(result.total);
      })
      .catch((err: Error) => {
        if (!stop) setError(err.message);
      });
    return () => {
      stop = true;
    };
  }, [slug, q, category, page]);

  const pins = useMemo(
    () =>
      store
        ? [
            {
              name: store.name,
              slug: store.slug,
              latitude: store.latitude,
              longitude: store.longitude,
            },
          ]
        : [],
    [store],
  );

  function search(event: FormEvent) {
    event.preventDefault();
    const next = new URLSearchParams(params);
    if (draft) next.set("q", draft);
    else next.delete("q");
    next.delete("page");
    setParams(next);
  }

  if (error && !store)
    return (
      <p className="error" data-testid="location-error">
        {error}
      </p>
    );
  if (!store) return <p data-testid="location-loading">Loading location…</p>;

  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <p className="sku">
        <Link to="/locations" data-testid="location-back">
          Locations
        </Link>
      </p>
      <h1 data-testid="location-name">{store.name}</h1>
      <p className="lede" data-testid="location-address">
        {store.line1}, {store.city}, {store.region} {store.postalCode}
        <br />
        {store.hours} · {store.phone}
      </p>
      <StoreMap testId="location-map" pins={pins} />
      <p>
        <Link to={`/careers?location=${store.slug}`} data-testid="location-jobs">
          Jobs at this store
        </Link>
      </p>
      <p data-testid="location-count">{total} products on the shelf for pickup.</p>
      <form className="filters" onSubmit={search} data-testid="location-search-form">
        <label>
          Search this store
          <input
            data-testid="location-search"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
        </label>
        <label>
          Type
          <select
            data-testid="location-category"
            value={category}
            onChange={(event) => {
              const next = new URLSearchParams(params);
              if (event.target.value) next.set("category", event.target.value);
              else next.delete("category");
              next.delete("page");
              setParams(next);
            }}
          >
            <option value="" data-testid="location-category-all">
              All in stock
            </option>
            {types.map((type) => (
              <option
                key={type.category}
                value={type.category}
                data-testid={`location-category-${type.category}`}
              >
                {type.category}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" data-testid="location-search-submit">
          Search
        </button>
      </form>
      <table data-testid="location-inventory">
        <thead>
          <tr>
            <th>Product</th>
            <th className="num">On hand</th>
            <th className="num">Price</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.sku} data-testid={`location-row-${product.sku}`}>
              <td>
                <Link to={`/products/${product.sku}`}>{product.name}</Link>
                <div className="hint">
                  {product.category} · {product.sku}
                </div>
              </td>
              <td className="num" data-testid={`location-on-hand-${product.sku}`}>
                {product.onHand}
              </td>
              <td className="num">{money(product.priceCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pager" data-testid="location-pager">
        <button
          className="quiet"
          type="button"
          data-testid="location-previous"
          disabled={page <= 1}
          onClick={() => {
            const next = new URLSearchParams(params);
            next.set("page", String(page - 1));
            setParams(next);
          }}
        >
          Previous
        </button>
        <span data-testid="location-page">
          Page {page} of {pages}
        </span>
        <button
          className="quiet"
          type="button"
          data-testid="location-next"
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
