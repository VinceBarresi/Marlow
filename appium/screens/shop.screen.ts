export class ShopScreen {
  get search() {
    return $("~shop-search");
  }

  get tabShop() {
    return $("~tab-shop");
  }

  product(sku: string) {
    return $(`~product-${sku}`);
  }

  async waitForLoaded() {
    await this.search.waitForDisplayed({ timeout: 30000 });
  }
}

export const shopScreen = new ShopScreen();
