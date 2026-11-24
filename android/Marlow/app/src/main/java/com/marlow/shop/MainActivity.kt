package com.marlow.shop

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.testTagsAsResourceId
import com.marlow.shop.ui.RootScreen

val LocalSession = staticCompositionLocalOf<SessionStore> {
  error("SessionStore not provided")
}

class MainActivity : ComponentActivity() {
  @OptIn(ExperimentalComposeUiApi::class)
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    enableEdgeToEdge()
    val session = (application as MarlowApp).session
    session.restore()
    setContent {
      CompositionLocalProvider(LocalSession provides session) {
        MaterialTheme {
          Surface(
            modifier = Modifier
              .fillMaxSize()
              .semantics { testTagsAsResourceId = true },
          ) {
            RootScreen()
          }
        }
      }
    }
  }
}
