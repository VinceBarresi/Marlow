import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { money } from "../format";
import type { CartItem } from "../types";

export function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [error, setError] = useState("");

  function load() {
    api<{ items: CartItem[]; subtotalCents: number }>("/api/cart")
      .then((result) => {
        setItems(result.items);
        setSubtotal(result.subtotalCents);
      })
      .catch((err: Error) => setError(err.message));
  }

  useEffect(load, []);

  async function update(sku: string, quantity: number) {
    setError("");
    try {
      await api("/api/cart/items", { method: "PUT", body: JSON.stringify({ sku, quantity }) });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the cart.");
    }
  }

  return (
    <>
      <h1 data-testid="cart-title">Cart</h1>
      {error ? <p className="error" data-testid="cart-error">{error}</p> : null}
      {items.length === 0 ? (
        <p data-testid="cart-empty">
          The cart is empty. <Link to="/" data-testid="cart-browse">Browse the shop.</Link>
        </p>
      ) : (
        <>
          <table data-testid="cart-table">
            <thead>
              <tr>
                <th>Item</th>
                <th className="num">Qty</th>
                <th className="num">Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.sku} data-testid={`cart-item-${item.sku}`}>
                  <td>
                    <Link to={`/products/${item.sku}`} data-testid={`cart-link-${item.sku}`}>{item.name}</Link>
                    <div className="hint" data-testid={`cart-meta-${item.sku}`}>{money(item.priceCents)} · {item.available} available</div>
                  </td>
                  <td className="num">
                    <input
                      data-testid={`cart-qty-${item.sku}`}
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(event) => update(item.sku, Number(event.target.value))}
                    />
                  </td>
                  <td className="num" data-testid={`cart-line-total-${item.sku}`}>{money(item.lineTotalCents)}</td>
                  <td>
                    <button className="quiet" type="button" data-testid={`cart-remove-${item.sku}`} onClick={() => update(item.sku, 0)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p data-testid="cart-subtotal">
            Subtotal {money(subtotal)}. Shipping is $8.00 under $75, and tax is 8%.
          </p>
          <Link className="button" to="/checkout" data-testid="cart-checkout">
            Checkout
          </Link>
        </>
      )}
    </>
  );
}
