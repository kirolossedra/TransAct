export const money = new Intl.NumberFormat('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function formatDateTime(value?: string) {
  return value ? new Date(value).toLocaleString() : '—'
}

export function formatDate(value?: string) {
  return value ? new Date(value).toLocaleDateString() : '—'
}

export function pretty(value: string) {
  return value.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export function messageOf(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong.'
}
