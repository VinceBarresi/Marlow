import SwiftUI

struct CartView: View {
  @State private var cart: Cart?
  @State private var isLoading = true
  @State private var errorMessage: String?

  var body: some View {
    Group {
      if isLoading && cart == nil {
        ProgressView()
      } else if let cart, cart.items.isEmpty {
        ContentUnavailableView(
          "Your cart is empty",
          systemImage: "cart",
          description: Text("Browse the shop and add something.")
        )
        .accessibilityIdentifier("cart-empty")
      } else if let cart {
        List {
          ForEach(cart.items) { item in
            VStack(alignment: .leading, spacing: 4) {
              Text(item.name)
                .font(.headline)
              Text(item.sku)
                .font(.caption)
                .foregroundStyle(.secondary)
              HStack {
                Text("Qty \(item.quantity)")
                Spacer()
                Text(Money.format(cents: item.lineTotalCents))
              }
            }
            .accessibilityIdentifier("cart-item-\(item.sku)")
            .swipeActions {
              Button(role: .destructive) {
                Task { await remove(sku: item.sku) }
              } label: {
                Label("Remove", systemImage: "trash")
              }
            }
          }

          Section {
            HStack {
              Text("Subtotal")
              Spacer()
              Text(Money.format(cents: cart.subtotalCents))
                .font(.headline)
                .accessibilityIdentifier("cart-subtotal")
            }
          }

          if let errorMessage {
            Text(errorMessage).foregroundStyle(.red)
          }

          Section {
            NavigationLink("Checkout") {
              CheckoutView()
            }
            .accessibilityIdentifier("cart-checkout")
          }
        }
      } else if let errorMessage {
        ContentUnavailableView("Could not load cart", systemImage: "exclamationmark.triangle", description: Text(errorMessage))
      }
    }
    .navigationTitle("Cart")
    .refreshable { await load() }
    .task { await load() }
  }

  private func load() async {
    isLoading = true
    defer { isLoading = false }
    do {
      cart = try await APIClient.shared.cart()
      errorMessage = nil
    } catch let error as APIError {
      errorMessage = error.message
    } catch {
      errorMessage = error.localizedDescription
    }
  }

  private func remove(sku: String) async {
    do {
      try await APIClient.shared.removeCartItem(sku: sku)
      await load()
    } catch let error as APIError {
      errorMessage = error.message
    } catch {
      errorMessage = error.localizedDescription
    }
  }
}
