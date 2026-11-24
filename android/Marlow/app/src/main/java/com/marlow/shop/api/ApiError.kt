package com.marlow.shop.api

class ApiError(val status: Int, override val message: String) : Exception(message)
