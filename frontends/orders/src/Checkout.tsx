import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "./api";

export function Checkout() {
  const navigate = useNavigate();
  const [shipName, setShipName] = useState("Mina Adler");
  const [shipLine1, setShipLine1] = useState("100 Market Street");
  const [shipCity, setShipCity] = useState("Austin");
  const [shipRegion, setShipRegion] = useState("TX");
  const [shipPostalCode, setShipPostalCode] = useState("78701");
  const [error, setError] = useState("");

  async function place(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const result = await api<{ order: { number: string } }>("/api/checkout", {
        method: "POST",
        body: JSON.stringify({ shipName, shipLine1, shipCity, shipRegion, shipPostalCode }),
      });
      navigate(`/orders/${result.order.number}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place the order.");
    }
  }

  return (
    <>
      <h1 data-testid="checkout-title">Checkout</h1>
      <p className="lede" data-testid="checkout-lede">
        This ships to the address below and marks the order paid.
      </p>
      <form
        className="stack panel"
        style={{ maxWidth: 480 }}
        onSubmit={place}
        data-testid="checkout-form"
      >
        <label>
          Name
          <input
            data-testid="checkout-name"
            value={shipName}
            onChange={(event) => setShipName(event.target.value)}
          />
        </label>
        <label>
          Address
          <input
            data-testid="checkout-address"
            value={shipLine1}
            onChange={(event) => setShipLine1(event.target.value)}
          />
        </label>
        <label>
          City
          <input
            data-testid="checkout-city"
            value={shipCity}
            onChange={(event) => setShipCity(event.target.value)}
          />
        </label>
        <label>
          State
          <input
            data-testid="checkout-state"
            value={shipRegion}
            onChange={(event) => setShipRegion(event.target.value)}
          />
        </label>
        <label>
          Postal code
          <input
            data-testid="checkout-postal"
            value={shipPostalCode}
            onChange={(event) => setShipPostalCode(event.target.value)}
          />
        </label>
        {error ? (
          <p className="error" data-testid="checkout-error">
            {error}
          </p>
        ) : null}
        <button type="submit" data-testid="checkout-submit">
          Place order
        </button>
      </form>
    </>
  );
}
