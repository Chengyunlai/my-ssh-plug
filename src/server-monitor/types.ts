export type MonitorErrorCode =
  | 'session-not-found'
  | 'not-ready'
  | 'unsupported'
  | 'timeout'
  | 'output-limit'
  | 'rate-limited'
  | 'busy'
  | 'remote-error'
  | 'parse-error'

export interface MonitorError {
  code: MonitorErrorCode
  message: string
  retryAfterMs?: number
}

export interface SystemMetricsSnapshot {
  sampledAt: number
  platform: 'linux'
  cpu: {
    usagePercent: number | null
    load1: number
    load5: number
    load15: number
    sampleStatus: 'ready' | 'insufficient-data'
  }
  memory: {
    totalBytes: number
    usedBytes: number
    availableBytes: number
    usagePercent: number
    swapTotalBytes: number
    swapUsedBytes: number
    swapUsagePercent: number
  }
  disks: Array<{
    mountPoint: string
    totalBytes: number
    usedBytes: number
    availableBytes: number
    usagePercent: number
  }>
  network: Array<{
    interface: string
    rxBytes: number
    txBytes: number
  }>
  uptimeSeconds: number
}

export type SystemMetricsResult =
  | { ok: true; snapshot: SystemMetricsSnapshot }
  | { ok: false; error: MonitorError }

export interface NetworkRate {
  interface: string
  rxBytesPerSecond: number | null
  txBytesPerSecond: number | null
  rxBytes: number
  txBytes: number
}
