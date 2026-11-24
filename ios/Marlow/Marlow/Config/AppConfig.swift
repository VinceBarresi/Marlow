import Foundation

enum AppConfig {
  /// Simulator reaches the host API on loopback. Physical devices need your Mac's LAN IP.
  static var apiBaseURL: URL {
    if let override = ProcessInfo.processInfo.environment["MARLOW_API_BASE"],
       let url = URL(string: override)
    {
      return url
    }
    return URL(string: "http://127.0.0.1:4000")!
  }
}
