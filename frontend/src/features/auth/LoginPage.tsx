import { useState } from 'react'
import type { FormEvent } from 'react'
import { api, clearCredentials, saveCredentials } from '../../lib/api'
import type { User } from '../../domain/models'
import { Alert, Button } from '../../components/ui'
import { messageOf } from '../../lib/format'

export function LoginPage({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState('developer')
  const [password, setPassword] = useState('dev-demo')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    saveCredentials({ username, password })
    try {
      await api<User>('/api/me')
      onSuccess()
    } catch (err) {
      clearCredentials()
      setError(messageOf(err))
    } finally {
      setBusy(false)
    }
  }

  return <main className="login-layout">
    <section className="login-panel">
      <div className="brand-lockup login-brand">
        <div className="brand-symbol">T</div>
        <div><strong>TransAct</strong><span>Brain Coin network</span></div>
      </div>
      <div className="login-copy">
        <p className="kicker">Developer financial network</p>
        <h1>Sign in to TransAct</h1>
        <p>Manage Brain Coin balances, commitments, loans, recurring compensation, and your transaction reliability record.</p>
      </div>
      <form onSubmit={submit} className="form-stack">
        <label>Username<input value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" /></label>
        <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" /></label>
        {error && <Alert>{error}</Alert>}
        <Button type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in securely'}</Button>
      </form>
      <div className="demo-credentials">
        <div><strong>Developer demo</strong><span>developer / dev-demo</span></div>
        <div><strong>Administrator demo</strong><span>admin / admin-demo</span></div>
      </div>
      <p className="security-note">Demo credentials are environment-controlled and must be replaced before public deployment.</p>
    </section>
    <aside className="login-aside">
      <div className="finance-illustration" aria-hidden="true">
        <div className="mini-account"><span>Brain Coin balance</span><strong>1,850.00 BC</strong><small>Available contribution credit</small></div>
        <div className="mini-row"><span>Trustworthiness score</span><strong>86 / 100</strong></div>
        <div className="mini-row"><span>Next direct deposit</span><strong>600 BC</strong></div>
      </div>
      <h2>Reciprocity with financial discipline.</h2>
      <p>Every transfer is ledger-backed. Every loan decision is reviewable. Every T-score contribution is explainable.</p>
    </aside>
  </main>
}
