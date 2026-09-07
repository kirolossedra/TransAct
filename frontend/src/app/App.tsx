import { useState } from 'react'
import { credentials, clearCredentials } from '../lib/api'
import { AppShell } from './AppShell'
import { LoginPage } from '../features/auth/LoginPage'

export default function App() {
  const [authenticated, setAuthenticated] = useState(Boolean(credentials()))

  if (!authenticated) return <LoginPage onSuccess={() => setAuthenticated(true)} />

  return <AppShell onLogout={() => {
    clearCredentials()
    setAuthenticated(false)
  }} />
}
