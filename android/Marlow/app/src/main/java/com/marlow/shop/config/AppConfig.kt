package com.marlow.shop.config

import com.marlow.shop.BuildConfig

object AppConfig {
  /** Emulator reaches the host API via 10.0.2.2. Override with marlow.apiBaseUrl Gradle property. */
  val apiBaseUrl: String = BuildConfig.API_BASE_URL.trimEnd('/')
}
