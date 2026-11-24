package com.marlow.shop

import android.app.Application

class MarlowApp : Application() {
  lateinit var session: SessionStore
    private set

  override fun onCreate() {
    super.onCreate()
    session = SessionStore()
  }
}
