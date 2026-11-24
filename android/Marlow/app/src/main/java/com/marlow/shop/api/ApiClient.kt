package com.marlow.shop.api

import com.marlow.shop.config.AppConfig
import com.marlow.shop.model.APIErrorBody
import com.marlow.shop.model.CardInput
import com.marlow.shop.model.Cart
import com.marlow.shop.model.CartItemRequest
import com.marlow.shop.model.CartItemResult
import com.marlow.shop.model.Category
import com.marlow.shop.model.CategoryList
import com.marlow.shop.model.CheckoutOrder
import com.marlow.shop.model.CheckoutRequest
import com.marlow.shop.model.CheckoutResponse
import com.marlow.shop.model.CreatePaymentMethodRequest
import com.marlow.shop.model.DeletedPaymentMethod
import com.marlow.shop.model.LoginRequest
import com.marlow.shop.model.LoginResponse
import com.marlow.shop.model.LogoutResponse
import com.marlow.shop.model.MeResponse
import com.marlow.shop.model.OkResponse
import com.marlow.shop.model.OrderDetail
import com.marlow.shop.model.OrderDetailResponse
import com.marlow.shop.model.OrderList
import com.marlow.shop.model.PaymentMethod
import com.marlow.shop.model.PaymentMethodResponse
import com.marlow.shop.model.PaymentMethodsResponse
import com.marlow.shop.model.Product
import com.marlow.shop.model.ProductList
import com.marlow.shop.model.ProductResponse
import com.marlow.shop.model.ShippingAccessToken
import com.marlow.shop.model.TrackingInfo
import com.marlow.shop.model.TrackingResponse
import com.marlow.shop.model.User
import java.net.CookieManager
import java.net.CookiePolicy
import java.net.URI
import java.net.URLEncoder
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import okhttp3.JavaNetCookieJar
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody

class ApiClient(
  private val baseUrl: String = AppConfig.apiBaseUrl,
) {
  private val json = Json {
    ignoreUnknownKeys = true
    encodeDefaults = true
  }

  private val cookieManager = CookieManager().apply {
    setCookiePolicy(CookiePolicy.ACCEPT_ALL)
  }

  private val http = OkHttpClient.Builder()
    .cookieJar(JavaNetCookieJar(cookieManager))
    .build()

  private val jsonMedia = "application/json; charset=utf-8".toMediaType()

  suspend fun login(email: String, password: String): User =
    decodePost<LoginRequest, LoginResponse>("/api/login", LoginRequest(email, password)).user

  suspend fun logout() {
    decodePostEmpty("/api/logout")
    clearCookies()
  }

  suspend fun me(): User = decodeGet<MeResponse>("/api/me").user

  suspend fun products(q: String? = null, page: Int = 1, pageSize: Int = 24): ProductList {
    val query = buildList {
      add("page" to page.toString())
      add("pageSize" to pageSize.toString())
      if (!q.isNullOrBlank()) add("q" to q)
    }
    return decodeGet<ProductList>("/api/products", query)
  }

  suspend fun product(sku: String): Product =
    decodeGet<ProductResponse>("/api/products/${enc(sku)}").product

  suspend fun categories(): List<Category> =
    decodeGet<CategoryList>("/api/categories").categories

  suspend fun cart(): Cart = decodeGet<Cart>("/api/cart")

  suspend fun setCartItem(sku: String, quantity: Int) {
    decodePut<CartItemRequest, CartItemResult>("/api/cart/items", CartItemRequest(sku, quantity))
  }

  suspend fun removeCartItem(sku: String) {
    decodeDelete<OkResponse>("/api/cart/items/${enc(sku)}")
  }

  suspend fun checkout(body: CheckoutRequest): CheckoutOrder =
    decodePost<CheckoutRequest, CheckoutResponse>("/api/checkout", body).order

  suspend fun paymentMethods(): List<PaymentMethod> =
    decodeGet<PaymentMethodsResponse>("/api/payment-methods").paymentMethods

  suspend fun createPaymentMethod(card: CardInput): PaymentMethod =
    decodePost<CreatePaymentMethodRequest, PaymentMethodResponse>(
      "/api/payment-methods",
      CreatePaymentMethodRequest(card),
    ).paymentMethod

  suspend fun deletePaymentMethod(id: String) {
    decodeDelete<DeletedPaymentMethod>("/api/payment-methods/${enc(id)}")
  }

  suspend fun orders(page: Int = 1, pageSize: Int = 20): OrderList {
    val query = listOf("page" to page.toString(), "pageSize" to pageSize.toString())
    return decodeGet<OrderList>("/api/orders", query)
  }

  suspend fun order(number: String): OrderDetail =
    decodeGet<OrderDetailResponse>("/api/orders/${enc(number)}").order

  suspend fun shippingAccessToken(): ShippingAccessToken =
    decodePostEmptyTyped<ShippingAccessToken>("/api/shipping/access-token")

  suspend fun tracking(trackingNumber: String, bearerToken: String): TrackingInfo =
    decodeGet<TrackingResponse>(
      "/api/tracking/${enc(trackingNumber)}",
      bearerToken = bearerToken,
    ).tracking

  fun clearCookies() {
    val store = cookieManager.cookieStore
    store.cookies.toList().forEach { store.remove(URI.create(baseUrl), it) }
  }

  private fun enc(value: String): String =
    URLEncoder.encode(value, Charsets.UTF_8.name()).replace("+", "%20")

  private suspend inline fun <reified T> decodeGet(
    path: String,
    query: List<Pair<String, String>> = emptyList(),
    bearerToken: String? = null,
  ): T = execute(method = "GET", path = path, bodyJson = null, query = query, bearerToken = bearerToken)

  private suspend inline fun <reified B, reified T> decodePost(path: String, body: B): T =
    execute(method = "POST", path = path, bodyJson = json.encodeToString(body))

  private suspend fun decodePostEmpty(path: String) {
    execute<LogoutResponse>(method = "POST", path = path, bodyJson = null)
  }

  private suspend inline fun <reified T> decodePostEmptyTyped(path: String): T =
    execute(method = "POST", path = path, bodyJson = null)

  private suspend inline fun <reified B, reified T> decodePut(path: String, body: B): T =
    execute(method = "PUT", path = path, bodyJson = json.encodeToString(body))

  private suspend inline fun <reified T> decodeDelete(path: String): T =
    execute(method = "DELETE", path = path, bodyJson = null)

  private suspend inline fun <reified T> execute(
    method: String,
    path: String,
    bodyJson: String?,
    query: List<Pair<String, String>> = emptyList(),
    bearerToken: String? = null,
  ): T = withContext(Dispatchers.IO) {
    val qs = if (query.isEmpty()) {
      ""
    } else {
      query.joinToString("&", prefix = "?") { (k, v) -> "${enc(k)}=${enc(v)}" }
    }
    val builder = Request.Builder().url("$baseUrl$path$qs")
    if (bearerToken != null) {
      builder.header("Authorization", "Bearer $bearerToken")
    }
    val reqBody = when {
      bodyJson != null -> bodyJson.toRequestBody(jsonMedia)
      method == "POST" || method == "PUT" || method == "DELETE" -> ByteArray(0).toRequestBody(null)
      else -> null
    }
    if (bodyJson != null) {
      builder.header("Content-Type", "application/json")
    }
    builder.method(method, reqBody)
    http.newCall(builder.build()).execute().use { response ->
      val text = response.body?.string().orEmpty()
      if (!response.isSuccessful) {
        val message = runCatching {
          json.decodeFromString<APIErrorBody>(text).error
        }.getOrNull() ?: response.message.ifBlank { "HTTP ${response.code}" }
        throw ApiError(response.code, message ?: "HTTP ${response.code}")
      }
      json.decodeFromString(text)
    }
  }
}
