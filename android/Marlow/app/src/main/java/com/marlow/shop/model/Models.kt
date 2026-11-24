package com.marlow.shop.model

import kotlinx.serialization.Serializable

@Serializable
data class User(
  val id: String,
  val email: String,
  val name: String,
  val role: String,
)

@Serializable
data class LoginRequest(val email: String, val password: String)

@Serializable
data class LoginResponse(val user: User)

@Serializable
data class MeResponse(val user: User)

@Serializable
data class LogoutResponse(val ok: Boolean)

@Serializable
data class Product(
  val sku: String,
  val name: String,
  val category: String,
  val description: String,
  val priceCents: Int,
  val onHand: Int,
  val reserved: Int,
  val available: Int,
)

@Serializable
data class ProductList(
  val products: List<Product>,
  val page: Int,
  val pageSize: Int,
  val total: Int,
)

@Serializable
data class ProductResponse(val product: Product)

@Serializable
data class Category(val category: String, val products: Int)

@Serializable
data class CategoryList(val categories: List<Category>)

@Serializable
data class CartItem(
  val sku: String,
  val name: String,
  val priceCents: Int,
  val quantity: Int,
  val available: Int,
  val lineTotalCents: Int,
)

@Serializable
data class Cart(
  val items: List<CartItem>,
  val subtotalCents: Int,
)

@Serializable
data class CartItemRequest(val sku: String, val quantity: Int)

@Serializable
data class CartItemResult(val ok: Boolean, val sku: String, val quantity: Int)

@Serializable
data class CardInput(
  val number: String,
  val expMonth: Int,
  val expYear: Int,
  val cvc: String,
)

@Serializable
data class PaymentCard(
  val brand: String,
  val last4: String,
  val expMonth: Int,
  val expYear: Int,
  val fingerprint: String? = null,
)

@Serializable
data class PaymentMethod(
  val id: String,
  val card: PaymentCard,
)

@Serializable
data class PaymentMethodsResponse(val paymentMethods: List<PaymentMethod>)

@Serializable
data class PaymentMethodResponse(val paymentMethod: PaymentMethod)

@Serializable
data class CreatePaymentMethodRequest(val card: CardInput)

@Serializable
data class CheckoutRequest(
  val fulfillment: String = "ship",
  val shipName: String,
  val shipLine1: String,
  val shipCity: String,
  val shipRegion: String,
  val shipPostalCode: String,
  val shipCountry: String = "US",
  val paymentMethodId: String? = null,
  val card: CardInput? = null,
  val saveCard: Boolean? = null,
)

@Serializable
data class CheckoutOrder(
  val number: String,
  val status: String,
  val subtotalCents: Int,
  val shippingCents: Int,
  val taxCents: Int,
  val totalCents: Int,
)

@Serializable
data class CheckoutResponse(val order: CheckoutOrder)

@Serializable
data class OrderSummary(
  val number: String,
  val status: String,
  val placedAt: String,
  val totalCents: Int,
  val shipCity: String,
  val shipRegion: String,
  val customerEmail: String,
  val lineCount: Int,
)

@Serializable
data class OrderList(
  val orders: List<OrderSummary>,
  val page: Int,
  val pageSize: Int,
  val total: Int,
)

@Serializable
data class ShipTo(
  val name: String,
  val line1: String,
  val city: String,
  val region: String,
  val postalCode: String,
  val country: String,
)

@Serializable
data class OrderLine(
  val sku: String,
  val name: String,
  val quantity: Int,
  val unitPriceCents: Int,
  val lineTotalCents: Int,
)

@Serializable
data class OrderEvent(
  val status: String,
  val note: String,
  val createdAt: String,
  val actorEmail: String? = null,
)

@Serializable
data class TrackingScan(
  val status: String,
  val location: String,
  val message: String,
  val happenedAt: String,
)

@Serializable
data class Shipment(
  val carrier: String,
  val service: String,
  val trackingNumber: String,
  val status: String,
  val shippedAt: String? = null,
  val estimatedDelivery: String? = null,
  val deliveredAt: String? = null,
  val scans: List<TrackingScan>? = null,
)

@Serializable
data class TrackingInfo(
  val trackingNumber: String,
  val carrier: String,
  val service: String,
  val status: String,
  val shippedAt: String? = null,
  val estimatedDelivery: String? = null,
  val deliveredAt: String? = null,
  val scans: List<TrackingScan> = emptyList(),
)

@Serializable
data class ShippingAccessToken(
  val accessToken: String,
  val tokenType: String,
  val expiresIn: Int,
)

@Serializable
data class TrackingResponse(val tracking: TrackingInfo)

@Serializable
data class OrderDetail(
  val number: String,
  val status: String,
  val placedAt: String,
  val subtotalCents: Int,
  val shippingCents: Int,
  val taxCents: Int,
  val totalCents: Int,
  val shipTo: ShipTo,
  val lines: List<OrderLine>,
  val events: List<OrderEvent>,
  val shipment: Shipment? = null,
)

@Serializable
data class OrderDetailResponse(val order: OrderDetail)

@Serializable
data class APIErrorBody(val error: String? = null)

@Serializable
data class OkResponse(val ok: Boolean = true)

@Serializable
data class DeletedPaymentMethod(val id: String, val deleted: Boolean)
