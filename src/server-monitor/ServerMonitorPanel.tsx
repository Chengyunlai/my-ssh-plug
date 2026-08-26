import { useCallback, useEffect, useRef, useState } from 'react'
import { appendHistory, calculateNetworkRates, formatBytes, formatSampleTime, formatUptime, type MetricHistoryPoint } from './metrics'
import { createSnapshotPoller } from './polling'
import { isExpectedMonitorState, monitorStatusMessage } from './status'
import type { NetworkRate, SystemMetricsResult, SystemMetricsSnapshot } from './types'

type PanelPhase = 'loading' | 'refreshing' | 'ready' | 'warning' | 'error' | 'paused'

function usageTone(value: number): '' | 'warning' | 'danger' {
  if (value >= 90) return 'danger'
  if (value >= 75) return 'warning'
  return ''
}

function formatPercent(value: number | null): string {
  return value === null ? '采样中' : `${Math.round(value)}%`
}

function formatLoad(value: number): string {
  return value.toFixed(2)
}

function RefreshIcon(): React.JSX.Element {
  return <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M13.25 5.3A5.25 5.25 0 1 0 13.5 9" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round"/><path d="M10.8 5.3h2.65V2.65" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round"/></svg>
}

function PauseIcon(): React.JSX.Element {
  return <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M5.25 3.5v9M10.75 3.5v9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
}

function AlertIcon(): React.JSX.Element {
  return <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m8 2.2 5.7 10.1c.24.43-.07.96-.56.96H2.86c-.49 0-.8-.53-.56-.96L8 2.2Z" stroke="currentColor" strokeWidth="1.15"/><path d="M8 5.3v3.35M8 10.9v.1" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round"/></svg>
}

function CpuIcon(): React.JSX.Element {
  return <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="4.1" y="4.1" width="7.8" height="7.8" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M6.3 1.9v2M9.7 1.9v2M6.3 12.1v2M9.7 12.1v2M1.9 6.3h2M1.9 9.7h2M12.1 6.3h2M12.1 9.7h2" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round"/></svg>
}

function MemoryIcon(): React.JSX.Element {
  return <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="2.2" y="4.35" width="11.6" height="7.3" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M5 6.4h1.4v3.2H5zM8 6.4h1.4v3.2H8zM11 6.4h.1M4.2 2.3v2M7.1 2.3v2M10 2.3v2M4.2 11.65v2M7.1 11.65v2M10 11.65v2" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round"/></svg>
}

function DiskIcon(): React.JSX.Element {
  return <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 2.5h8.5L13 4v9.5H3V2.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M5 2.7v3h5v-3M5.2 10.7h5.6v2.2H5.2z" stroke="currentColor" strokeWidth="1.05"/><circle cx="11.4" cy="7.8" r=".65" fill="currentColor"/></svg>
}

function NetworkIcon(): React.JSX.Element {
  return <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="3.2" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.2"/><circle cx="12.8" cy="3.4" r="1.5" stroke="currentColor" strokeWidth="1.2"/><circle cx="12.8" cy="12.6" r="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="m4.5 7.3 6.9-3.2M4.5 8.7l6.9 3.2" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round"/></svg>
}

interface CurvePoint { x: number; y: number }

function curvePath(points: CurvePoint[]): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`
  let path = `M ${points[0].x} ${points[0].y}`
  for (let index = 0; index < points.length - 1; index += 1) {
    const before = points[index - 1] ?? points[index]
    const start = points[index]
    const end = points[index + 1]
    const after = points[index + 2] ?? end
    const control1 = { x: start.x + (end.x - before.x) / 6, y: start.y + (end.y - before.y) / 6 }
    const control2 = { x: end.x - (after.x - start.x) / 6, y: end.y - (after.y - start.y) / 6 }
    path += ` C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${end.x} ${end.y}`
  }
  return path
}

function niceCeiling(value: number): number {
  if (value <= 10) return Math.max(1, Math.ceil(value))
  if (value <= 50) return Math.ceil(value / 5) * 5
  return Math.ceil(value / 10) * 10
}

function niceFloor(value: number): number {
  if (value <= 10) return Math.floor(value)
  if (value <= 50) return Math.floor(value / 5) * 5
  return Math.floor(value / 10) * 10
}

function Sparkline({ history, field, color, label, autoScale = false }: { history: MetricHistoryPoint[]; field: 'cpuPercent' | 'memoryPercent'; color: string; label: string; autoScale?: boolean }): React.JSX.Element {
  const values = history.map((point) => point[field]).filter((value): value is number => value !== null)
  if (values.length < 2) return <div className="chart-empty">等待第二个采样点</div>
  const rawMax = Math.max(...values)
  const rawMin = Math.min(...values)
  const axisMax = autoScale ? Math.min(100, niceCeiling(rawMax * 1.2)) : 100
  const axisMin = autoScale ? Math.max(0, niceFloor(rawMin * .8)) : 0
  const axisRange = Math.max(1, axisMax - axisMin)
  const points = values.map((value, index) => {
    return {
      x: 2 + (index / Math.max(1, values.length - 1)) * 96,
      y: 4 + (1 - Math.max(0, Math.min(axisMax, value) - axisMin) / axisRange) * 32
    }
  })
  const line = curvePath(points)
  const last = points[points.length - 1]
  const horizonSeconds = Math.max(0, (values.length - 1) * 3)
  return (
    <>
      <div className="chart-plot">
        <svg className="sparkline" viewBox="0 0 100 42" preserveAspectRatio="none" role="img" aria-label={`${label}趋势`}>
          <title>{label}最近 {horizonSeconds} 秒趋势</title>
          <line className="sparkline-grid" x1="2" y1="4" x2="98" y2="4" />
          <line className="sparkline-grid" x1="2" y1="20" x2="98" y2="20" />
          <line className="sparkline-grid" x1="2" y1="36" x2="98" y2="36" />
          <path className="sparkline-line" d={line} stroke={color} />
          <circle className="sparkline-point-halo" cx={last.x} cy={last.y} r="2.7" fill={color} />
          <circle className="sparkline-point" cx={last.x} cy={last.y} r="1.35" stroke={color} />
        </svg>
      </div>
      <div className="chart-axis" aria-hidden="true"><span>{horizonSeconds > 0 ? `过去 ${horizonSeconds} 秒` : '最近'}</span><span>现在</span></div>
    </>
  )
}

function MetricBar({ value, label }: { value: number; label: string }): React.JSX.Element {
  const tone = usageTone(value)
  return <div className="metric-bar" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value)}><div className={`metric-bar-fill ${tone}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>
}

function ServerMonitorPanel({ sessionId, active = true }: { sessionId: string; active?: boolean }): React.JSX.Element {
  const [snapshot, setSnapshot] = useState<SystemMetricsSnapshot | null>(null)
  const [history, setHistory] = useState<MetricHistoryPoint[]>([])
  const [networkRates, setNetworkRates] = useState<NetworkRate[]>([])
  const [phase, setPhase] = useState<PanelPhase>(active ? 'loading' : 'paused')
  const [message, setMessage] = useState('正在连接指标采集…')
  const [lastSampledAt, setLastSampledAt] = useState<number | null>(null)
  const previousSnapshot = useRef<SystemMetricsSnapshot | null>(null)
  const activeRef = useRef(active)
  const sessionRef = useRef(sessionId)
  activeRef.current = active
  sessionRef.current = sessionId

  const requestSnapshot = useCallback(async () => {
    if (!active) return
    setPhase((current) => current === 'ready' || current === 'warning' ? 'refreshing' : 'loading')
    try {
      const result: SystemMetricsResult = await window.ssh.monitor.getSnapshot(sessionId)
      if (!activeRef.current || sessionRef.current !== sessionId) return
      if (!result.ok) {
        const isWarning = isExpectedMonitorState(result.error.code)
        setPhase(isWarning ? 'warning' : 'error')
        setMessage(monitorStatusMessage(result.error.code, result.error.message))
        return
      }
      const next = result.snapshot
      setSnapshot(next)
      setNetworkRates(calculateNetworkRates(previousSnapshot.current, next))
      setHistory((current) => appendHistory(current, next))
      previousSnapshot.current = next
      setLastSampledAt(next.sampledAt)
      if (next.cpu.sampleStatus === 'insufficient-data') {
        setPhase('warning')
        setMessage(monitorStatusMessage('insufficient-data'))
      } else {
        setPhase('ready')
        setMessage('每 3 秒自动更新')
      }
    } catch (error) {
      if (!activeRef.current || sessionRef.current !== sessionId) return
      setPhase('error')
      setMessage(error instanceof Error ? error.message : '无法连接服务器指标接口。')
    }
  }, [active, sessionId])

  useEffect(() => {
    previousSnapshot.current = null
    setSnapshot(null)
    setHistory([])
    setNetworkRates([])
    setLastSampledAt(null)
    setPhase(active ? 'loading' : 'paused')
    setMessage(active ? '正在连接指标采集…' : '面板未激活，已暂停采样')
  }, [sessionId])

  useEffect(() => {
    if (!active) {
      setPhase('paused')
      setMessage('面板未激活，已暂停采样')
      return
    }
    const poller = createSnapshotPoller(requestSnapshot)
    poller.start()
    return () => poller.stop()
  }, [active, requestSnapshot])

  const serverName = snapshot?.platform === 'linux' ? 'Linux 主机' : '服务器'
  const isError = phase === 'error'
  const statusLabel = phase === 'paused' ? '已暂停' : phase === 'loading' ? '连接中' : phase === 'refreshing' ? '更新中' : phase === 'ready' ? '实时' : isError ? '需要注意' : '等待重试'
  const alertVisible = phase === 'error' || phase === 'warning'
  const totalNetwork = networkRates.reduce((sum, item) => sum + (item.rxBytesPerSecond ?? 0) + (item.txBytesPerSecond ?? 0), 0)

  return (
    <div className="server-monitor">
      <div className="monitor-shell">
        <header className="monitor-header">
          <div className="monitor-title">
            <span className="monitor-mark" aria-hidden="true"><i /><i /><i /></span>
            <div>
              <h1>服务器监控</h1>
              <p className="monitor-subtitle">{serverName} · 当前 SSH 会话</p>
            </div>
          </div>
          <div className="monitor-actions">
            <span className={`monitor-state ${phase}`} role="status"><i className="monitor-state-dot" />{statusLabel}</span>
            <button className="monitor-refresh" type="button" onClick={() => void requestSnapshot()} disabled={!active || phase === 'loading' || phase === 'refreshing'}><RefreshIcon />刷新</button>
          </div>
        </header>

        {!active && <div className="monitor-paused"><PauseIcon />切换到监控面板后，将自动恢复每 3 秒采样。</div>}
        {alertVisible && <div className={`monitor-alert ${isError ? 'error' : ''}`} role="status"><AlertIcon /><div><strong>{isError ? '指标暂时不可用' : '采样状态'}</strong><span>{message}</span></div></div>}

        {snapshot && <div className="monitor-grid">
          <section className="monitor-panel cpu-panel" aria-labelledby="cpu-title">
            <div className="monitor-panel-header"><div className="monitor-panel-title" id="cpu-title"><CpuIcon />CPU</div><span className="monitor-panel-meta">负载 {formatLoad(snapshot.cpu.load1)}</span></div>
            <div className="monitor-panel-body">
              <div className="metric-layout">
                <div><div className="metric-number">{formatPercent(snapshot.cpu.usagePercent)}<small>使用率</small></div><div className="metric-caption">{snapshot.cpu.sampleStatus === 'ready' ? '最近采样' : '等待下一次采样'}</div>{snapshot.cpu.usagePercent !== null && <MetricBar value={snapshot.cpu.usagePercent} label="CPU 使用率" />}</div>
                <div className="chart-wrap"><div className="chart-label"><span>使用率趋势</span><strong>最近 {history.length} 次</strong></div><Sparkline history={history} field="cpuPercent" color="var(--monitor-accent)" label="CPU 使用率" autoScale /></div>
              </div>
              <div className="load-row"><span className="load-label">系统负载</span><div className="load-values"><span><b>1m</b>{formatLoad(snapshot.cpu.load1)}</span><span><b>5m</b>{formatLoad(snapshot.cpu.load5)}</span><span><b>15m</b>{formatLoad(snapshot.cpu.load15)}</span></div></div>
            </div>
          </section>

          <section className="monitor-panel memory-panel" aria-labelledby="memory-title">
            <div className="monitor-panel-header"><div className="monitor-panel-title" id="memory-title"><MemoryIcon />内存</div><span className="monitor-panel-meta">{formatBytes(snapshot.memory.usedBytes)} / {formatBytes(snapshot.memory.totalBytes)}</span></div>
            <div className="monitor-panel-body">
              <div className="metric-layout"><div><div className="metric-number">{formatPercent(snapshot.memory.usagePercent)}<small>已使用</small></div><div className="metric-caption">可用 {formatBytes(snapshot.memory.availableBytes)}</div><MetricBar value={snapshot.memory.usagePercent} label="内存使用率" /></div><div className="chart-wrap"><div className="chart-label"><span>内存趋势</span><strong>最近 {history.length} 次</strong></div><Sparkline history={history} field="memoryPercent" color="var(--monitor-success)" label="内存使用率" /></div></div>
              <div className="metric-breakdown"><div className="breakdown-item"><span>总量</span><strong>{formatBytes(snapshot.memory.totalBytes)}</strong></div><div className="breakdown-item"><span>已用</span><strong>{formatBytes(snapshot.memory.usedBytes)}</strong></div><div className="breakdown-item"><span>可用</span><strong>{formatBytes(snapshot.memory.availableBytes)}</strong></div><div className="breakdown-item"><span>Swap</span><strong>{formatPercent(snapshot.memory.swapUsagePercent)}</strong></div></div>
              <div className="swap-line"><span>Swap 使用</span><strong>{formatBytes(snapshot.memory.swapUsedBytes)} / {formatBytes(snapshot.memory.swapTotalBytes)}</strong></div>
            </div>
          </section>

          <section className="monitor-panel storage-panel" aria-labelledby="storage-title">
            <div className="monitor-panel-header"><div className="monitor-panel-title" id="storage-title"><DiskIcon />磁盘空间</div><span className="monitor-panel-meta">{snapshot.disks.length} 个挂载点</span></div>
            <div className="monitor-panel-body"><div className="disk-list">{snapshot.disks.length === 0 ? <div className="empty-inline">未发现磁盘挂载点</div> : snapshot.disks.map((disk) => { const tone = usageTone(disk.usagePercent); return <div className="disk-row" key={disk.mountPoint}><div className="disk-heading"><span className="disk-mount" title={disk.mountPoint}>{disk.mountPoint}</span><span className="disk-usage">{Math.round(disk.usagePercent)}%</span></div><div className="disk-bar"><div className={`disk-bar-fill ${tone}`} style={{ width: `${Math.max(0, Math.min(100, disk.usagePercent))}%` }} /></div><div className="disk-detail"><span>{formatBytes(disk.usedBytes)} 已用</span><span>{formatBytes(disk.availableBytes)} 可用 · {formatBytes(disk.totalBytes)} 总量</span></div></div> })}</div></div>
          </section>

          <section className="monitor-panel network-panel" aria-labelledby="network-title">
            <div className="monitor-panel-header"><div className="monitor-panel-title" id="network-title"><NetworkIcon />网络</div><span className="monitor-panel-meta">总吞吐 {formatBytes(networkRates.length ? totalNetwork : null, true)}</span></div>
            <div className="monitor-panel-body"><table className="network-table"><thead><tr><th>接口</th><th>接收</th><th>发送</th></tr></thead><tbody>{snapshot.network.length === 0 ? <tr><td colSpan={3} className="muted">未发现网络接口</td></tr> : snapshot.network.map((item) => { const rate = networkRates.find((entry) => entry.interface === item.interface); return <tr key={item.interface}><td title={item.interface}>{item.interface}</td><td className={rate?.rxBytesPerSecond === null || rate?.rxBytesPerSecond === undefined ? 'muted' : ''}>{formatBytes(rate?.rxBytesPerSecond ?? null, true)}</td><td className={rate?.txBytesPerSecond === null || rate?.txBytesPerSecond === undefined ? 'muted' : ''}>{formatBytes(rate?.txBytesPerSecond ?? null, true)}</td></tr> })}</tbody></table></div>
          </section>
        </div>}

        {!snapshot && (phase === 'loading' || phase === 'refreshing') && <div className="monitor-paused">正在读取服务器指标…</div>}
        <footer className="monitor-footer"><span className="monitor-notice">{message}</span><span className="monitor-last-sampled">{lastSampledAt ? <>上次更新 <strong>{formatSampleTime(lastSampledAt)}</strong> · 运行 {formatUptime(snapshot?.uptimeSeconds || 0)}</> : '等待首次采样'}</span></footer>
      </div>
    </div>
  )
}

export default ServerMonitorPanel
