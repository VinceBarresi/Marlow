import Foundation

enum Money {
  private static let formatter: NumberFormatter = {
    let f = NumberFormatter()
    f.numberStyle = .currency
    f.currencyCode = "USD"
    return f
  }()

  static func format(cents: Int) -> String {
    formatter.string(from: NSNumber(value: Double(cents) / 100.0)) ?? "$0.00"
  }
}
