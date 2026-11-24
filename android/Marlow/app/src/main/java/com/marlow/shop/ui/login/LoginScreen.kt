package com.marlow.shop.ui.login

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.marlow.shop.LocalSession
import com.marlow.shop.api.ApiError
import com.marlow.shop.config.AppConfig
import com.marlow.shop.util.a11y
import kotlinx.coroutines.launch

@Composable
fun LoginScreen() {
  val session = LocalSession.current
  val scope = rememberCoroutineScope()
  var email by remember { mutableStateOf("customer@marlow.test") }
  var password by remember { mutableStateOf("datalab") }
  var isSubmitting by remember { mutableStateOf(false) }
  var errorMessage by remember { mutableStateOf<String?>(null) }

  Column(
    modifier = Modifier
      .fillMaxSize()
      .padding(24.dp),
    verticalArrangement = Arrangement.spacedBy(16.dp),
  ) {
    Text("Marlow", style = MaterialTheme.typography.headlineMedium)
    OutlinedTextField(
      value = email,
      onValueChange = { email = it },
      label = { Text("Email") },
      singleLine = true,
      keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
      modifier = Modifier.fillMaxWidth().a11y("login-email"),
    )
    OutlinedTextField(
      value = password,
      onValueChange = { password = it },
      label = { Text("Password") },
      singleLine = true,
      visualTransformation = PasswordVisualTransformation(),
      keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
      modifier = Modifier.fillMaxWidth().a11y("login-password"),
    )
    errorMessage?.let {
      Text(it, color = MaterialTheme.colorScheme.error, modifier = Modifier.a11y("login-error"))
    }
    Button(
      onClick = {
        scope.launch {
          isSubmitting = true
          errorMessage = null
          try {
            session.signIn(email.trim(), password)
          } catch (e: ApiError) {
            errorMessage = e.message
          } catch (e: Exception) {
            errorMessage = e.message ?: "Sign in failed"
          } finally {
            isSubmitting = false
          }
        }
      },
      enabled = !isSubmitting && email.isNotBlank() && password.isNotBlank(),
      modifier = Modifier.fillMaxWidth().a11y("login-submit"),
    ) {
      if (isSubmitting) CircularProgressIndicator() else Text("Sign in")
    }
    Text(
      "Use a seeded customer account against the local API at ${AppConfig.apiBaseUrl}.",
      style = MaterialTheme.typography.bodySmall,
      color = MaterialTheme.colorScheme.onSurfaceVariant,
    )
  }
}
