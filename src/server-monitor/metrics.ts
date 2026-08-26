import type { NetworkRate, SystemMetricsSnapshot } from './types'

export const HISTORY_LIMIT = 30

export interface MetricHistoryPoint {
  sampledAt: number
  cpuPercent: number | null
  memoryPercent: number
}

export function appendHistory(
  history: MetricHistoryPoint[],
  snapshot: SystemMetricsSnapshot
): MetricHistoryPoint[] {
  return [
    ...history,
    {
      sampledAt: snapshot.sampledAt,
      cpuPercent: snapshot.cpu.usagePercent,
      memoryPercent: snapshot.memory.usagePercent
    }
  ].slice(-HISTORY_LIMIT)
}

export function calculateNetworkRates(
  previous: SystemMetricsSnapshot | null,
  current: SystemMetricsSnapshot
): NetworkRate[] {
  const elapsedSeconds = previous ? (current.sampledAt - previous.sampledAt) / 1000 : 0
  const previousByInterface = new Map(
    (previous?.network ?? []).map((item) => [item.interface, item])
  )

  return current.network.map((item) => {
    const before = previousByInterface.get(item.interface)
    const canCalculate = Boolean(before && elapsedSeconds > 0)
    const rxDelta = canCalculate ? Math.max(0, item.rxBytes - before!.rxBytes) : null
    const txDelta = canCalculate ? Math.max(0, item.txBytes - before!.txBytes) : null
    return {
      interface: item.interface,
      rxBytesPerSecond: rxDelta === null ? null : rxDelta / elapsedSeconds,
      txBytesPerSecond: txDelta === null ? null : txDelta / elapsedSeconds,
      rxBytes: item.rxBytes,
      txBytes: item.txBytes
    }
  })
}

export function formatBytes(value: number | null, perSecond = false): string {
  if (value === null || !Number.isFinite(value)) return '采样中'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let amount = Math.max(0, value)
  let index = 0
  while (amount >= 1024 && index < units.length - 1) {
    amount /= 1024
    index += 1
  }
  const digits = amount >= 100 || index === 0 ? 0 : amount >= 10 ? 1 : 2
  return `${amount.toFixed(digits)} ${units[index]}${perSecond ? '/s' : ''}`
}

export function formatUptime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds))
  const days = Math.floor(total / 86_400)
  const hours = Math.floor((total % 86_400) / 3_600)
  const minutes = Math.floor((total % 3_600) / 60)
  if (days > 0) return `${days}天 ${hours}小时`
  if (hours > 0) return `${hours}小时 ${minutes}分`
  return `${minutes}分钟`
}

export function formatSampleTime(timestamp: number): string {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(timestamp)
}
