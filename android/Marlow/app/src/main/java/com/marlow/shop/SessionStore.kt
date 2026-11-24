package com.marlow.shop

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.marlow.shop.api.ApiClient
import com.marlow.shop.api.ApiError
import com.marlow.shop.model.User
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

class SessionStore(
  private val api: ApiClient = ApiClient(),
) {
  private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)

  var user by mutableStateOf<User?>(null)
    private set
  var isRestoring by mutableStateOf(true)
    private set
  var lastError by mutableStateOf<String?>(null)
    private set

  val isSignedIn: Boolean get() = user != null

  val client: ApiClient get() = api

  fun restore() {
    scope.launch {
      isRestoring = true
      try {
        user = api.me()
        lastError = null
      } catch (e: ApiError) {
        user = null
        lastError = if (e.status == 401) null else e.message
      } catch (e: Exception) {
        user = null
        lastError = e.message
      } finally {
        isRestoring = false
      }
    }
  }

  suspend fun signIn(email: String, password: String) {
    user = api.login(email, password)
    lastError = null
  }

  suspend fun signOut() {
    try {
      api.logout()
    } catch (_: Exception) {
      api.clearCookies()
    }
    user = null
  }
}
