import { WebSocketServer } from 'ws'
import mysql from 'mysql2/promise'

const PORT = process.env.PORT || 3000
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['*']

const wss = new WebSocketServer({ port: PORT })

console.log(`MySQL WebSocket代理服务启动在端口 ${PORT}`)

// 存储连接池
const pools = new Map()

// 验证来源
function checkOrigin(origin) {
  if (ALLOWED_ORIGINS.includes('*')) return true
  return ALLOWED_ORIGINS.some(allowed => origin?.includes(allowed))
}

// 生成连接ID
function generateConnectionId() {
  return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 处理消息
async function handleMessage(ws, message) {
  try {
    const data = JSON.parse(message)
    const { type, id, payload } = data

    switch (type) {
      case 'connect': {
        const { host, port, user, password, database } = payload
        const connectionId = generateConnectionId()

        try {
          const pool = mysql.createPool({
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
          pools.set(connectionId, pool)

          ws.send(JSON.stringify({
            type: 'connected',
            id,
            payload: { connectionId }
          }))
        } catch (connErr) {
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
  if (!checkOrigin(origin)) {
    console.log(`拒绝连接，来源: ${origin}`)
    ws.close(1008, '来源不允许')
    return
  }

  console.log('新的WebSocket连接')

  ws.on('message', (data) => {
    handleMessage(ws, data.toString())
  })

  ws.on('close', () => {
    console.log('WebSocket连接关闭')
  })

  ws.on('error', (error) => {
    console.error('WebSocket错误:', error)
  })
})

// 优雅关闭
process.on('SIGINT', async () => {
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
})