export class CartScreen {
  get tabCart() {
    return $("~tab-cart");
  }

  get empty() {
    // ContentUnavailableView can expose duplicate nodes; take the first match.
    return $$("~cart-empty")[0];
  }

  get checkout() {
    return $("~cart-checkout");
  }

  async open() {
    await this.tabCart.click();
  }
}

export const cartScreen = new CartScreen();
