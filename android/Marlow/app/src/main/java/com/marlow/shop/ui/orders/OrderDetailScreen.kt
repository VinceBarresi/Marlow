package com.marlow.shop.ui.orders

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
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
import com.marlow.shop.LocalSession
import com.marlow.shop.api.ApiError
import com.marlow.shop.model.OrderDetail
import com.marlow.shop.model.TrackingInfo
import com.marlow.shop.util.Money
import com.marlow.shop.util.a11y

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OrderDetailScreen(number: String, onBack: () -> Unit) {
  val api = LocalSession.current.client
  var order by remember { mutableStateOf<OrderDetail?>(null) }
  var tracking by remember { mutableStateOf<TrackingInfo?>(null) }
  var isLoading by remember { mutableStateOf(true) }
  var errorMessage by remember { mutableStateOf<String?>(null) }

  LaunchedEffect(number) {
    isLoading = true
    try {
      val detail = api.order(number)
      order = detail
      val shipment = detail.shipment
      if (shipment != null) {
        tracking = runCatching {
          val token = api.shippingAccessToken().accessToken
          api.tracking(shipment.trackingNumber, token)
        }.getOrNull()
      }
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
      title = { Text(number) },
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
      order != null -> {
        val o = order!!
        Column(
          Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
          verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
          Text(o.status.replace('_', ' '), modifier = Modifier.a11y("order-status"))
          Text("Total ${Money.format(o.totalCents)}")
          Text("${o.shipTo.name} — ${o.shipTo.city}, ${o.shipTo.region}")
          o.lines.forEach { line ->
            Text("${line.quantity}× ${line.name} — ${Money.format(line.lineTotalCents)}")
          }
          val ship = o.shipment
          if (ship != null) {
            Text(ship.carrier, modifier = Modifier.a11y("order-tracking-carrier"))
            Text(ship.trackingNumber, modifier = Modifier.a11y("order-tracking-number"))
            Text((tracking?.status ?: ship.status), modifier = Modifier.a11y("order-tracking-status"))
          }
        }
      }
      else -> Text(errorMessage ?: "Order not found", Modifier.padding(16.dp))
    }
  }
}
