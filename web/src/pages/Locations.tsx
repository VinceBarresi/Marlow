import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
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

export function Locations() {
  const { user } = useAuth();
  const admin = user?.role === "admin";
  const [stores, setStores] = useState<Store[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    api<{ locations: Store[] }>("/api/locations")
      .then((result) => setStores(result.locations))
      .catch((err: Error) => setError(err.message));
  }, [revision]);

  async function addStore(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setError("");
    try {
      const result = await api<{ location: Store }>("/api/locations", {
        method: "POST",
        body: JSON.stringify({
          name: data.get("name"),
          city: data.get("city"),
          line1: data.get("line1"),
          region: data.get("region"),
          postalCode: data.get("postalCode"),
          phone: data.get("phone"),
          hours: data.get("hours"),
          latitude: Number(data.get("latitude")),
          longitude: Number(data.get("longitude")),
        }),
      });
      form.reset();
      setNotice(`${result.location.name} is on the map.`);
      setRevision((value) => value + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add the store.");
    }
  }

  async function removeStore(store: Store) {
    setError("");
    try {
      await api(`/api/locations/${store.slug}`, { method: "DELETE" });
      setPending("");
      setNotice(`${store.name} was removed.`);
      setRevision((value) => value + 1);
    } catch (err) {
      setPending("");
      setError(err instanceof Error ? err.message : "Could not remove the store.");
    }
  }

  const pins = useMemo(
    () =>
      stores.map((store) => ({
        name: store.name,
        slug: store.slug,
        latitude: store.latitude,
        longitude: store.longitude,
      })),
    [stores],
  );

  return (
    <>
      <h1 data-testid="locations-title">Locations</h1>
      <p className="lede" data-testid="locations-lede">
        Marlow stores in Texas. Each one keeps its own inventory for pickup orders.
      </p>
      {notice ? (
        <p className="hint" data-testid="locations-notice">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className="error" data-testid="locations-error">
          {error}
        </p>
      ) : null}
      {admin ? (
        <form
          className="stack apply panel"
          onSubmit={(event) => void addStore(event)}
          data-testid="location-form"
        >
          <strong>Add a store</strong>
          <label>
            Name
            <input name="name" required data-testid="location-form-name" />
          </label>
          <label>
            Street
            <input name="line1" required data-testid="location-form-line1" />
          </label>
          <label>
            City
            <input name="city" required data-testid="location-form-city" />
          </label>
          <label>
            Region
            <input name="region" required defaultValue="TX" data-testid="location-form-region" />
          </label>
          <label>
            Postal code
            <input name="postalCode" required data-testid="location-form-postal" />
          </label>
          <label>
            Phone
            <input name="phone" required data-testid="location-form-phone" />
          </label>
          <label>
            Hours
            <input name="hours" required data-testid="location-form-hours" />
          </label>
          <label>
            Latitude
            <input
              name="latitude"
              required
              inputMode="decimal"
              data-testid="location-form-latitude"
            />
          </label>
          <label>
            Longitude
            <input
              name="longitude"
              required
              inputMode="decimal"
              data-testid="location-form-longitude"
            />
          </label>
          <button type="submit" data-testid="location-form-submit">
            Add store
          </button>
        </form>
      ) : null}
      <StoreMap testId="locations-map" pins={pins} />
      <div className="grid" data-testid="locations-grid">
        {stores.map((store) => (
          <article className="card" key={store.slug} data-testid={`location-card-${store.slug}`}>
            <Link className="card-link" to={`/locations/${store.slug}`}>
              <span className="category" data-testid={`location-city-${store.slug}`}>
                {store.city}
              </span>
              <strong data-testid={`location-name-${store.slug}`}>{store.name}</strong>
              <span className="hint">
                {store.line1}
                <br />
                {store.city}, {store.region} {store.postalCode}
              </span>
              <span data-testid={`location-hours-${store.slug}`}>{store.hours}</span>
              <span className="hint" data-testid={`location-stock-${store.slug}`}>
                {store.productsInStock} products for pickup
              </span>
            </Link>
            {admin ? (
              <div className="card-actions">
                {pending === store.slug ? (
                  <>
                    <button
                      className="danger"
                      type="button"
                      data-testid={`location-confirm-${store.slug}`}
                      onClick={() => void removeStore(store)}
                    >
                      Confirm remove
                    </button>
                    <button className="quiet" type="button" onClick={() => setPending("")}>
                      Keep
                    </button>
                  </>
                ) : (
                  <button
                    className="quiet"
                    type="button"
                    data-testid={`location-remove-${store.slug}`}
                    onClick={() => setPending(store.slug)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </>
  );
}
