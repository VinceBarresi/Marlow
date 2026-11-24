package com.marlow.shop.util

import java.text.NumberFormat
import java.util.Locale

object Money {
  private val formatter: NumberFormat =
    NumberFormat.getCurrencyInstance(Locale.US)

  fun format(cents: Int): String =
    formatter.format(cents / 100.0)
}
