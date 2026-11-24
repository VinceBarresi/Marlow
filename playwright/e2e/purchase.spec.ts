import { test } from "@playwright/test";
import { CartPage } from "../pages/cart.page";
import { CheckoutPage } from "../pages/checkout.page";
import { OrdersPage } from "../pages/orders.page";
import { ProductPage } from "../pages/product.page";
import { ReceiptPage } from "../pages/receipt.page";
import { ShopPage } from "../pages/shop.page";
import { loginAsCustomer } from "../support/login";

test("buys a product from shop through receipt", async ({ page }) => {
  await loginAsCustomer(page);

  const shop = new ShopPage(page);
  const product = new ProductPage(page);
  const cart = new CartPage(page);
  const checkout = new CheckoutPage(page);
  const receipt = new ReceiptPage(page);
  const orders = new OrdersPage(page);

  await shop.goto();
  await shop.expectLoaded();
  await shop.expectProductGrid();
  await shop.openFirstProduct();

  await product.expectLoaded();
  await product.addToCart();

  await cart.expectHasItems();
  await cart.goToCheckout();

  await checkout.expectLoaded();
  await checkout.placeShipOrder();

  await receipt.expectLoaded();

  await orders.gotoCustomer();
  await orders.expectCustomerHasOrders();
});
