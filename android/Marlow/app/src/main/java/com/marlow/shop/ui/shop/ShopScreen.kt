package com.marlow.shop.ui.shop

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
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
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
import com.marlow.shop.model.Product
import com.marlow.shop.ui.product.ProductScreen
import com.marlow.shop.util.Money
import com.marlow.shop.util.a11y
import kotlinx.coroutines.delay

@Composable
fun ShopScreen() {
  val nav = rememberNavController()
  NavHost(navController = nav, startDestination = "list") {
    composable("list") {
      ShopList(
        onOpen = { sku -> nav.navigate("product/$sku") },
      )
    }
    composable("product/{sku}") { entry ->
      val sku = entry.arguments?.getString("sku").orEmpty()
      ProductScreen(sku = sku, onBack = { nav.popBackStack() })
    }
  }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ShopList(onOpen: (String) -> Unit) {
  val api = LocalSession.current.client
  var query by remember { mutableStateOf("") }
  var products by remember { mutableStateOf<List<Product>>(emptyList()) }
  var total by remember { mutableIntStateOf(0) }
  var isLoading by remember { mutableStateOf(false) }
  var errorMessage by remember { mutableStateOf<String?>(null) }

  LaunchedEffect(query) {
    delay(300)
    isLoading = true
    try {
      val list = api.products(q = query.ifBlank { null })
      products = list.products
      total = list.total
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
    TopAppBar(
      title = { Text("Shop") },
      actions = {
        if (total > 0) {
          Text("$total", modifier = Modifier.padding(end = 16.dp).a11y("shop-total"))
        }
      },
    )
    OutlinedTextField(
      value = query,
      onValueChange = { query = it },
      placeholder = { Text("Search products") },
      singleLine = true,
      modifier = Modifier
        .fillMaxWidth()
        .padding(horizontal = 16.dp)
        .a11y("shop-search"),
    )
    Box(Modifier.fillMaxSize()) {
      when {
        isLoading && products.isEmpty() -> {
          CircularProgressIndicator(Modifier.align(Alignment.Center))
        }
        else -> {
          LazyColumn(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(4.dp),
          ) {
            errorMessage?.let {
              item {
                Text(
                  it,
                  color = MaterialTheme.colorScheme.error,
                  modifier = Modifier.padding(16.dp),
                )
              }
            }
            items(products, key = { it.sku }) { product ->
              Column(
                modifier = Modifier
                  .fillMaxWidth()
                  .clickable { onOpen(product.sku) }
                  .padding(horizontal = 16.dp, vertical = 12.dp)
                  .a11y("product-${product.sku}"),
              ) {
                Text(product.name, style = MaterialTheme.typography.titleMedium)
                Text(product.category, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                  Text(Money.format(product.priceCents))
                  Text("${product.available} available", style = MaterialTheme.typography.labelSmall)
                }
              }
            }
          }
        }
      }
    }
  }
}
