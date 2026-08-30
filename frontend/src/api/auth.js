import { encrypt, decrypt } from '../utils/encryption'

const API_BASE = import.meta.env.VITE_API_URL || ''
const USE_ENCRYPTION = import.meta.env.VITE_USE_ENCRYPTION === 'true'

async function apiCall(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
  })
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.detail || 'Request failed')
  }

  return data
}

export async function register(email, password) {
  if (USE_ENCRYPTION) {
    const encrypted = await encrypt({ email, password })
    const data = await apiCall(`/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: encrypted }),
    })
    if (data.data) {
      return await decrypt(data.data)
    }
    return data
  }

  return apiCall(`/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
}

export async function login(email, password) {
  if (USE_ENCRYPTION) {
    const encrypted = await encrypt({ email, password })
    const data = await apiCall(`/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: encrypted }),
    })
    if (data.data) {
      return await decrypt(data.data)
    }
    return data
  }

  return apiCall(`/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
}

export async function logout() {
  return apiCall(`/api/auth/logout`, { method: 'POST' })
}

export async function forgotPassword(email) {
  if (USE_ENCRYPTION) {
    const encrypted = await encrypt({ email })
    const data = await apiCall(`/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: encrypted }),
    })
    if (data.data) {
      return await decrypt(data.data)
    }
    return data
  }

  return apiCall(`/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
}

export async function resetPassword(token, newPassword) {
  if (USE_ENCRYPTION) {
    const encrypted = await encrypt({ token, new_password: newPassword })
    const data = await apiCall(`/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: encrypted }),
    })
    if (data.data) {
      return await decrypt(data.data)
    }
    return data
  }

  return apiCall(`/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, new_password: newPassword }),
  })
}
