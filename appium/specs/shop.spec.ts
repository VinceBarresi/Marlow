import { cartScreen } from "../screens/cart.screen.js";
import { loginScreen } from "../screens/login.screen.js";
import { shopScreen } from "../screens/shop.screen.js";

describe("Marlow iOS shop", () => {
  before(async () => {
    await loginScreen.signIn("customer@marlow.test", "datalab");
    await shopScreen.waitForLoaded();
  });

  it("shows the shop search field after login", async () => {
    await expect(shopScreen.search).toBeDisplayed();
  });

  it("opens an empty cart for a fresh customer session", async () => {
    await cartScreen.open();
    await cartScreen.empty.waitForDisplayed({ timeout: 15000 });
    await expect(cartScreen.empty).toBeDisplayed();
  });
});
