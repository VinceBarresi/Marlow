import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "./api";
import { money } from "./format";
import type { Product } from "./types";

type Me = { id: string; email: string; name: string; role: string };

export function ProductPage() {
  const { sku = "" } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    let stop = false;
    api<{ user: Me }>("/api/me")
      .then((result) => {
        if (!stop) setRole(result.user.role);
      })
      .catch(() => {
        if (!stop) setRole(null);
      });
    return () => {
      stop = true;
    };
  }, []);

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

  async function replaceImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setUploadMessage("");
    const form = event.currentTarget;
    const input = form.elements.namedItem("image") as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) {
      setError("Choose an image file.");
      return;
    }
    const body = new FormData();
    body.set("file", file);
    try {
      const response = await fetch(`/api/products/${encodeURIComponent(sku)}/image`, {
        method: "POST",
        credentials: "include",
        body,
      });
      const text = await response.text();
      const data = text
        ? (JSON.parse(text) as { error?: string; image?: { imageUrl: string; id: string } })
        : null;
      if (!response.ok) {
        throw new Error(data?.error ?? response.statusText);
      }
      if (data?.image) {
        setProduct((current) =>
          current
            ? {
                ...current,
                imageId: data.image!.id,
                imageUrl: `${data.image!.imageUrl}?t=${Date.now()}`,
              }
            : current,
        );
      }
      setUploadMessage("Image replaced.");
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload image.");
    }
  }

  if (error && !product)
    return (
      <p className="error" data-testid="product-error">
        {error}
      </p>
    );
  if (!product) return <p data-testid="product-loading">Loading product…</p>;

  const canUpload = role === "staff" || role === "admin";

  return (
    <>
      <p className="sku" data-testid="product-sku">
        {product.category} · {product.sku}
      </p>
      <h1 data-testid="product-name">{product.name}</h1>
      {product.imageUrl ? (
        <img
          className="product-image product-image-hero"
          src={product.imageUrl}
          alt={product.name}
          data-testid="product-image"
        />
      ) : null}
      <p className="lede" data-testid="product-description">
        {product.description}
      </p>
      <div className="panel stack" style={{ maxWidth: 420 }} data-testid="product-panel">
        <strong className="price" data-testid="product-price">
          {money(product.priceCents)}
        </strong>
        <span data-testid="product-stock">
          {product.available} available · {product.onHand} on hand · {product.reserved} reserved
        </span>
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
        {canUpload ? (
          <form className="stack" onSubmit={replaceImage} data-testid="product-image-upload">
            <label>
              Replace image
              <input data-testid="product-image-file" name="image" type="file" accept="image/*" />
            </label>
            <button type="submit" data-testid="product-image-submit">
              Upload
            </button>
          </form>
        ) : null}
        {uploadMessage ? <p data-testid="product-image-message">{uploadMessage}</p> : null}
        {error ? (
          <p className="error" data-testid="product-error">
            {error}
          </p>
        ) : null}
        <Link to="/" data-testid="product-back">
          Back to shop
        </Link>
      </div>
    </>
  );
}
