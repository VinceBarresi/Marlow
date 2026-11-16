import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { CategoryPage } from "./Category";
import { ProductPage } from "./Product";
import { Shop } from "./Shop";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <main className="page">
        <Routes>
          <Route path="/" element={<Shop />} />
          <Route path="/categories/:category" element={<CategoryPage />} />
          <Route path="/products/:sku" element={<ProductPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  </StrictMode>,
);
