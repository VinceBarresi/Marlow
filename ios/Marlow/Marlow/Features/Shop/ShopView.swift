import SwiftUI

struct ShopView: View {
  @State private var products: [Product] = []
  @State private var query = ""
  @State private var isLoading = false
  @State private var errorMessage: String?
  @State private var total = 0

  var body: some View {
    List {
      if let errorMessage {
        Text(errorMessage)
          .foregroundStyle(.red)
      }

      ForEach(products) { product in
        NavigationLink(value: product.sku) {
          VStack(alignment: .leading, spacing: 4) {
            Text(product.name)
              .font(.headline)
            Text(product.category)
              .font(.subheadline)
              .foregroundStyle(.secondary)
            HStack {
              Text(Money.format(cents: product.priceCents))
              Spacer()
              Text("\(product.available) available")
                .font(.caption)
                .foregroundStyle(.secondary)
            }
          }
          .padding(.vertical, 4)
        }
        .accessibilityIdentifier("product-\(product.sku)")
      }
    }
    .navigationTitle("Shop")
    .navigationDestination(for: String.self) { sku in
      ProductView(sku: sku)
    }
    .searchable(text: $query, prompt: "Search products")
    .accessibilityIdentifier("shop-search")
    .overlay {
      if isLoading && products.isEmpty {
        ProgressView()
      }
    }
    .refreshable { await load() }
    .task(id: query) {
      try? await Task.sleep(for: .milliseconds(300))
      guard !Task.isCancelled else { return }
      await load()
    }
    .toolbar {
      if total > 0 {
        ToolbarItem(placement: .topBarTrailing) {
          Text("\(total)")
            .foregroundStyle(.secondary)
            .accessibilityIdentifier("shop-total")
        }
      }
    }
  }

  private func load() async {
    isLoading = true
    defer { isLoading = false }
    do {
      let list = try await APIClient.shared.products(q: query.isEmpty ? nil : query)
      products = list.products
      total = list.total
      errorMessage = nil
    } catch let error as APIError {
      errorMessage = error.message
    } catch {
      errorMessage = error.localizedDescription
    }
  }
}
