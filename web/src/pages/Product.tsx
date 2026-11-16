import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { money } from "../format";
import type { Product } from "../types";

export function ProductPage() {
  const { sku = "" } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    let stop = false;
    api<{ product: Product }>(`/api/products/${sku}`)
      .then((result) => {
        if (!stop) setProduct(result.product);
      })
      .catch((err: Error) => {
        if (!stop) setError(err.message);
      });
    return () => {
      stop = true;
    };
  }, [sku]);

  async function add(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await api("/api/cart/items", { method: "PUT", body: JSON.stringify({ sku, quantity }) });
      navigate("/cart");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add to cart.");
    }
  }

  if (error && !product) return <p className="error" data-testid="product-error">{error}</p>;
  if (!product) return <p data-testid="product-loading">Loading product…</p>;

  return (
    <>
      <p className="sku" data-testid="product-sku">{product.category} · {product.sku}</p>
      <h1 data-testid="product-name">{product.name}</h1>
      <p className="lede" data-testid="product-description">{product.description}</p>
      <div className="panel stack" style={{ maxWidth: 420 }} data-testid="product-panel">
        <strong className="price" data-testid="product-price">{money(product.priceCents)}</strong>
        <span data-testid="product-stock">{product.available} available · {product.onHand} on hand · {product.reserved} reserved</span>
        <form className="actions" onSubmit={add} data-testid="product-add-form">
          <label>
            Quantity
            <input
              data-testid="product-quantity"
              type="number"
              min={1}
              max={product.available}
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
            />
          </label>
          <button type="submit" data-testid="product-add" disabled={product.available < 1}>
            Add to cart
          </button>
        </form>
        {error ? <p className="error" data-testid="product-error">{error}</p> : null}
        <Link to="/" data-testid="product-back">Back to shop</Link>
      </div>
    </>
  );
}
