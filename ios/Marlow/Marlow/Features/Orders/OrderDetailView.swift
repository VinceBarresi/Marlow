import SwiftUI

struct OrderDetailView: View {
  let number: String

  @State private var order: OrderDetail?
  @State private var isLoading = true
  @State private var errorMessage: String?

  var body: some View {
    Group {
      if isLoading {
        ProgressView()
      } else if let order {
        List {
          Section("Status") {
            Text(order.status.replacingOccurrences(of: "_", with: " ").capitalized)
              .accessibilityIdentifier("order-status")
            Text("Placed \(order.placedAt)")
              .font(.caption)
              .foregroundStyle(.secondary)
          }

          Section("Ship to") {
            Text(order.shipTo.name)
            Text(order.shipTo.line1)
            Text("\(order.shipTo.city), \(order.shipTo.region) \(order.shipTo.postalCode)")
          }

          Section("Items") {
            ForEach(order.lines) { line in
              HStack {
                VStack(alignment: .leading) {
                  Text(line.name)
                  Text("Qty \(line.quantity)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                }
                Spacer()
                Text(Money.format(cents: line.lineTotalCents))
              }
            }
          }

          Section("Totals") {
            labeled("Subtotal", order.subtotalCents)
            labeled("Shipping", order.shippingCents)
            labeled("Tax", order.taxCents)
            labeled("Total", order.totalCents)
          }

          if !order.events.isEmpty {
            Section("Timeline") {
              ForEach(order.events) { event in
                VStack(alignment: .leading, spacing: 2) {
                  Text(event.status.replacingOccurrences(of: "_", with: " ").capitalized)
                    .font(.subheadline.bold())
                  Text(event.note)
                    .font(.caption)
                  Text(event.createdAt)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                }
              }
            }
          }
        }
      } else {
        ContentUnavailableView(
          "Order not found",
          systemImage: "shippingbox",
          description: Text(errorMessage ?? "Unknown error")
        )
      }
    }
    .navigationTitle(number)
    .navigationBarTitleDisplayMode(.inline)
    .task { await load() }
  }

  private func labeled(_ title: String, _ cents: Int) -> some View {
    HStack {
      Text(title)
      Spacer()
      Text(Money.format(cents: cents))
        .font(title == "Total" ? .headline : .body)
    }
  }

  private func load() async {
    isLoading = true
    defer { isLoading = false }
    do {
      order = try await APIClient.shared.order(number: number)
      errorMessage = nil
    } catch let error as APIError {
      errorMessage = error.message
      order = nil
    } catch {
      errorMessage = error.localizedDescription
      order = nil
    }
  }
}
