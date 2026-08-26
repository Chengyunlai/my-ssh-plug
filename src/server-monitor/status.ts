import type { MonitorErrorCode } from './types'

const ERROR_COPY: Record<MonitorErrorCode | 'insufficient-data', string> = {
  unsupported: '当前主机不是受支持的 Linux 环境，或缺少系统指标数据源。',
  timeout: '服务器响应超时，下一轮采样会自动重试。',
  'rate-limited': '采样请求过于频繁，已按宿主节流策略等待下一轮。',
  busy: '上一轮采样仍在进行中，下一轮会继续获取数据。',
  'insufficient-data': 'CPU 需要两个时间点才能计算使用率。',
  'session-not-found': 'SSH 会话已不存在，请返回终端并重新连接。',
  'not-ready': 'SSH 会话尚未就绪，请稍候。',
  'output-limit': '服务器返回的指标数据超过大小限制。',
  'remote-error': '服务器拒绝了指标采集请求。',
  'parse-error': '服务器指标格式无法识别。'
}

const EXPECTED_STATES = new Set<MonitorErrorCode>([
  'unsupported',
  'timeout',
  'rate-limited',
  'busy',
  'not-ready'
])

export function monitorStatusMessage(
  code: MonitorErrorCode | 'insufficient-data',
  fallback = ''
): string {
  return ERROR_COPY[code] || fallback
}

/** 文档要求的不可用/节流/等待状态是可恢复状态，不使用致命错误视觉。 */
export function isExpectedMonitorState(code: MonitorErrorCode | 'insufficient-data'): boolean {
  return code === 'insufficient-data' || EXPECTED_STATES.has(code as MonitorErrorCode)
}
