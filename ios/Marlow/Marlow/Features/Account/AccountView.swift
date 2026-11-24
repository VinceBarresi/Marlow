import SwiftUI

struct AccountView: View {
  @Environment(SessionStore.self) private var session
  @State private var isSigningOut = false
  @State private var cards: [PaymentMethod] = []
  @State private var cardNumber = "4242424242424242"
  @State private var expMonth = "12"
  @State private var expYear = String(Calendar.current.component(.year, from: Date()) + 2)
  @State private var cvc = "123"
  @State private var errorMessage: String?
  @State private var statusMessage: String?
  @State private var isSaving = false

  var body: some View {
    List {
      if let user = session.user {
        Section("Signed in") {
          LabeledContent("Name", value: user.name)
            .accessibilityIdentifier("account-name")
          LabeledContent("Email", value: user.email)
            .accessibilityIdentifier("account-email")
          LabeledContent("Role", value: user.role)
        }
      }

      Section("Saved cards") {
        if cards.isEmpty {
          Text("No cards on file.")
            .accessibilityIdentifier("account-cards-empty")
        } else {
          ForEach(cards) { method in
            HStack {
              Text("\(method.card.brand.uppercased()) ···· \(method.card.last4)")
              Spacer()
              Button("Remove", role: .destructive) {
                Task { await removeCard(method.id) }
              }
              .accessibilityIdentifier("account-card-remove-\(method.id)")
            }
            .accessibilityIdentifier("account-card-\(method.id)")
          }
        }
      }

      Section("Add card") {
        TextField("Card number", text: $cardNumber)
          .keyboardType(.numberPad)
          .accessibilityIdentifier("account-card-number")
        TextField("Exp month", text: $expMonth)
          .keyboardType(.numberPad)
          .accessibilityIdentifier("account-card-exp-month")
        TextField("Exp year", text: $expYear)
          .keyboardType(.numberPad)
          .accessibilityIdentifier("account-card-exp-year")
        SecureField("CVC", text: $cvc)
          .keyboardType(.numberPad)
          .accessibilityIdentifier("account-card-cvc")
        Button {
          Task { await saveCard() }
        } label: {
          if isSaving {
            ProgressView()
          } else {
            Text("Save card")
          }
        }
        .disabled(isSaving)
        .accessibilityIdentifier("account-card-save")
        if let errorMessage {
          Text(errorMessage)
            .foregroundStyle(.red)
            .accessibilityIdentifier("account-cards-error")
        }
        if let statusMessage {
          Text(statusMessage)
            .accessibilityIdentifier("account-cards-message")
        }
      }

      Section {
        Button(role: .destructive) {
          Task {
            isSigningOut = true
            defer { isSigningOut = false }
            await session.signOut()
          }
        } label: {
          if isSigningOut {
            ProgressView()
          } else {
            Text("Sign out")
          }
        }
        .disabled(isSigningOut)
        .accessibilityIdentifier("account-logout")
      }

      Section {
        Text("API \(AppConfig.apiBaseURL.absoluteString)")
          .font(.footnote)
          .foregroundStyle(.secondary)
      }
    }
    .navigationTitle("Account")
    .task { await loadCards() }
  }

  private func loadCards() async {
    do {
      cards = try await APIClient.shared.paymentMethods()
    } catch let error as APIError {
      errorMessage = error.message
    } catch {
      errorMessage = error.localizedDescription
    }
  }

  private func saveCard() async {
    isSaving = true
    errorMessage = nil
    statusMessage = nil
    defer { isSaving = false }
    let card = CardInput(
      number: cardNumber.trimmingCharacters(in: .whitespacesAndNewlines),
      expMonth: Int(expMonth) ?? 0,
      expYear: Int(expYear) ?? 0,
      cvc: cvc.trimmingCharacters(in: .whitespacesAndNewlines)
    )
    do {
      _ = try await APIClient.shared.createPaymentMethod(card: card)
      statusMessage = "Card saved."
      cvc = ""
      await loadCards()
    } catch let error as APIError {
      errorMessage = error.message
    } catch {
      errorMessage = error.localizedDescription
    }
  }

  private func removeCard(_ id: String) async {
    errorMessage = nil
    statusMessage = nil
    do {
      try await APIClient.shared.deletePaymentMethod(id: id)
      statusMessage = "Card removed."
      await loadCards()
    } catch let error as APIError {
      errorMessage = error.message
    } catch {
      errorMessage = error.localizedDescription
    }
  }
}
