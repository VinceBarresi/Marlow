import Foundation
import Observation

@MainActor
@Observable
final class SessionStore {
  private(set) var user: User?
  private(set) var isRestoring = true
  private(set) var lastError: String?

  var isSignedIn: Bool { user != nil }

  func restore() async {
    isRestoring = true
    defer { isRestoring = false }
    do {
      user = try await APIClient.shared.me()
      lastError = nil
    } catch let error as APIError where error.status == 401 {
      user = nil
      lastError = nil
    } catch {
      user = nil
      lastError = error.localizedDescription
    }
  }

  func signIn(email: String, password: String) async throws {
    user = try await APIClient.shared.login(email: email, password: password)
    lastError = nil
  }

  func signOut() async {
    do {
      try await APIClient.shared.logout()
    } catch {
      await APIClient.shared.clearCookies()
    }
    user = nil
  }
}
