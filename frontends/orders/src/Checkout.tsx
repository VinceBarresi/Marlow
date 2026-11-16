import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "./api";

type Store = {
  id: string;
  slug: string;
  name: string;
  city: string;
  line1: string;
  region: string;
  postalCode: string;
  hours: string;
};

export function Checkout() {
  const navigate = useNavigate();
  const [fulfillment, setFulfillment] = useState<"ship" | "pickup">("ship");
  const [stores, setStores] = useState<Store[]>([]);
  const [locationId, setLocationId] = useState("");
  const [shipName, setShipName] = useState("Mina Adler");
  const [shipLine1, setShipLine1] = useState("100 Market Street");
  const [shipCity, setShipCity] = useState("Austin");
  const [shipRegion, setShipRegion] = useState("TX");
  const [shipPostalCode, setShipPostalCode] = useState("78701");
  const [error, setError] = useState("");

  useEffect(() => {
    if (fulfillment !== "pickup" || stores.length > 0) return;
    api<{ locations: Store[] }>("/api/locations")
      .then((result) => {
        setStores(result.locations);
        setLocationId((current) => current || result.locations[0]?.id || "");
      })
      .catch((err: Error) => setError(err.message));
  }, [fulfillment, stores.length]);

  const store = stores.find((item) => item.id === locationId);

  async function place(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const body =
        fulfillment === "pickup"
          ? { fulfillment, locationId, shipName }
          : { fulfillment, shipName, shipLine1, shipCity, shipRegion, shipPostalCode };
      const result = await api<{ order: { number: string } }>("/api/checkout", {
        method: "POST",
        body: JSON.stringify(body),
      });
      navigate(`/orders/${result.order.number}/confirmed`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place the order.");
    }
  }

  return (
    <>
      <h1 data-testid="checkout-title">Checkout</h1>
      <p className="lede" data-testid="checkout-lede">
        Ship it, or pick it up at a Marlow store in Texas. Either way the order is paid now.
      </p>
      <form
        className="stack panel"
        style={{ maxWidth: 480 }}
        onSubmit={place}
        data-testid="checkout-form"
      >
        <div className="row" data-testid="checkout-fulfillment">
          <label>
            <input
              type="radio"
              name="fulfillment"
              data-testid="checkout-ship"
              checked={fulfillment === "ship"}
              onChange={() => setFulfillment("ship")}
            />{" "}
            Ship
          </label>
          <label>
            <input
              type="radio"
              name="fulfillment"
              data-testid="checkout-pickup"
              checked={fulfillment === "pickup"}
              onChange={() => setFulfillment("pickup")}
            />{" "}
            Pickup
          </label>
        </div>
        <label>
          Name
          <input
            data-testid="checkout-name"
            value={shipName}
            onChange={(event) => setShipName(event.target.value)}
          />
        </label>
        {fulfillment === "pickup" ? (
          <>
            <label>
              Store
              <select
                data-testid="checkout-store"
                value={locationId}
                onChange={(event) => setLocationId(event.target.value)}
              >
                {stores.map((item) => (
                  <option key={item.id} value={item.id} data-testid={`checkout-store-${item.slug}`}>
                    {item.name} · {item.city}
                  </option>
                ))}
              </select>
            </label>
            {store ? (
              <p className="hint" data-testid="checkout-store-address">
                {store.line1}, {store.city}, {store.region} {store.postalCode}
                <br />
                {store.hours}
              </p>
            ) : null}
          </>
        ) : (
          <>
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
          </>
        )}
        {error ? (
          <p className="error" data-testid="checkout-error">
            {error}
          </p>
        ) : null}
        <button type="submit" data-testid="checkout-submit">
          {fulfillment === "pickup" ? "Place pickup order" : "Place order"}
        </button>
      </form>
    </>
  );
}
