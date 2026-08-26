import { definePlugin } from '../plugin-types'
import ServerMonitorPanel from './ServerMonitorPanel'
import { injectStyles } from './inject-styles'

injectStyles()

export default definePlugin({
  id: 'server-monitor',
  name: '服务器监控',
  version: '0.1.0',
  description: '监控当前 SSH 会话服务器的 CPU、内存、磁盘、网络与运行时间',
  author: 'MySSH',
  category: 'monitor',
  builtin: false,
  defaultEnabled: false,
  panel: {
    title: '服务器监控',
    scope: 'session',
    layout: 'workspace',
    Component: ServerMonitorPanel
  }
})
