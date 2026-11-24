import Foundation

actor APIClient {
  static let shared = APIClient()

  private let session: URLSession
  private let decoder: JSONDecoder
  private let encoder: JSONEncoder
  private let baseURL: URL

  init(baseURL: URL = AppConfig.apiBaseURL) {
    self.baseURL = baseURL
    let config = URLSessionConfiguration.default
    config.httpCookieAcceptPolicy = .always
    config.httpShouldSetCookies = true
    config.httpCookieStorage = HTTPCookieStorage.shared
    self.session = URLSession(configuration: config)
    self.decoder = JSONDecoder()
    self.encoder = JSONEncoder()
  }

  func login(email: String, password: String) async throws -> User {
    let body = LoginRequest(email: email, password: password)
    let response: LoginResponse = try await request(
      method: "POST",
      path: "/api/login",
      body: body
    )
    return response.user
  }

  func logout() async throws {
    let _: LogoutResponse = try await request(method: "POST", path: "/api/logout")
    clearCookies()
  }

  func me() async throws -> User {
    let response: MeResponse = try await request(method: "GET", path: "/api/me")
    return response.user
  }

  func products(q: String? = nil, page: Int = 1, pageSize: Int = 24) async throws -> ProductList {
    var items: [URLQueryItem] = [
      URLQueryItem(name: "page", value: String(page)),
      URLQueryItem(name: "pageSize", value: String(pageSize)),
    ]
    if let q, !q.isEmpty {
      items.append(URLQueryItem(name: "q", value: q))
    }
    return try await request(method: "GET", path: "/api/products", query: items)
  }

  func product(sku: String) async throws -> Product {
    let response: ProductResponse = try await request(method: "GET", path: "/api/products/\(sku)")
    return response.product
  }

  func categories() async throws -> [Category] {
    let response: CategoryList = try await request(method: "GET", path: "/api/categories")
    return response.categories
  }

  func cart() async throws -> Cart {
    try await request(method: "GET", path: "/api/cart")
  }

  func setCartItem(sku: String, quantity: Int) async throws {
    let body = CartItemRequest(sku: sku, quantity: quantity)
    let _: CartItemResult = try await request(method: "PUT", path: "/api/cart/items", body: body)
  }

  func removeCartItem(sku: String) async throws {
    struct Ok: Decodable { let ok: Bool }
    let _: Ok = try await request(method: "DELETE", path: "/api/cart/items/\(sku)")
  }

  func checkout(_ body: CheckoutRequest) async throws -> CheckoutOrder {
    let response: CheckoutResponse = try await request(method: "POST", path: "/api/checkout", body: body)
    return response.order
  }

  func paymentMethods() async throws -> [PaymentMethod] {
    let response: PaymentMethodsResponse = try await request(method: "GET", path: "/api/payment-methods")
    return response.paymentMethods
  }

  func createPaymentMethod(card: CardInput) async throws -> PaymentMethod {
    struct Body: Encodable { let card: CardInput }
    let response: PaymentMethodResponse = try await request(
      method: "POST",
      path: "/api/payment-methods",
      body: Body(card: card)
    )
    return response.paymentMethod
  }

  func deletePaymentMethod(id: String) async throws {
    struct Deleted: Decodable { let id: String; let deleted: Bool }
    let _: Deleted = try await request(method: "DELETE", path: "/api/payment-methods/\(id)")
  }

  func orders(page: Int = 1, pageSize: Int = 20) async throws -> OrderList {
    let items = [
      URLQueryItem(name: "page", value: String(page)),
      URLQueryItem(name: "pageSize", value: String(pageSize)),
    ]
    return try await request(method: "GET", path: "/api/orders", query: items)
  }

  func order(number: String) async throws -> OrderDetail {
    let response: OrderDetailResponse = try await request(
      method: "GET",
      path: "/api/orders/\(number)"
    )
    return response.order
  }

  func shippingAccessToken() async throws -> ShippingAccessToken {
    try await request(method: "POST", path: "/api/shipping/access-token")
  }

  func tracking(trackingNumber: String, bearerToken: String) async throws -> TrackingInfo {
    let response: TrackingResponse = try await request(
      method: "GET",
      path: "/api/tracking/\(trackingNumber)",
      bearerToken: bearerToken
    )
    return response.tracking
  }

  func clearCookies() {
    guard let cookies = HTTPCookieStorage.shared.cookies(for: baseURL) else { return }
    for cookie in cookies {
      HTTPCookieStorage.shared.deleteCookie(cookie)
    }
  }

  private func request<T: Decodable>(
    method: String,
    path: String,
    query: [URLQueryItem] = [],
    body: (any Encodable)? = nil,
    bearerToken: String? = nil
  ) async throws -> T {
    guard var components = URLComponents(url: baseURL, resolvingAgainstBaseURL: false) else {
      throw APIError(status: -1, message: "Invalid base URL.")
    }
    components.path = path.hasPrefix("/") ? path : "/\(path)"
    if !query.isEmpty {
      components.queryItems = query
    }
    guard let url = components.url else {
      throw APIError(status: -1, message: "Invalid URL.")
    }

    var request = URLRequest(url: url)
    request.httpMethod = method
    if let bearerToken {
      request.setValue("Bearer \(bearerToken)", forHTTPHeaderField: "Authorization")
    }
    if let body {
      request.setValue("application/json", forHTTPHeaderField: "Content-Type")
      request.httpBody = try encoder.encode(AnyEncodable(body))
    }

    let (data, response) = try await session.data(for: request)
    guard let http = response as? HTTPURLResponse else {
      throw APIError(status: -1, message: "No HTTP response.")
    }

    if !(200..<300).contains(http.statusCode) {
      let message =
        (try? decoder.decode(APIErrorBody.self, from: data))?.error
        ?? HTTPURLResponse.localizedString(forStatusCode: http.statusCode)
      throw APIError(status: http.statusCode, message: message)
    }

    if data.isEmpty, T.self == Empty.self {
      return Empty() as! T
    }
    return try decoder.decode(T.self, from: data)
  }
}

private struct Empty: Decodable {}

private struct AnyEncodable: Encodable {
  private let encodeFunc: (Encoder) throws -> Void

  init(_ value: any Encodable) {
    self.encodeFunc = value.encode
  }

  func encode(to encoder: Encoder) throws {
    try encodeFunc(encoder)
  }
}
