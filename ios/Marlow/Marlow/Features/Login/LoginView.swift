import SwiftUI

struct LoginView: View {
  @Environment(SessionStore.self) private var session
  @State private var email = "customer@marlow.test"
  @State private var password = "datalab"
  @State private var isSubmitting = false
  @State private var errorMessage: String?

  var body: some View {
    NavigationStack {
      Form {
        Section {
          TextField("Email", text: $email)
            .textContentType(.username)
            .textInputAutocapitalization(.never)
            .keyboardType(.emailAddress)
            .autocorrectionDisabled()
            .accessibilityIdentifier("login-email")

          SecureField("Password", text: $password)
            .textContentType(.password)
            .accessibilityIdentifier("login-password")
        }

        if let errorMessage {
          Section {
            Text(errorMessage)
              .foregroundStyle(.red)
              .accessibilityIdentifier("login-error")
          }
        }

        Section {
          Button {
            Task { await submit() }
          } label: {
            if isSubmitting {
              ProgressView()
                .frame(maxWidth: .infinity)
            } else {
              Text("Sign in")
                .frame(maxWidth: .infinity)
            }
          }
          .disabled(isSubmitting || email.isEmpty || password.isEmpty)
          .accessibilityIdentifier("login-submit")
        }

        Section {
          Text("Use a seeded customer account against the local API at \(AppConfig.apiBaseURL.absoluteString).")
            .font(.footnote)
            .foregroundStyle(.secondary)
        }
      }
      .navigationTitle("Marlow")
    }
  }

  private func submit() async {
    isSubmitting = true
    errorMessage = nil
    defer { isSubmitting = false }
    do {
      try await session.signIn(email: email.trimmingCharacters(in: .whitespacesAndNewlines), password: password)
    } catch let error as APIError {
      errorMessage = error.message
    } catch {
      errorMessage = error.localizedDescription
    }
  }
}
