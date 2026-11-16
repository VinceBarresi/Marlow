import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth";
import { Account } from "./pages/Account";
import { Admin } from "./pages/Admin";
import { Applications } from "./pages/Applications";
import { Apply } from "./pages/Apply";
import { Careers } from "./pages/Careers";
import { Customer } from "./pages/Customer";
import { Customers } from "./pages/Customers";
import { Inventory } from "./pages/Inventory";
import { Location } from "./pages/Location";
import { Locations } from "./pages/Locations";
import { Login } from "./pages/Login";
import { RequireAdmin, RequireAuth, RequireStaff, Shell } from "./shell";

const Shop = lazy(() => import("catalog/Shop").then((mod) => ({ default: mod.Shop })));
const ProductPage = lazy(() =>
  import("catalog/Product").then((mod) => ({ default: mod.ProductPage })),
);
const CartPage = lazy(() => import("orders/Cart").then((mod) => ({ default: mod.CartPage })));
const Checkout = lazy(() => import("orders/Checkout").then((mod) => ({ default: mod.Checkout })));
const Orders = lazy(() => import("orders/Orders").then((mod) => ({ default: mod.Orders })));
const OrderPage = lazy(() => import("orders/Order").then((mod) => ({ default: mod.OrderPage })));
const Receipt = lazy(() => import("orders/Receipt").then((mod) => ({ default: mod.Receipt })));
const CategoryPage = lazy(() =>
  import("catalog/Category").then((mod) => ({ default: mod.CategoryPage })),
);

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<RequireAuth />}>
            <Route element={<Shell />}>
              <Route
                path="/"
                element={
                  <Suspense fallback={<p data-testid="catalog-loading">Loading catalog…</p>}>
                    <Shop />
                  </Suspense>
                }
              />
              <Route path="/account" element={<Account />} />
              <Route path="/locations" element={<Locations />} />
              <Route path="/locations/:slug" element={<Location />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/careers/:slug" element={<Apply />} />
              <Route
                path="/categories/:category"
                element={
                  <Suspense fallback={<p data-testid="catalog-loading">Loading catalog…</p>}>
                    <CategoryPage />
                  </Suspense>
                }
              />
              <Route
                path="/products/:sku"
                element={
                  <Suspense fallback={<p data-testid="catalog-loading">Loading catalog…</p>}>
                    <ProductPage />
                  </Suspense>
                }
              />
              <Route
                path="/cart"
                element={
                  <Suspense fallback={<p data-testid="orders-loading">Loading orders…</p>}>
                    <CartPage />
                  </Suspense>
                }
              />
              <Route
                path="/checkout"
                element={
                  <Suspense fallback={<p data-testid="orders-loading">Loading orders…</p>}>
                    <Checkout />
                  </Suspense>
                }
              />
              <Route
                path="/orders"
                element={
                  <Suspense fallback={<p data-testid="orders-loading">Loading orders…</p>}>
                    <Orders />
                  </Suspense>
                }
              />
              <Route
                path="/orders/:number/confirmed"
                element={
                  <Suspense fallback={<p data-testid="orders-loading">Loading orders…</p>}>
                    <Receipt />
                  </Suspense>
                }
              />
              <Route
                path="/orders/:number"
                element={
                  <Suspense fallback={<p data-testid="orders-loading">Loading orders…</p>}>
                    <OrderPage />
                  </Suspense>
                }
              />
              <Route element={<RequireStaff />}>
                <Route
                  path="/staff/orders"
                  element={
                    <Suspense fallback={<p data-testid="orders-loading">Loading orders…</p>}>
                      <Orders staff />
                    </Suspense>
                  }
                />
                <Route path="/staff/inventory" element={<Inventory />} />
                <Route path="/staff/customers" element={<Customers />} />
                <Route path="/staff/customers/:id" element={<Customer />} />
                <Route path="/staff/applications" element={<Applications />} />
              </Route>
              <Route element={<RequireAdmin />}>
                <Route path="/admin" element={<Admin />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
