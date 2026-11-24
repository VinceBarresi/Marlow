import { accountScreen } from "../screens/account.screen.js";
import { loginScreen } from "../screens/login.screen.js";
import { shopScreen } from "../screens/shop.screen.js";

describe("Marlow login", () => {
  it("signs in as the seeded customer and opens the shop", async () => {
    await loginScreen.signIn("customer@marlow.test", "datalab");
    await shopScreen.waitForLoaded();
    await expect(shopScreen.search).toBeDisplayed();
  });

  it("shows account details and can sign out", async () => {
    await accountScreen.open();
    await expect(accountScreen.email).toBeDisplayed();
    await accountScreen.logout.click();
    await loginScreen.waitForLoaded();
    await expect(loginScreen.submit).toBeDisplayed();
  });
});
