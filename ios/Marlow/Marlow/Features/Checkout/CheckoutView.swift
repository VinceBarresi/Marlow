import SwiftUI

struct CheckoutView: View {
  @Environment(\.dismiss) private var dismiss

  @State private var shipName = "Mina Adler"
  @State private var shipLine1 = "100 Congress Ave"
  @State private var shipCity = "Austin"
  @State private var shipRegion = "TX"
  @State private var shipPostalCode = "78701"
  @State private var savedCards: [PaymentMethod] = []
  @State private var selectedPaymentMethodId = ""
  @State private var cardNumber = "4242424242424242"
  @State private var expMonth = "12"
  @State private var expYear = String(Calendar.current.component(.year, from: Date()) + 2)
  @State private var cvc = "123"
  @State private var saveCard = false
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

        Section("Payment") {
          if !savedCards.isEmpty {
            Picker("Saved card", selection: $selectedPaymentMethodId) {
              Text("New card").tag("")
              ForEach(savedCards) { method in
                Text("\(method.card.brand.uppercased()) ···· \(method.card.last4)")
                  .tag(method.id)
              }
            }
            .accessibilityIdentifier("checkout-saved-card")
          }

          if selectedPaymentMethodId.isEmpty {
            TextField("Card number", text: $cardNumber)
              .keyboardType(.numberPad)
              .accessibilityIdentifier("checkout-card-number")
            TextField("Exp month", text: $expMonth)
              .keyboardType(.numberPad)
              .accessibilityIdentifier("checkout-card-exp-month")
            TextField("Exp year", text: $expYear)
              .keyboardType(.numberPad)
              .accessibilityIdentifier("checkout-card-exp-year")
            SecureField("CVC", text: $cvc)
              .keyboardType(.numberPad)
              .accessibilityIdentifier("checkout-card-cvc")
            Toggle("Save this card", isOn: $saveCard)
              .accessibilityIdentifier("checkout-save-card")
          }
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
    .task { await loadCards() }
  }

  private var isValid: Bool {
    let addressOk = ![shipName, shipLine1, shipCity, shipRegion, shipPostalCode]
      .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
      .contains(where: \.isEmpty)
    if !selectedPaymentMethodId.isEmpty { return addressOk }
    return addressOk
      && !cardNumber.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
      && Int(expMonth) != nil
      && Int(expYear) != nil
      && !cvc.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
  }

  private func loadCards() async {
    do {
      savedCards = try await APIClient.shared.paymentMethods()
      if selectedPaymentMethodId.isEmpty, let first = savedCards.first {
        selectedPaymentMethodId = first.id
      }
    } catch {
      // Account may have no cards yet.
    }
  }

  private func submit() async {
    isSubmitting = true
    errorMessage = nil
    defer { isSubmitting = false }

    let paymentMethodId = selectedPaymentMethodId.isEmpty ? nil : selectedPaymentMethodId
    let card: CardInput? = paymentMethodId == nil
      ? CardInput(
        number: cardNumber.trimmingCharacters(in: .whitespacesAndNewlines),
        expMonth: Int(expMonth) ?? 0,
        expYear: Int(expYear) ?? 0,
        cvc: cvc.trimmingCharacters(in: .whitespacesAndNewlines)
      )
      : nil

    let body = CheckoutRequest(
      shipName: shipName.trimmingCharacters(in: .whitespacesAndNewlines),
      shipLine1: shipLine1.trimmingCharacters(in: .whitespacesAndNewlines),
      shipCity: shipCity.trimmingCharacters(in: .whitespacesAndNewlines),
      shipRegion: shipRegion.trimmingCharacters(in: .whitespacesAndNewlines),
      shipPostalCode: shipPostalCode.trimmingCharacters(in: .whitespacesAndNewlines),
      paymentMethodId: paymentMethodId,
      card: card,
      saveCard: paymentMethodId == nil ? saveCard : nil
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
