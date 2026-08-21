interface Connection {
  id: string
  name: string
  host: string
  port: number
  user: string
  password: string
  database?: string
  proxyUrl?: string
}

type QueryRow = unknown[] | Record<string, unknown>

interface QueryResult {
  columns: string[]
  rows: QueryRow[]
  affectedRows?: number
  error?: string
}

interface PendingRequest {
  resolve: (value: any) => void
  reject: (reason: any) => void
  timer?: ReturnType<typeof setTimeout>
}

class MySQLClient {
  private ws: WebSocket | null = null
  private pendingRequests: Map<string, PendingRequest> = new Map()
  private connectionId: string | null = null
  private proxyUrl: string = 'ws://127.0.0.1:3000'
  private pendingConnectReject: ((reason: Error) => void) | null = null

  setProxyUrl(url: string): void {
    this.proxyUrl = url.trim() || 'ws://127.0.0.1:3000'
  }

  async connect(conn: Connection): Promise<string> {
    const previous = this.ws
    if (previous) {
      this.ws = null
      this.connectionId = null
      this.rejectPendingRequests(new Error('WebSocket连接已关闭'))
      this.pendingConnectReject?.(new Error('WebSocket连接已关闭'))
      this.pendingConnectReject = null
      previous.close()
    }

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.proxyUrl)
      this.ws = ws
      this.pendingConnectReject = reject

      ws.onopen = () => {
        if (this.ws !== ws) return
        this.sendRequest('connect', {
          host: conn.host,
          port: conn.port,
          user: conn.user,
          password: conn.password,
          database: conn.database
        }, ws).then((response: any) => {
          if (this.ws !== ws) return
          this.pendingConnectReject = null
          this.connectionId = response.connectionId
          resolve(response.connectionId)
        }).catch((error) => {
          if (this.ws === ws) this.pendingConnectReject = null
          reject(error)
        })
      }

      ws.onmessage = (event) => {
        if (this.ws !== ws) return
        try {
          const data = JSON.parse(event.data)
          const { id, type, payload } = data

          if (type === 'connected' || type === 'result' || type === 'disconnected' || type === 'error') {
            const pending = this.pendingRequests.get(id)
            if (pending) {
              if (pending.timer) clearTimeout(pending.timer)
              this.pendingRequests.delete(id)
              if (type === 'error' || payload?.message) {
                pending.reject(new Error(payload?.message || 'WebSocket请求失败'))
              } else {
                pending.resolve(payload)
              }
            }
          }
        } catch (error) {
          console.error('处理消息失败:', error)
        }
      }

      ws.onerror = () => {
        if (this.ws !== ws) return
        this.pendingConnectReject = null
        this.rejectPendingRequests(new Error('WebSocket连接失败'))
        reject(new Error('WebSocket连接失败'))
      }

      ws.onclose = () => {
        if (this.ws !== ws) return
        this.pendingConnectReject = null
        this.ws = null
        this.connectionId = null
        this.rejectPendingRequests(new Error('WebSocket连接已关闭'))
        reject(new Error('WebSocket连接已关闭'))
      }
    })
  }

  async query(sql: string): Promise<QueryResult> {
    if (!this.connectionId) {
      throw new Error('未连接到数据库')
    }

    try {
      const result = await this.sendRequest('query', {
        connectionId: this.connectionId,
        sql
      })
      return result
    } catch (error) {
      return {
        columns: [],
        rows: [],
        error: error instanceof Error ? error.message : '查询失败'
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this.connectionId && this.ws) {
      try {
        await this.sendRequest('disconnect', {
          connectionId: this.connectionId
        })
      } catch (error) {
        console.error('断开连接失败:', error)
      }
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.connectionId = null
  }

  private sendRequest(type: string, payload: any, socket: WebSocket | null = this.ws): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!socket || this.ws !== socket || socket.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket未连接'))
        return
      }

      const id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const pending: PendingRequest = { resolve, reject }
      this.pendingRequests.set(id, pending)

      socket.send(JSON.stringify({ type, id, payload }))

      // 超时处理
      pending.timer = setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id)
          reject(new Error('请求超时'))
        }
      }, 30000)
    })
  }

  private rejectPendingRequests(error: Error): void {
    for (const pending of this.pendingRequests.values()) {
      if (pending.timer) clearTimeout(pending.timer)
      pending.reject(error)
    }
    this.pendingRequests.clear()
  }
}

export const mysqlClient = new MySQLClient()
export type { Connection, QueryResult, QueryRow }
