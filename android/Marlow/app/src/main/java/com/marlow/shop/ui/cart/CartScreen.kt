package com.marlow.shop.ui.cart

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.marlow.shop.LocalSession
import com.marlow.shop.api.ApiError
import com.marlow.shop.model.Cart
import com.marlow.shop.ui.checkout.CheckoutScreen
import com.marlow.shop.util.Money
import com.marlow.shop.util.a11y
import kotlinx.coroutines.launch

@Composable
fun CartScreen() {
  val nav = rememberNavController()
  NavHost(navController = nav, startDestination = "cart") {
    composable("cart") {
      CartContent(onCheckout = { nav.navigate("checkout") })
    }
    composable("checkout") {
      CheckoutScreen(onDone = { nav.popBackStack() })
    }
  }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun CartContent(onCheckout: () -> Unit) {
  val api = LocalSession.current.client
  val scope = rememberCoroutineScope()
  var cart by remember { mutableStateOf<Cart?>(null) }
  var isLoading by remember { mutableStateOf(true) }
  var errorMessage by remember { mutableStateOf<String?>(null) }

  suspend fun load() {
    isLoading = true
    try {
      cart = api.cart()
      errorMessage = null
    } catch (e: ApiError) {
      errorMessage = e.message
    } catch (e: Exception) {
      errorMessage = e.message
    } finally {
      isLoading = false
    }
  }

  LaunchedEffect(Unit) { load() }

  Column(Modifier.fillMaxSize()) {
    TopAppBar(title = { Text("Cart") })
    when {
      isLoading && cart == null -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        CircularProgressIndicator()
      }
      cart?.items?.isEmpty() == true -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text("Your cart is empty", modifier = Modifier.a11y("cart-empty"))
      }
      cart != null -> {
        val c = cart!!
        LazyColumn(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
          items(c.items, key = { it.sku }) { item ->
            Column(Modifier.fillMaxWidth().a11y("cart-item-${item.sku}")) {
              Text(item.name, style = MaterialTheme.typography.titleMedium)
              Text(item.sku, style = MaterialTheme.typography.labelSmall)
              Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("Qty ${item.quantity}")
                Text(Money.format(item.lineTotalCents))
              }
              TextButton(onClick = {
                scope.launch {
                  try {
                    api.removeCartItem(item.sku)
                    load()
                  } catch (e: Exception) {
                    errorMessage = e.message
                  }
                }
              }) { Text("Remove") }
            }
          }
          item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
              Text("Subtotal")
              Text(Money.format(c.subtotalCents), style = MaterialTheme.typography.titleMedium, modifier = Modifier.a11y("cart-subtotal"))
            }
          }
          errorMessage?.let {
            item { Text(it, color = MaterialTheme.colorScheme.error) }
          }
          item {
            Button(onClick = onCheckout, modifier = Modifier.fillMaxWidth().a11y("cart-checkout")) {
              Text("Checkout")
            }
          }
        }
      }
      else -> Text(errorMessage ?: "Could not load cart", Modifier.padding(16.dp))
    }
  }
}
