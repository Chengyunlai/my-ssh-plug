import net from 'node:net'

export const DEFAULT_PROXY_HOST = '127.0.0.1'
export const DEFAULT_ALLOWED_ORIGINS = ['null']

export function normalizeOrigin(value) {
  const origin = String(value ?? '').trim()
  if (!origin || origin === 'null') return origin || 'null'
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
  return entries.length > 0 ? [...new Set(entries)] : [...DEFAULT_ALLOWED_ORIGINS]
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
  return accessToken ? requestToken === accessToken : true
}
