package com.marlow.shop.ui.product

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.marlow.shop.LocalSession
import com.marlow.shop.api.ApiError
import com.marlow.shop.model.Product
import com.marlow.shop.util.Money
import com.marlow.shop.util.a11y
import kotlinx.coroutines.launch
import kotlin.math.max
import kotlin.math.roundToInt

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProductScreen(sku: String, onBack: () -> Unit) {
  val api = LocalSession.current.client
  val scope = rememberCoroutineScope()
  var product by remember { mutableStateOf<Product?>(null) }
  var quantity by remember { mutableFloatStateOf(1f) }
  var isLoading by remember { mutableStateOf(true) }
  var isAdding by remember { mutableStateOf(false) }
  var message by remember { mutableStateOf<String?>(null) }
  var errorMessage by remember { mutableStateOf<String?>(null) }

  LaunchedEffect(sku) {
    isLoading = true
    try {
      product = api.product(sku)
      errorMessage = null
    } catch (e: ApiError) {
      errorMessage = e.message
      product = null
    } catch (e: Exception) {
      errorMessage = e.message
      product = null
    } finally {
      isLoading = false
    }
  }

  Column(Modifier.fillMaxSize()) {
    TopAppBar(
      title = { Text(sku) },
      navigationIcon = {
        IconButton(onClick = onBack) {
          Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
        }
      },
    )
    when {
      isLoading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        CircularProgressIndicator()
      }
      product != null -> {
        val p = product!!
        val maxQty = max(1, p.available)
        Column(
          Modifier.padding(16.dp),
          verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
          Text(p.name, style = MaterialTheme.typography.headlineSmall, modifier = Modifier.a11y("product-name"))
          Text(p.category, color = MaterialTheme.colorScheme.onSurfaceVariant)
          Text(p.description)
          Text(Money.format(p.priceCents), style = MaterialTheme.typography.titleMedium, modifier = Modifier.a11y("product-price"))
          Text("${p.available} available")
          Text("Quantity: ${quantity.roundToInt()}", modifier = Modifier.a11y("product-qty"))
          Slider(
            value = quantity.coerceIn(1f, maxQty.toFloat()),
            onValueChange = { quantity = it },
            valueRange = 1f..maxQty.toFloat(),
            steps = max(0, maxQty - 2),
            modifier = Modifier.fillMaxWidth().a11y("product-qty"),
          )
          Button(
            onClick = {
              scope.launch {
                isAdding = true
                message = null
                errorMessage = null
                try {
                  api.setCartItem(sku, quantity.roundToInt())
                  message = "Added to cart."
                } catch (e: ApiError) {
                  errorMessage = e.message
                } catch (e: Exception) {
                  errorMessage = e.message
                } finally {
                  isAdding = false
                }
              }
            },
            enabled = !isAdding && p.available >= 1,
            modifier = Modifier.fillMaxWidth().a11y("product-add"),
          ) {
            if (isAdding) CircularProgressIndicator() else Text("Add to cart")
          }
          message?.let { Text(it, color = MaterialTheme.colorScheme.primary) }
          errorMessage?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        }
      }
      else -> Text(errorMessage ?: "Product not found", Modifier.padding(16.dp))
    }
  }
}
