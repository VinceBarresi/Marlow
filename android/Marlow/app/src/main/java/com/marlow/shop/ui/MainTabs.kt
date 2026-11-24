package com.marlow.shop.ui

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AccountCircle
import androidx.compose.material.icons.outlined.LocalShipping
import androidx.compose.material.icons.outlined.ShoppingBag
import androidx.compose.material.icons.outlined.ShoppingCart
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.marlow.shop.ui.account.AccountScreen
import com.marlow.shop.ui.cart.CartScreen
import com.marlow.shop.ui.orders.OrdersScreen
import com.marlow.shop.ui.shop.ShopScreen
import com.marlow.shop.util.a11y

private enum class Tab(val route: String, val label: String, val a11yId: String) {
  Shop("shop", "Shop", "tab-shop"),
  Cart("cart", "Cart", "tab-cart"),
  Orders("orders", "Orders", "tab-orders"),
  Account("account", "Account", "tab-account"),
}

@Composable
fun MainTabs() {
  val navController = rememberNavController()
  val backStack by navController.currentBackStackEntryAsState()
  val current = backStack?.destination?.route ?: Tab.Shop.route

  Scaffold(
    bottomBar = {
      NavigationBar {
        Tab.entries.forEach { tab ->
          NavigationBarItem(
            selected = current.startsWith(tab.route),
            onClick = {
              navController.navigate(tab.route) {
                popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                launchSingleTop = true
                restoreState = true
              }
            },
            icon = {
              Icon(
                imageVector = when (tab) {
                  Tab.Shop -> Icons.Outlined.ShoppingBag
                  Tab.Cart -> Icons.Outlined.ShoppingCart
                  Tab.Orders -> Icons.Outlined.LocalShipping
                  Tab.Account -> Icons.Outlined.AccountCircle
                },
                contentDescription = tab.a11yId,
                modifier = Modifier.a11y(tab.a11yId),
              )
            },
            label = { Text(tab.label) },
            modifier = Modifier.a11y(tab.a11yId),
          )
        }
      }
    },
  ) { padding ->
    NavHost(
      navController = navController,
      startDestination = Tab.Shop.route,
      modifier = Modifier.padding(padding),
    ) {
      composable(Tab.Shop.route) { ShopScreen() }
      composable(Tab.Cart.route) { CartScreen() }
      composable(Tab.Orders.route) { OrdersScreen() }
      composable(Tab.Account.route) { AccountScreen() }
    }
  }
}
