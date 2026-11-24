import { FormEvent, useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth";
import { api } from "../api";

type SavedCard = {
  id: string;
  card: { brand: string; last4: string; expMonth: number; expYear: number };
};

const defaultExpYear = new Date().getFullYear() + 2;

export function Account() {
  const { user } = useAuth();
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [cardNumber, setCardNumber] = useState("4242424242424242");
  const [expMonth, setExpMonth] = useState("12");
  const [expYear, setExpYear] = useState(String(defaultExpYear));
  const [cvc, setCvc] = useState("123");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadCards = useCallback(() => {
    return api<{ paymentMethods: SavedCard[] }>("/api/payment-methods")
      .then((result) => setCards(result.paymentMethods))
      .catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!user) return;
    void loadCards();
  }, [user, loadCards]);

  if (!user) return null;

  async function addCard(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await api("/api/payment-methods", {
        method: "POST",
        body: JSON.stringify({
          card: {
            number: cardNumber,
            expMonth: Number(expMonth),
            expYear: Number(expYear),
            cvc,
          },
        }),
      });
      setMessage("Card saved.");
      setCvc("");
      await loadCards();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save card.");
    }
  }

  async function removeCard(id: string) {
    setError("");
    setMessage("");
    try {
      await api(`/api/payment-methods/${encodeURIComponent(id)}`, { method: "DELETE" });
      setMessage("Card removed.");
      await loadCards();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove card.");
    }
  }

  return (
    <>
      <h1 data-testid="account-title">Account</h1>
      <p className="lede" data-testid="account-lede">
        This is the person signed in to Marlow.
      </p>
      <section className="panel stack" style={{ maxWidth: 480 }} data-testid="account-card">
        <div>
          <div className="hint">Name</div>
          <div data-testid="account-name">{user.name}</div>
        </div>
        <div>
          <div className="hint">Email</div>
          <div data-testid="account-email">{user.email}</div>
        </div>
        <div>
          <div className="hint">Role</div>
          <div data-testid="account-role">{user.role}</div>
        </div>
      </section>

      <section className="panel stack" style={{ maxWidth: 480 }} data-testid="account-payment-methods">
        <h2 data-testid="account-cards-title">Saved cards</h2>
        <p className="hint">
          Cards are tokenized by the payments sandbox. Marlow keeps only brand and last four digits.
        </p>
        {cards.length === 0 ? (
          <p data-testid="account-cards-empty">No cards on file.</p>
        ) : (
          <ul className="stack" data-testid="account-cards-list">
            {cards.map((method) => (
              <li key={method.id} className="row" data-testid={`account-card-${method.id}`}>
                <span>
                  {method.card.brand.toUpperCase()} ···· {method.card.last4} (exp{" "}
                  {method.card.expMonth}/{method.card.expYear})
                </span>
                <button
                  type="button"
                  data-testid={`account-card-remove-${method.id}`}
                  onClick={() => void removeCard(method.id)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <form className="stack" onSubmit={addCard} data-testid="account-add-card-form">
          <label>
            Card number
            <input
              data-testid="account-card-number"
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
                data-testid="account-card-exp-month"
                inputMode="numeric"
                value={expMonth}
                onChange={(event) => setExpMonth(event.target.value)}
              />
            </label>
            <label>
              Exp year
              <input
                data-testid="account-card-exp-year"
                inputMode="numeric"
                value={expYear}
                onChange={(event) => setExpYear(event.target.value)}
              />
            </label>
            <label>
              CVC
              <input
                data-testid="account-card-cvc"
                inputMode="numeric"
                autoComplete="cc-csc"
                value={cvc}
                onChange={(event) => setCvc(event.target.value)}
              />
            </label>
          </div>
          <button type="submit" data-testid="account-card-save">
            Save card
          </button>
        </form>
        {error ? (
          <p className="error" data-testid="account-cards-error">
            {error}
          </p>
        ) : null}
        {message ? <p data-testid="account-cards-message">{message}</p> : null}
      </section>
    </>
  );
}
