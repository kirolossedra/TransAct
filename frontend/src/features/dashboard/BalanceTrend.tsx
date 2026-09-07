import type { Activity } from '../../domain/models'
import { money } from '../../lib/format'

export function BalanceTrend({ balance, activity }: { balance: number; activity: Activity[] }) {
  const history = buildHistory(balance, activity)
  const width = 700
  const height = 240
  const padX = 22
  const padTop = 20
  const padBottom = 36
  const values = history.map(point => point.balance)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const spread = Math.max(max - min, 1)
  const usableHeight = height - padTop - padBottom
  const usableWidth = width - padX * 2

  const points = history.map((point, index) => {
    const x = padX + (history.length === 1 ? usableWidth / 2 : (index / (history.length - 1)) * usableWidth)
    const y = padTop + ((max - point.balance) / spread) * usableHeight
    return { ...point, x, y }
  })

  const line = points.map(point => `${point.x},${point.y}`).join(' ')
  const area = `M ${points[0].x} ${height - padBottom} L ${points.map(point => `${point.x} ${point.y}`).join(' L ')} L ${points.at(-1)!.x} ${height - padBottom} Z`

  return <div className="trend-chart" aria-label="Recent Brain Coin balance trend">
    <div className="trend-chart-summary">
      <div><span>Current balance</span><strong>{money.format(balance)} BC</strong></div>
      <span className="trend-window">Last {Math.max(activity.slice(0, 7).length, 1)} ledger events</span>
    </div>
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Balance movement derived from recent ledger entries">
      <defs>
        <linearGradient id="balanceFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.015" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map(ratio => <line key={ratio} x1={padX} x2={width - padX} y1={padTop + usableHeight * ratio} y2={padTop + usableHeight * ratio} className="trend-grid-line" />)}
      <path d={area} fill="url(#balanceFill)" />
      <polyline points={line} className="trend-line" />
      {points.map((point, index) => <g key={`${point.label}-${index}`}>
        <circle cx={point.x} cy={point.y} r="4" className="trend-point" />
        {(index === 0 || index === points.length - 1 || points.length <= 5) && <text x={point.x} y={height - 12} textAnchor={index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle'} className="trend-label">{point.label}</text>}
      </g>)}
    </svg>
  </div>
}

function buildHistory(balance: number, activity: Activity[]) {
  let cursor = balance
  const recent = activity.slice(0, 7)
  const points = [{ label: 'Now', balance: cursor }]

  for (const item of recent) {
    cursor -= item.amount
    points.push({
      label: new Date(item.createdAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }),
      balance: cursor,
    })
  }

  return points.reverse()
}
