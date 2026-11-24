package com.marlow.shop.util

import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.testTag

/** Match iOS accessibilityIdentifier / web data-testid for Appium `$("~id")`. */
fun Modifier.a11y(id: String): Modifier =
  semantics {
    contentDescription = id
    testTag = id
  }
