import type { ButtonHTMLAttributes, ReactNode } from 'react'

export function Button({ variant = 'primary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  return <button {...props} className={`btn btn-${variant} ${className}`.trim()} />
}

export function Card({ title, subtitle, actions, children, className = '' }: { title?: string; subtitle?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`card ${className}`.trim()}>
    {(title || subtitle || actions) && <div className="card-header">
      <div>{title && <h2>{title}</h2>}{subtitle && <p>{subtitle}</p>}</div>
      {actions && <div className="card-actions">{actions}</div>}
    </div>}
    {children}
  </section>
}

export function PageHeader({ kicker, title, description, actions }: { kicker: string; title: string; description: string; actions?: ReactNode }) {
  return <header className="page-header">
    <div>
      <p className="kicker">{kicker}</p>
      <h1>{title}</h1>
      <p className="page-description">{description}</p>
    </div>
    {actions && <div className="page-actions">{actions}</div>}
  </header>
}

export function StatCard({ label, value, note, emphasis = false }: { label: string; value: string; note: string; emphasis?: boolean }) {
  return <div className={`stat-card ${emphasis ? 'stat-card-emphasis' : ''}`}>
    <span>{label}</span>
    <strong>{value}</strong>
    <small>{note}</small>
  </div>
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}

export function Alert({ children, tone = 'error' }: { children: ReactNode; tone?: 'error' | 'success' | 'info' }) {
  return <div className={`alert alert-${tone}`}>{children}</div>
}

export function LoadingState({ children = 'Loading…' }: { children?: ReactNode }) {
  return <div className="state-panel"><div className="spinner" />{children}</div>
}

export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return <div className="empty-state"><strong>{title}</strong><p>{children}</p></div>
}

export function ReviewPanel({ title, text, provider }: { title: string; text: string; provider: string }) {
  return <div className="review-panel">
    <div className="review-panel-head"><strong>{title}</strong><Badge tone="info">{provider.replaceAll('_', ' ')}</Badge></div>
    <p>{text}</p>
  </div>
}
