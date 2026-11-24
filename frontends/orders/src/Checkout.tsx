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

type SavedCard = {
  id: string;
  card: { brand: string; last4: string; expMonth: number; expYear: number };
};

const defaultExpYear = new Date().getFullYear() + 2;

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
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [cardNumber, setCardNumber] = useState("4242424242424242");
  const [expMonth, setExpMonth] = useState("12");
  const [expYear, setExpYear] = useState(String(defaultExpYear));
  const [cvc, setCvc] = useState("123");
  const [saveCard, setSaveCard] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ paymentMethods: SavedCard[] }>("/api/payment-methods")
      .then((result) => {
        setSavedCards(result.paymentMethods);
        if (result.paymentMethods[0]) {
          setPaymentMethodId((current) => current || result.paymentMethods[0]!.id);
        }
      })
      .catch(() => undefined);
  }, []);

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
  const useSaved = Boolean(paymentMethodId);

  async function place(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const base =
        fulfillment === "pickup"
          ? { fulfillment, locationId, shipName }
          : { fulfillment, shipName, shipLine1, shipCity, shipRegion, shipPostalCode };
      const payment = useSaved
        ? { paymentMethodId }
        : {
            card: {
              number: cardNumber,
              expMonth: Number(expMonth),
              expYear: Number(expYear),
              cvc,
            },
            saveCard,
          };
      const result = await api<{ order: { number: string } }>("/api/checkout", {
        method: "POST",
        body: JSON.stringify({ ...base, ...payment }),
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

        <fieldset className="stack" data-testid="checkout-payment">
          <legend>Payment</legend>
          {savedCards.length > 0 ? (
            <label>
              Saved card
              <select
                data-testid="checkout-saved-card"
                value={paymentMethodId}
                onChange={(event) => setPaymentMethodId(event.target.value)}
              >
                <option value="">New card</option>
                {savedCards.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.card.brand.toUpperCase()} ···· {method.card.last4} (
                    {method.card.expMonth}/{method.card.expYear})
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {!useSaved ? (
            <>
              <label>
                Card number
                <input
                  data-testid="checkout-card-number"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  value={cardNumber}
                  onChange={(event) => setCardNumber(event.target.value)}
                />
              </label>
              <div className="row">
                <label>
                  Exp month
                  <input
                    data-testid="checkout-card-exp-month"
                    inputMode="numeric"
                    value={expMonth}
                    onChange={(event) => setExpMonth(event.target.value)}
                  />
                </label>
                <label>
                  Exp year
                  <input
                    data-testid="checkout-card-exp-year"
                    inputMode="numeric"
                    value={expYear}
                    onChange={(event) => setExpYear(event.target.value)}
                  />
                </label>
                <label>
                  CVC
                  <input
                    data-testid="checkout-card-cvc"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    value={cvc}
                    onChange={(event) => setCvc(event.target.value)}
                  />
                </label>
              </div>
              <label className="row">
                <input
                  type="checkbox"
                  data-testid="checkout-save-card"
                  checked={saveCard}
                  onChange={(event) => setSaveCard(event.target.checked)}
                />{" "}
                Save this card for next time
              </label>
              <p className="hint">Sandbox: use 4242…4242 to pay, 4000…0002 to decline.</p>
            </>
          ) : null}
        </fieldset>

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
