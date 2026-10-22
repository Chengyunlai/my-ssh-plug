export interface KubernetesTarget {
  id: string; configId: string; context: string; namespace: string; service: string
  port: number; database: string; forwardable: boolean
}
export interface KubernetesForward { id: string; host: string; port: number; state: 'ready' | 'closed' }
export interface KubernetesApi {
  targets(): Promise<KubernetesTarget[]>
  forward(targetId: string): Promise<KubernetesForward>
  forwards(): Promise<KubernetesForward[]>
  stop(id: string): Promise<void>
}

/** A remote WebSocket proxy cannot reach a tunnel on this computer. */
export function validateKubernetesConnection(connection: { kubernetesTargetId?: string; proxyUrl?: string }, api?: KubernetesApi): void {
  if (!connection.kubernetesTargetId) return
  if (!api) throw new Error('当前 MySSH 不支持 Kubernetes 连接，请升级宿主')
  if (connection.proxyUrl?.trim()) {
    let proxy: URL
    try { proxy = new URL(connection.proxyUrl) } catch { throw new Error('代理地址无效') }
    if (!['ws:', 'wss:'].includes(proxy.protocol) || !['localhost', '127.0.0.1', '[::1]'].includes(proxy.hostname)) {
      throw new Error('Kubernetes 连接需要 MySSH 本机代理，不能使用远程代理')
    }
  }
}
