import Foundation

struct User: Codable, Equatable, Sendable {
  let id: String
  let email: String
  let name: String
  let role: String
}

struct LoginRequest: Encodable, Sendable {
  let email: String
  let password: String
}

struct LoginResponse: Decodable, Sendable {
  let user: User
}

struct MeResponse: Decodable, Sendable {
  let user: User
}

struct LogoutResponse: Decodable, Sendable {
  let ok: Bool
}

struct Product: Codable, Identifiable, Equatable, Sendable {
  var id: String { sku }
  let sku: String
  let name: String
  let category: String
  let description: String
  let priceCents: Int
  let onHand: Int
  let reserved: Int
  let available: Int
}

struct ProductList: Decodable, Sendable {
  let products: [Product]
  let page: Int
  let pageSize: Int
  let total: Int
}

struct ProductResponse: Decodable, Sendable {
  let product: Product
}

struct Category: Codable, Identifiable, Equatable, Sendable {
  var id: String { category }
  let category: String
  let products: Int
}

struct CategoryList: Decodable, Sendable {
  let categories: [Category]
}

struct CartItem: Codable, Identifiable, Equatable, Sendable {
  var id: String { sku }
  let sku: String
  let name: String
  let priceCents: Int
  let quantity: Int
  let available: Int
  let lineTotalCents: Int
}

struct Cart: Codable, Equatable, Sendable {
  let items: [CartItem]
  let subtotalCents: Int
}

struct CartItemRequest: Encodable, Sendable {
  let sku: String
  let quantity: Int
}

struct CartItemResult: Decodable, Sendable {
  let ok: Bool
  let sku: String
  let quantity: Int
}

struct CheckoutRequest: Encodable, Sendable {
  let fulfillment: String
  let shipName: String
  let shipLine1: String
  let shipCity: String
  let shipRegion: String
  let shipPostalCode: String
  let shipCountry: String

  init(
    shipName: String,
    shipLine1: String,
    shipCity: String,
    shipRegion: String,
    shipPostalCode: String,
    shipCountry: String = "US"
  ) {
    self.fulfillment = "ship"
    self.shipName = shipName
    self.shipLine1 = shipLine1
    self.shipCity = shipCity
    self.shipRegion = shipRegion
    self.shipPostalCode = shipPostalCode
    self.shipCountry = shipCountry
  }
}

struct CheckoutOrder: Codable, Equatable, Sendable {
  let number: String
  let status: String
  let subtotalCents: Int
  let shippingCents: Int
  let taxCents: Int
  let totalCents: Int
}

struct CheckoutResponse: Decodable, Sendable {
  let order: CheckoutOrder
}

struct OrderSummary: Codable, Identifiable, Equatable, Sendable {
  var id: String { number }
  let number: String
  let status: String
  let placedAt: String
  let totalCents: Int
  let shipCity: String
  let shipRegion: String
  let customerEmail: String
  let lineCount: Int
}

struct OrderList: Decodable, Sendable {
  let orders: [OrderSummary]
  let page: Int
  let pageSize: Int
  let total: Int
}

struct ShipTo: Codable, Equatable, Sendable {
  let name: String
  let line1: String
  let city: String
  let region: String
  let postalCode: String
  let country: String
}

struct OrderLine: Codable, Identifiable, Equatable, Sendable {
  var id: String { sku }
  let sku: String
  let name: String
  let quantity: Int
  let unitPriceCents: Int
  let lineTotalCents: Int
}

struct OrderEvent: Codable, Identifiable, Equatable, Sendable {
  var id: String { "\(status)-\(createdAt)-\(note)" }
  let status: String
  let note: String
  let createdAt: String
  let actorEmail: String?
}

struct OrderDetail: Codable, Equatable, Sendable {
  let number: String
  let status: String
  let placedAt: String
  let subtotalCents: Int
  let shippingCents: Int
  let taxCents: Int
  let totalCents: Int
  let shipTo: ShipTo
  let lines: [OrderLine]
  let events: [OrderEvent]
}

struct OrderDetailResponse: Decodable, Sendable {
  let order: OrderDetail
}

struct APIErrorBody: Decodable, Sendable {
  let error: String?
}
