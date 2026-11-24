import SwiftUI

struct ProductView: View {
  let sku: String

  @State private var product: Product?
  @State private var quantity = 1
  @State private var isLoading = true
  @State private var isAdding = false
  @State private var message: String?
  @State private var errorMessage: String?

  var body: some View {
    Group {
      if isLoading {
        ProgressView()
      } else if let product {
        List {
          Section {
            if let url = product.absoluteImageURL {
              AsyncImage(url: url) { phase in
                switch phase {
                case .success(let image):
                  image
                    .resizable()
                    .scaledToFit()
                default:
                  ProgressView()
                }
              }
              .frame(maxWidth: .infinity)
              .accessibilityIdentifier("product-image")
            }
            Text(product.name)
              .font(.title2.bold())
              .accessibilityIdentifier("product-name")
            Text(product.category)
              .foregroundStyle(.secondary)
            Text(product.description)
            Text(Money.format(cents: product.priceCents))
              .font(.headline)
              .accessibilityIdentifier("product-price")
            Text("\(product.available) available")
              .font(.subheadline)
              .foregroundStyle(.secondary)
          }

          Section("Add to cart") {
            Stepper("Quantity: \(quantity)", value: $quantity, in: 1...max(1, product.available))
              .accessibilityIdentifier("product-qty")
            Button {
              Task { await addToCart() }
            } label: {
              if isAdding {
                ProgressView()
              } else {
                Text("Add to cart")
              }
            }
            .disabled(isAdding || product.available < 1)
            .accessibilityIdentifier("product-add")
          }

          if let message {
            Section {
              Text(message)
                .foregroundStyle(.green)
            }
          }
          if let errorMessage {
            Section {
              Text(errorMessage)
                .foregroundStyle(.red)
            }
          }
        }
      } else {
        ContentUnavailableView("Product not found", systemImage: "bag")
      }
    }
    .navigationTitle(sku)
    .navigationBarTitleDisplayMode(.inline)
    .task { await load() }
  }

  private func load() async {
    isLoading = true
    defer { isLoading = false }
    do {
      product = try await APIClient.shared.product(sku: sku)
      errorMessage = nil
    } catch let error as APIError {
      errorMessage = error.message
      product = nil
    } catch {
      errorMessage = error.localizedDescription
      product = nil
    }
  }

  private func addToCart() async {
    isAdding = true
    message = nil
    errorMessage = nil
    defer { isAdding = false }
    do {
      try await APIClient.shared.setCartItem(sku: sku, quantity: quantity)
      message = "Added to cart."
    } catch let error as APIError {
      errorMessage = error.message
    } catch {
      errorMessage = error.localizedDescription
    }
  }
}
