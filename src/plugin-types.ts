import type { ComponentType } from 'react'

export interface MySshPlugin {
  id: string
  name: string
  version: string
  description: string
  author?: string
  /** 外部插件由市场分发,恒为 false(核心侧自动覆盖) */
  builtin?: boolean
  /** 首次安装后的默认状态,缺省为启用 */
  defaultEnabled?: boolean
  panel?: {
    title: string
    scope?: 'app' | 'session'
    Component: ComponentType<Record<string, unknown>> | ComponentType<{ sessionId: string }>
  }
  widget?: {
    placement: 'terminal-bottom'
    Component: ComponentType<{ sessionId: string; profile: unknown }>
  }
}

export function definePlugin<T extends MySshPlugin>(plugin: T): T {
  return plugin
}
