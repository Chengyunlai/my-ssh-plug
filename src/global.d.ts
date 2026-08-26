import type { SystemMetricsResult } from './server-monitor/types'

declare global {
  interface Window {
    ssh: {
      copyText(text: string): void
      monitor: {
        getSnapshot(sessionId: string): Promise<SystemMetricsResult>
      }
    }
  }
}

export {}
