"use client"

import * as api from './api'

const AUTH_STORAGE_KEY = "auth_token"

export async function login(email: string, password: string) {
  return await api.login(email, password)
}

export function logout() {
  api.logout()
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem(AUTH_STORAGE_KEY) !== null
}

export async function getCurrentUser() {
  return await api.getCurrentUser()
}
