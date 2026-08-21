import { WebSocket, WebSocketServer } from 'ws'
import mysql from 'mysql2/promise'
import { registerSocketPool } from './socket-pools.js'
import {
  DEFAULT_PROXY_HOST,
  parseAllowedOrigins,
  isRequestAllowed,
  validateProxyConfig
} from './security.js'

const PORT = Number(process.env.MYSSH_RUNTIME_PORT || process.env.PORT || 3000)
const HOST = process.env.MYSSH_RUNTIME_HOST || process.env.HOST || DEFAULT_PROXY_HOST
const ACCESS_TOKEN = process.env.ACCESS_TOKEN?.trim() || ''
const ALLOWED_ORIGINS = parseAllowedOrigins(process.env.ALLOWED_ORIGINS)

validateProxyConfig({ host: HOST, allowedOrigins: ALLOWED_ORIGINS, accessToken: ACCESS_TOKEN })

const wss = new WebSocketServer({ host: HOST, port: PORT })

function writeReadyHandshake() {
  const address = wss.address()
  if (!address || typeof address === 'string') return
  console.log(`MYSSH_RUNTIME_READY ${JSON.stringify({ port: address.port })}`)
}

wss.on('listening', () => {
  const address = wss.address()
  const port = address && typeof address !== 'string' ? address.port : PORT
  console.log(`MySQL WebSocket代理服务启动在 ${HOST}:${port}`)
  if (process.env.MYSSH_RUNTIME_PROTOCOL === 'node-companion-v1') writeReadyHandshake()
})

// 存储连接池
const pools = new Map()

// 生成连接ID
function generateConnectionId() {
  return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 处理消息
async function handleMessage(ws, message, socketConnections) {
  try {
    const data = JSON.parse(message)
    const { type, id, payload } = data

    switch (type) {
      case 'connect': {
        const { host, port, user, password, database } = payload
        const connectionId = generateConnectionId()
        let pool

        try {
          pool = mysql.createPool({
            host,
            port: Number(port) || 3306,
            user,
            password,
            database,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            connectTimeout: 10000
          })

          const conn = await pool.getConnection()
          conn.release()
          const registered = await registerSocketPool({
            connectionId,
            pool,
            pools,
            socketConnections,
            socketIsOpen: ws.readyState === WebSocket.OPEN
          })
          if (!registered) return

          ws.send(JSON.stringify({
            type: 'connected',
            id,
            payload: { connectionId }
          }))
        } catch (connErr) {
          if (!pools.has(connectionId)) await pool?.end().catch(() => {})
          if (ws.readyState !== WebSocket.OPEN) return
          ws.send(JSON.stringify({
            type: 'error',
            id,
            payload: { message: connErr.message }
          }))
        }
        break
      }

      case 'query': {
        const { connectionId, sql } = payload
        const pool = pools.get(connectionId)
        
        if (!pool) {
          ws.send(JSON.stringify({
            type: 'error',
            id,
            payload: { message: '连接不存在或已关闭' }
          }))
          return
        }

        try {
          const [rows, fields] = await pool.query(sql)
          
          if (Array.isArray(rows)) {
            const columns = fields?.map(f => f.name) || []
            ws.send(JSON.stringify({
              type: 'result',
              id,
              payload: {
                columns,
                rows,
                affectedRows: undefined
              }
            }))
          } else {
            ws.send(JSON.stringify({
              type: 'result',
              id,
              payload: {
                columns: [],
                rows: [],
                affectedRows: rows.affectedRows
              }
            }))
          }
        } catch (queryError) {
          ws.send(JSON.stringify({
            type: 'error',
            id,
            payload: { message: queryError.message }
          }))
        }
        break
      }

      case 'disconnect': {
        const { connectionId } = payload
        const pool = pools.get(connectionId)
        if (pool) {
          await pool.end()
          pools.delete(connectionId)
          socketConnections.delete(connectionId)
        }
        ws.send(JSON.stringify({
          type: 'disconnected',
          id,
          payload: {}
        }))
        break
      }

      default:
        ws.send(JSON.stringify({
          type: 'error',
          id,
          payload: { message: `未知的消息类型: ${type}` }
        }))
    }
  } catch (error) {
    ws.send(JSON.stringify({
      type: 'error',
      id: null,
      payload: { message: error.message }
    }))
  }
}

// WebSocket连接处理
wss.on('connection', (ws, req) => {
  const origin = req.headers.origin
  let requestToken = ''
  try {
    requestToken = new URL(req.url || '/', `ws://${HOST}:${PORT}`).searchParams.get('token') || ''
  } catch {
    requestToken = ''
  }
  if (!isRequestAllowed({ origin, allowedOrigins: ALLOWED_ORIGINS, accessToken: ACCESS_TOKEN, requestToken })) {
    console.log(`拒绝连接，来源: ${origin}`)
    ws.close(1008, '来源不允许')
    return
  }

  console.log('新的WebSocket连接')
  const socketConnections = new Set()

  ws.on('message', (data) => {
    handleMessage(ws, data.toString(), socketConnections)
  })

  ws.on('close', () => {
    console.log('WebSocket连接关闭')
    for (const connectionId of socketConnections) {
      const pool = pools.get(connectionId)
      if (pool) pool.end().catch(() => {})
      pools.delete(connectionId)
    }
    socketConnections.clear()
  })

  ws.on('error', (error) => {
    console.error('WebSocket错误:', error)
  })
})

// 优雅关闭
async function shutdown() {
  console.log('正在关闭代理服务...')
  
  for (const [id, pool] of pools) {
    try {
      await pool.end()
    } catch (error) {
      console.error(`关闭连接池 ${id} 失败:`, error)
    }
  }
  
  wss.close(() => {
    console.log('代理服务已关闭')
    process.exit(0)
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
