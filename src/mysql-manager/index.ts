import { definePlugin } from '../plugin-types'
import { injectStyles } from './inject-styles'
import MySqlManager from './MySqlManager'

injectStyles()

export default definePlugin({
  id: 'mysql-manager',
  name: 'MySQL 管理器',
  version: '1.1.0',
  description: 'MySQL数据库管理工具:连接管理、表结构查看、SQL查询执行',
  author: 'MySSH',
  category: 'tool',
  minAppVersion: '1.3.0',
  builtin: false,
  defaultEnabled: false,
  runtime: {
    kind: 'node-companion-v1',
    transport: 'websocket',
    lifecycle: 'on-demand'
  },
  panel: {
    title: 'MySQL 管理器',
    scope: 'app',
    layout: 'workspace',
    Component: MySqlManager
  }
})
