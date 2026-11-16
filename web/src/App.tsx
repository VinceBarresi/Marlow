import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth";
import { CartPage } from "./pages/Cart";
import { Checkout } from "./pages/Checkout";
import { Inventory } from "./pages/Inventory";
import { Login } from "./pages/Login";
import { OrderPage } from "./pages/Order";
import { Orders } from "./pages/Orders";
import { ProductPage } from "./pages/Product";
import { Shop } from "./pages/Shop";
import { RequireAuth, RequireStaff, Shell } from "./shell";

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<RequireAuth />}>
            <Route element={<Shell />}>
              <Route path="/" element={<Shop />} />
              <Route path="/products/:sku" element={<ProductPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/orders/:number" element={<OrderPage />} />
              <Route element={<RequireStaff />}>
                <Route path="/staff/orders" element={<Orders staff />} />
                <Route path="/staff/inventory" element={<Inventory />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
