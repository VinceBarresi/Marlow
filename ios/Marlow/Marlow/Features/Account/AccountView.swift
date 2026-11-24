import SwiftUI

struct AccountView: View {
  @Environment(SessionStore.self) private var session
  @State private var isSigningOut = false

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
  }
}
