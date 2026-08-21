import net from 'node:net'

export const DEFAULT_PROXY_HOST = '127.0.0.1'
// Electron production renderer uses the file:// origin. The companion runtime
// always supplies a random ACCESS_TOKEN, so this local origin remains token-bound.
export const DEFAULT_ALLOWED_ORIGINS = ['null', 'file://', 'myssh-plugin://mysql-manager']

export function normalizeOrigin(value) {
  const origin = String(value ?? '').trim()
  if (!origin || origin === 'null') return origin || 'null'
  if (origin === 'file://' || origin.startsWith('file:///')) return 'file://'
  try {
    const parsed = new URL(origin)
    if (!['http:', 'https:', 'ws:', 'wss:', 'myssh-plugin:'].includes(parsed.protocol)) return null
    if (parsed.protocol === 'myssh-plugin:') return `${parsed.protocol}//${parsed.host}`
    return parsed.origin
  } catch {
    return null
  }
}

export function parseAllowedOrigins(value) {
  const entries = String(value ?? '')
    .split(',')
    .map((entry) => normalizeOrigin(entry))
    .filter(Boolean)
  const normalized = entries.length > 0 ? [...new Set(entries)] : [...DEFAULT_ALLOWED_ORIGINS]
  // `null` is the legacy local-app marker. Keep file:// compatible when a host
  // explicitly passes the legacy value (MySSH 1.3.0 does this).
  if (normalized.includes('null') && !normalized.includes('file://')) normalized.push('file://')
  return normalized
}

export function isLoopbackHost(host) {
  return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]'
    || net.isIP(host) === 4 && host.startsWith('127.')
}

export function validateProxyConfig({ host, allowedOrigins, accessToken }) {
  if (isLoopbackHost(host)) return
  if (!accessToken) throw new Error('非本地代理必须设置 ACCESS_TOKEN')
  if (!allowedOrigins?.length || allowedOrigins.includes('*') || allowedOrigins.includes('null')) {
    throw new Error('非本地代理必须设置明确的 ALLOWED_ORIGINS，不能使用通配或 null')
  }
}

export function isRequestAllowed({ origin, allowedOrigins, accessToken, requestToken }) {
  const requestOrigin = normalizeOrigin(origin)
  if (!requestOrigin || !allowedOrigins.includes(requestOrigin)) return false
  if (requestOrigin === 'file://' && !accessToken) return false
  return accessToken ? requestToken === accessToken : true
}
