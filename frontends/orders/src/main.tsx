import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { CartPage } from "./Cart";
import { Checkout } from "./Checkout";
import { OrderPage } from "./Order";
import { Orders } from "./Orders";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <main className="page">
        <Routes>
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:number" element={<OrderPage />} />
          <Route path="/staff/orders" element={<Orders staff />} />
        </Routes>
      </main>
    </BrowserRouter>
  </StrictMode>,
);
