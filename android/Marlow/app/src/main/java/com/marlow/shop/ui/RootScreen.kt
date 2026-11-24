package com.marlow.shop.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.marlow.shop.LocalSession
import com.marlow.shop.ui.login.LoginScreen

@Composable
fun RootScreen() {
  val session = LocalSession.current
  when {
    session.isRestoring -> {
      Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        CircularProgressIndicator()
      }
    }
    session.isSignedIn -> MainTabs()
    else -> LoginScreen()
  }
}
