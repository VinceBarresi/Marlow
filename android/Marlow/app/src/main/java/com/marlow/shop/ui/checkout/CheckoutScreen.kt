package com.marlow.shop.ui.checkout

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.foundation.layout.Row
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.marlow.shop.LocalSession
import com.marlow.shop.api.ApiError
import com.marlow.shop.model.CardInput
import com.marlow.shop.model.CheckoutOrder
import com.marlow.shop.model.CheckoutRequest
import com.marlow.shop.model.PaymentMethod
import com.marlow.shop.util.Money
import com.marlow.shop.util.a11y
import java.util.Calendar
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CheckoutScreen(onDone: () -> Unit) {
  val api = LocalSession.current.client
  val scope = rememberCoroutineScope()
  var shipName by remember { mutableStateOf("Mina Adler") }
  var shipLine1 by remember { mutableStateOf("100 Congress Ave") }
  var shipCity by remember { mutableStateOf("Austin") }
  var shipRegion by remember { mutableStateOf("TX") }
  var shipPostalCode by remember { mutableStateOf("78701") }
  var savedCards by remember { mutableStateOf<List<PaymentMethod>>(emptyList()) }
  var selectedPaymentMethodId by remember { mutableStateOf("") }
  var cardNumber by remember { mutableStateOf("4242424242424242") }
  var expMonth by remember { mutableStateOf("12") }
  var expYear by remember {
    mutableStateOf((Calendar.getInstance().get(Calendar.YEAR) + 2).toString())
  }
  var cvc by remember { mutableStateOf("123") }
  var saveCard by remember { mutableStateOf(false) }
  var isSubmitting by remember { mutableStateOf(false) }
  var errorMessage by remember { mutableStateOf<String?>(null) }
  var placedOrder by remember { mutableStateOf<CheckoutOrder?>(null) }

  LaunchedEffect(Unit) {
    savedCards = runCatching { api.paymentMethods() }.getOrDefault(emptyList())
  }

  Column(Modifier.fillMaxSize()) {
    TopAppBar(title = { Text("Checkout") })
    Column(
      Modifier
        .fillMaxSize()
        .verticalScroll(rememberScrollState())
        .padding(16.dp),
      verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
      val order = placedOrder
      if (order != null) {
        Text(order.number, style = MaterialTheme.typography.headlineSmall, modifier = Modifier.a11y("checkout-order-number"))
        Text(order.status)
        Text(Money.format(order.totalCents))
        Button(onClick = onDone, modifier = Modifier.fillMaxWidth()) { Text("Done") }
      } else {
        OutlinedTextField(shipName, { shipName = it }, label = { Text("Name") }, modifier = Modifier.fillMaxWidth().a11y("checkout-name"))
        OutlinedTextField(shipLine1, { shipLine1 = it }, label = { Text("Address") }, modifier = Modifier.fillMaxWidth().a11y("checkout-line1"))
        OutlinedTextField(shipCity, { shipCity = it }, label = { Text("City") }, modifier = Modifier.fillMaxWidth().a11y("checkout-city"))
        OutlinedTextField(shipRegion, { shipRegion = it }, label = { Text("State") }, modifier = Modifier.fillMaxWidth().a11y("checkout-region"))
        OutlinedTextField(shipPostalCode, { shipPostalCode = it }, label = { Text("ZIP") }, modifier = Modifier.fillMaxWidth().a11y("checkout-postal"))

        if (savedCards.isNotEmpty()) {
          Text("Saved cards", modifier = Modifier.a11y("checkout-saved-card"))
          savedCards.forEach { method ->
            TextButtonLike(
              selected = selectedPaymentMethodId == method.id,
              label = "${method.card.brand.uppercase()} ···· ${method.card.last4}",
              onClick = { selectedPaymentMethodId = method.id },
            )
          }
          TextButtonLike(
            selected = selectedPaymentMethodId.isEmpty(),
            label = "New card",
            onClick = { selectedPaymentMethodId = "" },
          )
        }

        if (selectedPaymentMethodId.isEmpty()) {
          OutlinedTextField(cardNumber, { cardNumber = it }, label = { Text("Card number") }, modifier = Modifier.fillMaxWidth().a11y("checkout-card-number"))
          OutlinedTextField(expMonth, { expMonth = it }, label = { Text("Exp month") }, modifier = Modifier.fillMaxWidth().a11y("checkout-card-exp-month"))
          OutlinedTextField(expYear, { expYear = it }, label = { Text("Exp year") }, modifier = Modifier.fillMaxWidth().a11y("checkout-card-exp-year"))
          OutlinedTextField(cvc, { cvc = it }, label = { Text("CVC") }, modifier = Modifier.fillMaxWidth().a11y("checkout-card-cvc"))
          Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.a11y("checkout-save-card")) {
            Checkbox(checked = saveCard, onCheckedChange = { saveCard = it })
            Text("Save this card")
          }
        }

        errorMessage?.let {
          Text(it, color = MaterialTheme.colorScheme.error, modifier = Modifier.a11y("checkout-error"))
        }

        Button(
          onClick = {
            scope.launch {
              isSubmitting = true
              errorMessage = null
              try {
                val request = if (selectedPaymentMethodId.isNotEmpty()) {
                  CheckoutRequest(
                    shipName = shipName,
                    shipLine1 = shipLine1,
                    shipCity = shipCity,
                    shipRegion = shipRegion,
                    shipPostalCode = shipPostalCode,
                    paymentMethodId = selectedPaymentMethodId,
                  )
                } else {
                  CheckoutRequest(
                    shipName = shipName,
                    shipLine1 = shipLine1,
                    shipCity = shipCity,
                    shipRegion = shipRegion,
                    shipPostalCode = shipPostalCode,
                    card = CardInput(
                      number = cardNumber,
                      expMonth = expMonth.toInt(),
                      expYear = expYear.toInt(),
                      cvc = cvc,
                    ),
                    saveCard = saveCard,
                  )
                }
                placedOrder = api.checkout(request)
              } catch (e: ApiError) {
                errorMessage = e.message
              } catch (e: Exception) {
                errorMessage = e.message
              } finally {
                isSubmitting = false
              }
            }
          },
          enabled = !isSubmitting,
          modifier = Modifier.fillMaxWidth().a11y("checkout-submit"),
        ) {
          if (isSubmitting) CircularProgressIndicator() else Text("Place order")
        }
      }
    }
  }
}

@Composable
private fun TextButtonLike(selected: Boolean, label: String, onClick: () -> Unit) {
  Button(onClick = onClick, modifier = Modifier.fillMaxWidth()) {
    Text(if (selected) "✓ $label" else label)
  }
}
