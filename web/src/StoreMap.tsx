import { useEffect, useRef, useState } from "react";

export type MapPin = {
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
};

type MapInstance = {
  fitBounds: (bounds: Bounds, padding?: number) => void;
};

type Marker = {
  setMap: (map: MapInstance | null) => void;
  addListener: (event: string, handler: () => void) => void;
};

type Bounds = {
  extend: (position: { lat: number; lng: number }) => void;
};

type InfoWindow = {
  open: (options: { map: MapInstance; anchor: Marker }) => void;
};

type MapsApi = {
  Map: new (element: HTMLElement, options: object) => MapInstance;
  Marker: new (options: object) => Marker;
  LatLngBounds: new () => Bounds;
  InfoWindow: new (options: { content: HTMLElement }) => InfoWindow;
};

const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

function mapsApi() {
  return (window as Window & { google?: { maps: MapsApi } }).google?.maps;
}

let loading: Promise<void> | null = null;

function loadMaps(key: string) {
  if (mapsApi()) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}`;
    script.async = true;
    script.dataset.marlowMaps = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Maps did not load."));
    document.head.appendChild(script);
  });
  return loading;
}

type LeafletMap = {
  remove: () => void;
  fitBounds: (bounds: unknown, options?: { padding: [number, number] }) => void;
};

type LeafletMarker = {
  addTo: (map: LeafletMap) => LeafletMarker;
  bindPopup: (html: string) => LeafletMarker;
};

type LeafletLib = {
  map: (element: HTMLElement, options?: object) => LeafletMap;
  tileLayer: (url: string, options: object) => { addTo: (map: LeafletMap) => void };
  marker: (latlng: [number, number], options: object) => LeafletMarker;
  latLngBounds: (latlngs: [number, number][]) => unknown;
  icon: (options: object) => object;
};

function leafletLib() {
  return (window as Window & { L?: LeafletLib }).L;
}

let leafletLoading: Promise<LeafletLib> | null = null;

function loadLeaflet() {
  const existing = leafletLib();
  if (existing) return Promise.resolve(existing);
  leafletLoading ??= new Promise<LeafletLib>((resolve, reject) => {
    if (!document.querySelector("link[data-marlow-leaflet]")) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.dataset.marlowLeaflet = "1";
      document.head.appendChild(link);
    }
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => {
      const lib = leafletLib();
      if (lib) resolve(lib);
      else reject(new Error("Map did not load."));
    };
    script.onerror = () => reject(new Error("Map did not load."));
    document.head.appendChild(script);
  });
  return leafletLoading;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const named: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return named[char] ?? char;
  });
}

function LinkList({ pins, testId }: { pins: MapPin[]; testId: string }) {
  return (
    <div className="panel" data-testid={testId}>
      <ul className="map-links">
        {pins.map((pin) => (
          <li key={pin.slug}>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${pin.latitude},${pin.longitude}`}
              target="_blank"
              rel="noreferrer"
              data-testid={`map-link-${pin.slug}`}
            >
              {pin.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AllStoresMap({ pins, testId }: { pins: MapPin[]; testId: string }) {
  const node = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const element = node.current;
    if (!element) return;
    let stop = false;
    let map: LeafletMap | null = null;
    loadLeaflet()
      .then((leaflet) => {
        if (stop) return;
        const icon = leaflet.icon({
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        });
        const created = leaflet.map(element, { scrollWheelZoom: false });
        if (stop) {
          created.remove();
          return;
        }
        map = created;
        leaflet
          .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap",
            maxZoom: 18,
          })
          .addTo(map);
        const points = pins.map((pin) => [pin.latitude, pin.longitude] as [number, number]);
        for (const pin of pins) {
          leaflet
            .marker([pin.latitude, pin.longitude], { icon, title: pin.name })
            .addTo(map)
            .bindPopup(
              `<a href="/locations/${encodeURIComponent(pin.slug)}">${escapeHtml(pin.name)}</a>`,
            );
        }
        map.fitBounds(leaflet.latLngBounds(points), { padding: [28, 28] });
      })
      .catch(() => {
        if (!stop) setFailed(true);
      });
    return () => {
      stop = true;
      map?.remove();
    };
  }, [pins]);

  if (failed) return <LinkList pins={pins} testId={testId} />;
  return (
    <div
      className="map"
      ref={node}
      data-testid={testId}
      role="region"
      aria-label="Map of Marlow stores"
    />
  );
}

function Fallback({ pins, testId }: { pins: MapPin[]; testId: string }) {
  if (pins.length === 1) {
    const pin = pins[0];
    return (
      <iframe
        className="map"
        title={`Map of ${pin.name}`}
        data-testid={testId}
        src={`https://maps.google.com/maps?q=${pin.latitude},${pin.longitude}&z=15&output=embed`}
      />
    );
  }
  return <AllStoresMap pins={pins} testId={testId} />;
}

export function StoreMap({ pins, testId }: { pins: MapPin[]; testId: string }) {
  const node = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(!mapsKey);

  useEffect(() => {
    if (!mapsKey || pins.length === 0) return;
    let stop = false;
    loadMaps(mapsKey)
      .then(() => {
        if (!stop) setReady(true);
      })
      .catch(() => {
        if (!stop) setFailed(true);
      });
    return () => {
      stop = true;
    };
  }, [pins.length]);

  useEffect(() => {
    const element = node.current;
    const maps = mapsApi();
    if (!ready || !element || !maps || pins.length === 0) return;
    const map = new maps.Map(element, {
      center: { lat: pins[0].latitude, lng: pins[0].longitude },
      zoom: pins.length === 1 ? 15 : 6,
      mapTypeControl: false,
      streetViewControl: false,
    });
    const bounds = new maps.LatLngBounds();
    const markers = pins.map((pin) => {
      const position = { lat: pin.latitude, lng: pin.longitude };
      bounds.extend(position);
      const marker = new maps.Marker({ map, position, title: pin.name });
      const content = document.createElement("div");
      const link = document.createElement("a");
      link.href = `/locations/${pin.slug}`;
      link.textContent = pin.name;
      content.append(link);
      const info = new maps.InfoWindow({ content });
      marker.addListener("click", () => info.open({ map, anchor: marker }));
      return marker;
    });
    if (pins.length > 1) map.fitBounds(bounds, 48);
    return () => {
      for (const marker of markers) marker.setMap(null);
    };
  }, [ready, pins]);

  if (pins.length === 0) return null;
  if (failed || !mapsKey) return <Fallback pins={pins} testId={testId} />;
  return <div className="map" ref={node} data-testid={testId} />;
}
