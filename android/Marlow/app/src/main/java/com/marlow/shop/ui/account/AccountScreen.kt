package com.marlow.shop.ui.account

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.marlow.shop.LocalSession
import com.marlow.shop.api.ApiError
import com.marlow.shop.config.AppConfig
import com.marlow.shop.model.CardInput
import com.marlow.shop.model.PaymentMethod
import com.marlow.shop.util.a11y
import java.util.Calendar
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AccountScreen() {
  val session = LocalSession.current
  val api = session.client
  val scope = rememberCoroutineScope()
  var cards by remember { mutableStateOf<List<PaymentMethod>>(emptyList()) }
  var cardNumber by remember { mutableStateOf("4242424242424242") }
  var expMonth by remember { mutableStateOf("12") }
  var expYear by remember {
    mutableStateOf((Calendar.getInstance().get(Calendar.YEAR) + 2).toString())
  }
  var cvc by remember { mutableStateOf("123") }
  var errorMessage by remember { mutableStateOf<String?>(null) }
  var statusMessage by remember { mutableStateOf<String?>(null) }
  var isSaving by remember { mutableStateOf(false) }
  var isSigningOut by remember { mutableStateOf(false) }

  suspend fun loadCards() {
    cards = runCatching { api.paymentMethods() }.getOrDefault(emptyList())
  }

  LaunchedEffect(Unit) { loadCards() }

  Column(Modifier.fillMaxSize()) {
    TopAppBar(title = { Text("Account") })
    Column(
      Modifier
        .fillMaxSize()
        .verticalScroll(rememberScrollState())
        .padding(16.dp),
      verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
      session.user?.let { user ->
        Text("Name: ${user.name}", modifier = Modifier.a11y("account-name"))
        Text("Email: ${user.email}", modifier = Modifier.a11y("account-email"))
        Text("Role: ${user.role}")
      }

      Text("Saved cards", style = MaterialTheme.typography.titleMedium)
      if (cards.isEmpty()) {
        Text("No cards on file.", modifier = Modifier.a11y("account-cards-empty"))
      } else {
        cards.forEach { method ->
          Row(
            Modifier.fillMaxWidth().a11y("account-card-${method.id}"),
            horizontalArrangement = Arrangement.SpaceBetween,
          ) {
            Text("${method.card.brand.uppercase()} ···· ${method.card.last4}")
            TextButton(
              onClick = {
                scope.launch {
                  runCatching { api.deletePaymentMethod(method.id) }
                  loadCards()
                }
              },
              modifier = Modifier.a11y("account-card-remove-${method.id}"),
            ) { Text("Remove") }
          }
        }
      }

      OutlinedTextField(cardNumber, { cardNumber = it }, label = { Text("Card number") }, modifier = Modifier.fillMaxWidth().a11y("account-card-number"))
      OutlinedTextField(expMonth, { expMonth = it }, label = { Text("Exp month") }, modifier = Modifier.fillMaxWidth().a11y("account-card-exp-month"))
      OutlinedTextField(expYear, { expYear = it }, label = { Text("Exp year") }, modifier = Modifier.fillMaxWidth().a11y("account-card-exp-year"))
      OutlinedTextField(cvc, { cvc = it }, label = { Text("CVC") }, modifier = Modifier.fillMaxWidth().a11y("account-card-cvc"))
      Button(
        onClick = {
          scope.launch {
            isSaving = true
            errorMessage = null
            statusMessage = null
            try {
              api.createPaymentMethod(
                CardInput(
                  number = cardNumber,
                  expMonth = expMonth.toInt(),
                  expYear = expYear.toInt(),
                  cvc = cvc,
                ),
              )
              statusMessage = "Card saved."
              loadCards()
            } catch (e: ApiError) {
              errorMessage = e.message
            } catch (e: Exception) {
              errorMessage = e.message
            } finally {
              isSaving = false
            }
          }
        },
        enabled = !isSaving,
        modifier = Modifier.fillMaxWidth().a11y("account-card-save"),
      ) {
        if (isSaving) CircularProgressIndicator() else Text("Save card")
      }
      errorMessage?.let { Text(it, color = MaterialTheme.colorScheme.error, modifier = Modifier.a11y("account-cards-error")) }
      statusMessage?.let { Text(it, modifier = Modifier.a11y("account-cards-message")) }

      Button(
        onClick = {
          scope.launch {
            isSigningOut = true
            try {
              session.signOut()
            } finally {
              isSigningOut = false
            }
          }
        },
        enabled = !isSigningOut,
        modifier = Modifier.fillMaxWidth().a11y("account-logout"),
      ) {
        if (isSigningOut) CircularProgressIndicator() else Text("Sign out")
      }

      Text("API ${AppConfig.apiBaseUrl}", style = MaterialTheme.typography.bodySmall)
    }
  }
}
