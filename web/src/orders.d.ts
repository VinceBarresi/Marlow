declare module "orders/Cart" {
  export function CartPage(): import("react").ReactElement;
}

declare module "orders/Checkout" {
  export function Checkout(): import("react").ReactElement;
}

declare module "orders/Orders" {
  export function Orders(props: { staff?: boolean }): import("react").ReactElement;
}

declare module "orders/Order" {
  export function OrderPage(): import("react").ReactElement;
}

declare module "orders/Receipt" {
  export function Receipt(): import("react").ReactElement;
}
