import SwiftUI

struct OrdersView: View {
  @State private var orders: [OrderSummary] = []
  @State private var isLoading = true
  @State private var errorMessage: String?

  var body: some View {
    Group {
      if isLoading && orders.isEmpty {
        ProgressView()
      } else if orders.isEmpty, errorMessage == nil {
        ContentUnavailableView(
          "No orders yet",
          systemImage: "shippingbox",
          description: Text("Orders you place will show up here.")
        )
        .accessibilityElement(children: .combine)
        .accessibilityIdentifier("orders-empty")
      } else {
        List {
          if let errorMessage {
            Text(errorMessage).foregroundStyle(.red)
          }
          ForEach(orders) { order in
            NavigationLink(value: order.number) {
              VStack(alignment: .leading, spacing: 4) {
                Text(order.number)
                  .font(.headline)
                Text(order.status.replacingOccurrences(of: "_", with: " ").capitalized)
                  .font(.subheadline)
                  .foregroundStyle(.secondary)
                HStack {
                  Text("\(order.shipCity), \(order.shipRegion)")
                  Spacer()
                  Text(Money.format(cents: order.totalCents))
                }
                .font(.caption)
              }
              .padding(.vertical, 2)
            }
            .accessibilityIdentifier("order-\(order.number)")
          }
        }
      }
    }
    .navigationTitle("Orders")
    .navigationDestination(for: String.self) { number in
      OrderDetailView(number: number)
    }
    .refreshable { await load() }
    .task { await load() }
  }

  private func load() async {
    isLoading = true
    defer { isLoading = false }
    do {
      let list = try await APIClient.shared.orders()
      orders = list.orders
      errorMessage = nil
    } catch let error as APIError {
      errorMessage = error.message
    } catch {
      errorMessage = error.localizedDescription
    }
  }
}
