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
}

class MySQLClient {
  private ws: WebSocket | null = null
  private pendingRequests: Map<string, PendingRequest> = new Map()
  private connectionId: string | null = null
  private proxyUrl: string = 'ws://127.0.0.1:3000'

  setProxyUrl(url: string): void {
    this.proxyUrl = url.trim() || 'ws://127.0.0.1:3000'
  }

  async connect(conn: Connection): Promise<string> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.proxyUrl)

      this.ws.onopen = () => {
        this.sendRequest('connect', {
          host: conn.host,
          port: conn.port,
          user: conn.user,
          password: conn.password,
          database: conn.database
        }).then((response: any) => {
          this.connectionId = response.connectionId
          resolve(response.connectionId)
        }).catch(reject)
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          const { id, type, payload } = data

          if (type === 'connected' || type === 'result' || type === 'disconnected' || type === 'error') {
            const pending = this.pendingRequests.get(id)
            if (pending) {
              this.pendingRequests.delete(id)
              if (type === 'error' || payload.message) {
                pending.reject(new Error(payload.message))
              } else {
                pending.resolve(payload)
              }
            }
          }
        } catch (error) {
          console.error('处理消息失败:', error)
        }
      }

      this.ws.onerror = (error) => {
        reject(new Error('WebSocket连接失败'))
      }

      this.ws.onclose = () => {
        this.ws = null
        this.connectionId = null
        for (const [requestId, pending] of this.pendingRequests) {
          pending.reject(new Error('WebSocket连接已关闭'))
          this.pendingRequests.delete(requestId)
        }
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

  private sendRequest(type: string, payload: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket未连接'))
        return
      }

      const id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      this.pendingRequests.set(id, { resolve, reject })

      this.ws.send(JSON.stringify({ type, id, payload }))

      // 超时处理
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id)
          reject(new Error('请求超时'))
        }
      }, 30000)
    })
  }
}

export const mysqlClient = new MySQLClient()
export type { Connection, QueryResult, QueryRow }
