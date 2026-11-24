package com.marlow.shop.ui.orders

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.marlow.shop.LocalSession
import com.marlow.shop.api.ApiError
import com.marlow.shop.model.OrderSummary
import com.marlow.shop.util.Money
import com.marlow.shop.util.a11y

@Composable
fun OrdersScreen() {
  val nav = rememberNavController()
  NavHost(navController = nav, startDestination = "list") {
    composable("list") {
      OrdersList(onOpen = { number -> nav.navigate("detail/$number") })
    }
    composable("detail/{number}") { entry ->
      val number = entry.arguments?.getString("number").orEmpty()
      OrderDetailScreen(number = number, onBack = { nav.popBackStack() })
    }
  }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun OrdersList(onOpen: (String) -> Unit) {
  val api = LocalSession.current.client
  var orders by remember { mutableStateOf<List<OrderSummary>>(emptyList()) }
  var isLoading by remember { mutableStateOf(true) }
  var errorMessage by remember { mutableStateOf<String?>(null) }

  LaunchedEffect(Unit) {
    isLoading = true
    try {
      orders = api.orders().orders
      errorMessage = null
    } catch (e: ApiError) {
      errorMessage = e.message
    } catch (e: Exception) {
      errorMessage = e.message
    } finally {
      isLoading = false
    }
  }

  Column(Modifier.fillMaxSize()) {
    TopAppBar(title = { Text("Orders") })
    when {
      isLoading && orders.isEmpty() -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        CircularProgressIndicator()
      }
      orders.isEmpty() && errorMessage == null -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text("No orders yet", modifier = Modifier.a11y("orders-empty"))
      }
      else -> LazyColumn(Modifier.fillMaxSize()) {
        errorMessage?.let {
          item { Text(it, color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(16.dp)) }
        }
        items(orders, key = { it.number }) { order ->
          Column(
            modifier = Modifier
              .fillMaxWidth()
              .clickable { onOpen(order.number) }
              .padding(16.dp)
              .a11y("order-${order.number}"),
          ) {
            Text(order.number, style = MaterialTheme.typography.titleMedium)
            Text(order.status.replace('_', ' '), color = MaterialTheme.colorScheme.onSurfaceVariant)
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
              Text("${order.shipCity}, ${order.shipRegion}")
              Text(Money.format(order.totalCents))
            }
          }
        }
      }
    }
  }
}
