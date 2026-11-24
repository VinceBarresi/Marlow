import SwiftUI

struct RootView: View {
  @Environment(SessionStore.self) private var session

  var body: some View {
    Group {
      if session.isRestoring {
        ProgressView("Loading Marlow…")
      } else if session.isSignedIn {
        MainTabView()
      } else {
        LoginView()
      }
    }
  }
}

struct MainTabView: View {
  var body: some View {
    TabView {
      NavigationStack {
        ShopView()
      }
      .tabItem {
        Label("Shop", systemImage: "bag")
          .accessibilityIdentifier("tab-shop")
      }

      NavigationStack {
        CartView()
      }
      .tabItem {
        Label("Cart", systemImage: "cart")
          .accessibilityIdentifier("tab-cart")
      }

      NavigationStack {
        OrdersView()
      }
      .tabItem {
        Label("Orders", systemImage: "shippingbox")
          .accessibilityIdentifier("tab-orders")
      }

      NavigationStack {
        AccountView()
      }
      .tabItem {
        Label("Account", systemImage: "person")
          .accessibilityIdentifier("tab-account")
      }
    }
  }
}
