import type { ComponentType } from 'react'

export interface MySshPlugin {
  id: string
  name: string
  version: string
  description: string
  author?: string
  /** 分类(官方分类表,见核心仓库 docs/PLUGIN.md §5) */
  category?: string
  /** 支持的平台列表，如 ['win32', 'darwin', 'linux']，不声明则全平台支持 */
  platforms?: string[]
  /** 最低兼容 MySSH 版本(semver) */
  minAppVersion?: string
  /** 最高兼容 MySSH 版本(可选) */
  maxAppVersion?: string
  /** 官方标记:由构建脚本按 official.json 白名单盖章,插件自身声明无效 */
  official?: boolean
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
