export class CartScreen {
  get tabCart() {
    return $("~tab-cart");
  }

  get empty() {
    return $("~cart-empty");
  }

  get checkout() {
    return $("~cart-checkout");
  }

  async open() {
    await this.tabCart.click();
  }
}

export const cartScreen = new CartScreen();
