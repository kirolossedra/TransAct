const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'
const AUTH_KEY = 'transact-auth'

export type Credentials = { username: string; password: string }

export function credentials(): Credentials | null {
  const value = sessionStorage.getItem(AUTH_KEY)
  return value ? JSON.parse(value) : null
}

export function saveCredentials(value: Credentials) {
  sessionStorage.setItem(AUTH_KEY, JSON.stringify(value))
}

export function clearCredentials() {
  sessionStorage.removeItem(AUTH_KEY)
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const auth = credentials()
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  if (auth) headers.set('Authorization', `Basic ${btoa(`${auth.username}:${auth.password}`)}`)

  const response = await fetch(`${API_URL}${path}`, { ...options, headers })
  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const body = await response.json()
      message = body.message || message
    } catch {
      // Keep HTTP fallback.
    }
    throw new Error(message)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}
