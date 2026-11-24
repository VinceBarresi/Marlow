import SwiftUI

struct CheckoutView: View {
  @Environment(\.dismiss) private var dismiss

  @State private var shipName = "Mina Adler"
  @State private var shipLine1 = "100 Congress Ave"
  @State private var shipCity = "Austin"
  @State private var shipRegion = "TX"
  @State private var shipPostalCode = "78701"
  @State private var isSubmitting = false
  @State private var errorMessage: String?
  @State private var placedOrder: CheckoutOrder?

  var body: some View {
    Form {
      if let placedOrder {
        Section("Order placed") {
          Text(placedOrder.number)
            .font(.headline)
            .accessibilityIdentifier("checkout-order-number")
          Text(placedOrder.status.capitalized)
          Text(Money.format(cents: placedOrder.totalCents))
        }
        Section {
          Button("Done") { dismiss() }
        }
      } else {
        Section("Ship to") {
          TextField("Name", text: $shipName)
            .accessibilityIdentifier("checkout-name")
          TextField("Address", text: $shipLine1)
            .accessibilityIdentifier("checkout-line1")
          TextField("City", text: $shipCity)
            .accessibilityIdentifier("checkout-city")
          TextField("State", text: $shipRegion)
            .textInputAutocapitalization(.characters)
            .accessibilityIdentifier("checkout-region")
          TextField("ZIP", text: $shipPostalCode)
            .keyboardType(.numberPad)
            .accessibilityIdentifier("checkout-postal")
        }

        if let errorMessage {
          Section {
            Text(errorMessage)
              .foregroundStyle(.red)
              .accessibilityIdentifier("checkout-error")
          }
        }

        Section {
          Button {
            Task { await submit() }
          } label: {
            if isSubmitting {
              ProgressView().frame(maxWidth: .infinity)
            } else {
              Text("Place order").frame(maxWidth: .infinity)
            }
          }
          .disabled(isSubmitting || !isValid)
          .accessibilityIdentifier("checkout-submit")
        }
      }
    }
    .navigationTitle("Checkout")
    .navigationBarTitleDisplayMode(.inline)
  }

  private var isValid: Bool {
    ![shipName, shipLine1, shipCity, shipRegion, shipPostalCode]
      .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
      .contains(where: \.isEmpty)
  }

  private func submit() async {
    isSubmitting = true
    errorMessage = nil
    defer { isSubmitting = false }
    let body = CheckoutRequest(
      shipName: shipName.trimmingCharacters(in: .whitespacesAndNewlines),
      shipLine1: shipLine1.trimmingCharacters(in: .whitespacesAndNewlines),
      shipCity: shipCity.trimmingCharacters(in: .whitespacesAndNewlines),
      shipRegion: shipRegion.trimmingCharacters(in: .whitespacesAndNewlines),
      shipPostalCode: shipPostalCode.trimmingCharacters(in: .whitespacesAndNewlines)
    )
    do {
      placedOrder = try await APIClient.shared.checkout(body)
    } catch let error as APIError {
      errorMessage = error.message
    } catch {
      errorMessage = error.localizedDescription
    }
  }
}
