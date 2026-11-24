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
  let imageId: String?
  let imageUrl: String?

  var absoluteImageURL: URL? {
    guard let imageUrl, !imageUrl.isEmpty else { return nil }
    if let absolute = URL(string: imageUrl), absolute.scheme != nil {
      return absolute
    }
    return URL(string: imageUrl, relativeTo: AppConfig.apiBaseURL)?.absoluteURL
  }
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

struct CardInput: Encodable, Sendable {
  let number: String
  let expMonth: Int
  let expYear: Int
  let cvc: String
}

struct PaymentCard: Codable, Equatable, Sendable {
  let brand: String
  let last4: String
  let expMonth: Int
  let expYear: Int
  let fingerprint: String?
}

struct PaymentMethod: Codable, Identifiable, Equatable, Sendable {
  let id: String
  let card: PaymentCard
}

struct PaymentMethodsResponse: Decodable, Sendable {
  let paymentMethods: [PaymentMethod]
}

struct PaymentMethodResponse: Decodable, Sendable {
  let paymentMethod: PaymentMethod
}

struct CheckoutRequest: Encodable, Sendable {
  let fulfillment: String
  let shipName: String
  let shipLine1: String
  let shipCity: String
  let shipRegion: String
  let shipPostalCode: String
  let shipCountry: String
  let paymentMethodId: String?
  let card: CardInput?
  let saveCard: Bool?

  init(
    shipName: String,
    shipLine1: String,
    shipCity: String,
    shipRegion: String,
    shipPostalCode: String,
    shipCountry: String = "US",
    paymentMethodId: String? = nil,
    card: CardInput? = nil,
    saveCard: Bool? = nil
  ) {
    self.fulfillment = "ship"
    self.shipName = shipName
    self.shipLine1 = shipLine1
    self.shipCity = shipCity
    self.shipRegion = shipRegion
    self.shipPostalCode = shipPostalCode
    self.shipCountry = shipCountry
    self.paymentMethodId = paymentMethodId
    self.card = card
    self.saveCard = saveCard
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

struct TrackingScan: Codable, Equatable, Identifiable, Sendable {
  var id: String { "\(status)-\(happenedAt)-\(message)" }
  let status: String
  let location: String
  let message: String
  let happenedAt: String
}

struct Shipment: Codable, Equatable, Sendable {
  let carrier: String
  let service: String
  let trackingNumber: String
  let status: String
  let shippedAt: String?
  let estimatedDelivery: String?
  let deliveredAt: String?
  let scans: [TrackingScan]?
}

struct TrackingInfo: Codable, Equatable, Sendable {
  let trackingNumber: String
  let carrier: String
  let service: String
  let status: String
  let shippedAt: String?
  let estimatedDelivery: String?
  let deliveredAt: String?
  let scans: [TrackingScan]
}

struct ShippingAccessToken: Decodable, Sendable {
  let accessToken: String
  let tokenType: String
  let expiresIn: Int
}

struct TrackingResponse: Decodable, Sendable {
  let tracking: TrackingInfo
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
  let shipment: Shipment?
}

struct OrderDetailResponse: Decodable, Sendable {
  let order: OrderDetail
}

struct APIErrorBody: Decodable, Sendable {
  let error: String?
}
