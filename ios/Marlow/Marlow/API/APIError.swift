import Foundation

struct APIError: Error, LocalizedError, Equatable {
  let status: Int
  let message: String

  var errorDescription: String? { message }
}
