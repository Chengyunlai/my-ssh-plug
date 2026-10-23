import type { SystemMetricsResult } from './server-monitor/types'

declare global {
  interface Window {
    ssh: {
      kubernetes?: import('./mysql-manager/kubernetes').KubernetesApi
      copyText(text: string): void
      monitor: {
        getSnapshot(sessionId: string): Promise<SystemMetricsResult>
      }
    }
  }
}

export {}
