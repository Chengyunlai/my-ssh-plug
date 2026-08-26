const CSS = `
:scope{height:100%;min-width:0;min-height:0;display:flex;flex-direction:column;overflow:auto;background:var(--myssh-plugin-bg);color:var(--myssh-plugin-text);font-family:var(--myssh-plugin-font-ui);font-size:13px;--monitor-border:var(--myssh-plugin-border);--monitor-surface:var(--myssh-plugin-surface);--monitor-raised:var(--myssh-plugin-surface-raised);--monitor-hover:var(--myssh-plugin-surface-hover);--monitor-text:var(--myssh-plugin-text);--monitor-strong:var(--myssh-plugin-text-strong);--monitor-muted:var(--myssh-plugin-text-muted);--monitor-accent:var(--myssh-plugin-accent);--monitor-success:var(--myssh-plugin-success);--monitor-warning:var(--myssh-plugin-warning);--monitor-danger:var(--myssh-plugin-danger);--monitor-space-1:var(--myssh-plugin-space-1);--monitor-space-2:var(--myssh-plugin-space-2);--monitor-space-3:var(--myssh-plugin-space-3);--monitor-space-4:var(--myssh-plugin-space-4);--monitor-radius-sm:var(--myssh-plugin-radius-sm);--monitor-radius-md:var(--myssh-plugin-radius-md);--monitor-radius-lg:var(--myssh-plugin-radius-lg)}
.monitor-shell{width:100%;min-height:100%;box-sizing:border-box;padding:18px 20px 24px}
.monitor-header{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:18px}
.monitor-title{display:flex;align-items:center;gap:11px;min-width:0}
.monitor-mark{display:inline-flex;align-items:flex-end;gap:3px;width:24px;height:24px;padding:4px;box-sizing:border-box;border:1px solid color-mix(in srgb,var(--monitor-accent) 35%,var(--monitor-border));border-radius:var(--monitor-radius-sm);background:color-mix(in srgb,var(--monitor-accent) 10%,var(--monitor-surface))}
.monitor-mark i{display:block;width:3px;border-radius:2px 2px 1px 1px;background:var(--monitor-accent)}
.monitor-mark i:nth-child(1){height:7px;opacity:.55}.monitor-mark i:nth-child(2){height:12px;opacity:.78}.monitor-mark i:nth-child(3){height:16px}
.monitor-title h1{margin:0;color:var(--monitor-strong);font-size:17px;line-height:1.25;font-weight:650;letter-spacing:-.01em;text-wrap:balance}
.monitor-subtitle{margin:4px 0 0;color:var(--monitor-muted);font-size:12px;line-height:1.4}
.monitor-actions{display:flex;align-items:center;gap:9px;flex-wrap:wrap;justify-content:flex-end}
.monitor-state{display:inline-flex;align-items:center;gap:6px;min-height:28px;padding:0 9px;border:1px solid var(--monitor-border);border-radius:999px;background:var(--monitor-surface);color:var(--monitor-muted);font-size:11px;white-space:nowrap}
.monitor-state-dot{width:6px;height:6px;border-radius:50%;background:var(--monitor-muted)}
.monitor-state.ready .monitor-state-dot{background:var(--monitor-success);box-shadow:0 0 0 3px color-mix(in srgb,var(--monitor-success) 16%,transparent)}
.monitor-state.loading .monitor-state-dot,.monitor-state.refreshing .monitor-state-dot{background:var(--monitor-accent);animation:monitor-pulse 1.2s ease-in-out infinite}
.monitor-state.warning .monitor-state-dot{background:var(--monitor-warning)}
.monitor-state.error .monitor-state-dot{background:var(--monitor-danger)}
.monitor-refresh{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 10px;border:1px solid var(--monitor-border);border-radius:var(--monitor-radius-sm);background:var(--monitor-raised);color:var(--monitor-text);font:inherit;font-size:11px;cursor:pointer;transition:background-color .18s ease,border-color .18s ease,color .18s ease,opacity .18s ease}
.monitor-refresh:hover{border-color:var(--monitor-accent);background:var(--monitor-hover);color:var(--monitor-strong)}
.monitor-refresh:active{background:color-mix(in srgb,var(--monitor-accent) 16%,var(--monitor-raised))}
.monitor-refresh:focus-visible{outline:2px solid var(--monitor-accent);outline-offset:2px}
.monitor-refresh:disabled{cursor:not-allowed;opacity:.45}
.monitor-refresh svg{width:13px;height:13px}
.monitor-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:12px}
.monitor-panel{display:grid;grid-template-rows:auto 1fr;min-width:0;border:1px solid var(--monitor-border);border-radius:var(--monitor-radius-md);background:var(--monitor-surface);overflow:hidden}
.monitor-panel.cpu-panel{grid-column:span 7}.monitor-panel.memory-panel{grid-column:span 5}.monitor-panel.storage-panel{grid-column:span 7}.monitor-panel.network-panel{grid-column:span 5}
.monitor-panel-header{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 14px;border-bottom:1px solid var(--monitor-border)}
.monitor-panel-title{display:flex;align-items:center;gap:8px;color:var(--monitor-strong);font-size:12px;font-weight:650}
.monitor-panel-title svg{width:15px;height:15px;color:var(--monitor-accent)}
.monitor-panel-meta{color:var(--monitor-muted);font-size:11px;white-space:nowrap}
.monitor-panel-body{min-height:0;padding:14px}
.cpu-panel .monitor-panel-body{display:flex;flex-direction:column}.cpu-panel .load-row{margin-top:auto}
.metric-layout{display:grid;grid-template-columns:minmax(146px,.74fr) minmax(0,1.26fr);align-items:stretch;gap:24px}
.metric-number{display:flex;align-items:baseline;gap:5px;color:var(--monitor-strong);font-size:33px;line-height:1;font-variant-numeric:tabular-nums;letter-spacing:-.03em}
.metric-number small{color:var(--monitor-muted);font-size:13px;letter-spacing:0}
.metric-caption{margin-top:7px;color:var(--monitor-muted);font-size:11px}
.metric-bar{height:7px;margin-top:16px;border-radius:999px;background:color-mix(in srgb,var(--monitor-muted) 17%,var(--monitor-surface));overflow:hidden}
.metric-bar-fill{height:100%;border-radius:inherit;background:var(--monitor-accent);transition:width .25s ease,background-color .18s ease}
.metric-bar-fill.warning{background:var(--monitor-warning)}.metric-bar-fill.danger{background:var(--monitor-danger)}
.metric-breakdown{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px 14px;margin-top:14px}
.breakdown-item{display:flex;justify-content:space-between;gap:8px;color:var(--monitor-muted);font-size:11px}.breakdown-item strong{color:var(--monitor-text);font-weight:550;font-variant-numeric:tabular-nums}
.chart-wrap{min-width:0}.chart-label{display:flex;justify-content:space-between;gap:8px;margin-bottom:6px;color:var(--monitor-muted);font-size:10px}.chart-label strong{color:var(--monitor-text);font-weight:550}
.chart-plot{display:grid;grid-template-columns:27px minmax(0,1fr);grid-template-rows:minmax(0,1fr) 15px;column-gap:5px;min-width:0;height:118px}.chart-y-axis{display:flex;grid-column:1;grid-row:1;flex-direction:column;justify-content:space-between;padding:0 0 1px;color:var(--monitor-muted);font-size:8px;line-height:1;font-variant-numeric:tabular-nums;text-align:right}.chart-surface{grid-column:2;grid-row:1;min-width:0}.sparkline{display:block;min-width:0;width:100%;height:100%;overflow:visible}.sparkline-grid{stroke:var(--monitor-border);stroke-width:.55;stroke-dasharray:1.3 2.8;opacity:.88}.sparkline-grid.vertical{opacity:.55}.sparkline-axis-line{stroke:var(--monitor-muted);stroke-width:.7;opacity:.72}.sparkline-area{pointer-events:none}.sparkline-line{fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}.chart-x-axis{display:flex;grid-column:2;grid-row:2;justify-content:space-between;gap:6px;color:var(--monitor-muted);font-size:8px;line-height:1;font-variant-numeric:tabular-nums;white-space:nowrap}.chart-x-axis span:nth-child(2){text-align:center}.chart-x-axis span:last-child{text-align:right}.chart-empty{display:flex;align-items:center;justify-content:center;width:100%;height:118px;border:1px dashed var(--monitor-border);border-radius:var(--monitor-radius-sm);color:var(--monitor-muted);font-size:10px}
.load-row{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:13px;padding-top:11px;border-top:1px solid var(--monitor-border)}
.load-label{color:var(--monitor-muted);font-size:11px}.load-values{display:flex;gap:14px;color:var(--monitor-text);font-size:11px;font-variant-numeric:tabular-nums}.load-values span{display:inline-flex;gap:4px}.load-values b{color:var(--monitor-muted);font-size:10px;font-weight:500}
.swap-line{display:flex;justify-content:space-between;gap:12px;margin-top:14px;padding-top:11px;border-top:1px solid var(--monitor-border);color:var(--monitor-muted);font-size:11px}.swap-line strong{color:var(--monitor-text);font-weight:550;font-variant-numeric:tabular-nums}
.disk-list{display:flex;flex-direction:column;gap:13px}.disk-row{min-width:0}.disk-heading{display:flex;justify-content:space-between;gap:10px;margin-bottom:6px;color:var(--monitor-text);font-size:11px}.disk-mount{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:var(--myssh-plugin-font-mono)}.disk-usage{color:var(--monitor-muted);font-variant-numeric:tabular-nums;white-space:nowrap}.disk-bar{height:5px;border-radius:999px;background:color-mix(in srgb,var(--monitor-muted) 17%,var(--monitor-surface));overflow:hidden}.disk-bar-fill{height:100%;border-radius:inherit;background:var(--monitor-success);transition:width .25s ease,background-color .18s ease}.disk-bar-fill.warning{background:var(--monitor-warning)}.disk-bar-fill.danger{background:var(--monitor-danger)}.disk-detail{display:flex;justify-content:space-between;gap:8px;margin-top:5px;color:var(--monitor-muted);font-size:10px;font-variant-numeric:tabular-nums}
.empty-inline{padding:18px 4px;color:var(--monitor-muted);font-size:11px;text-align:center}
.network-table{width:100%;border-collapse:collapse;font-size:11px}.network-table th{padding:0 0 8px;color:var(--monitor-muted);font-size:10px;font-weight:550;text-align:right}.network-table th:first-child,.network-table td:first-child{text-align:left}.network-table td{padding:8px 0;border-top:1px solid var(--monitor-border);color:var(--monitor-text);font-variant-numeric:tabular-nums;text-align:right}.network-table td:first-child{max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:var(--myssh-plugin-font-mono);color:var(--monitor-strong)}.network-table td:not(:first-child){padding-left:8px}.network-table .muted{color:var(--monitor-muted)}
.monitor-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:12px;color:var(--monitor-muted);font-size:10px}.monitor-footer strong{color:var(--monitor-text);font-weight:550}.monitor-notice{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.monitor-last-sampled{font-variant-numeric:tabular-nums;white-space:nowrap}
.monitor-alert{display:flex;align-items:flex-start;gap:9px;padding:12px 14px;margin-bottom:12px;border:1px solid color-mix(in srgb,var(--monitor-warning) 38%,var(--monitor-border));border-radius:var(--monitor-radius-md);background:color-mix(in srgb,var(--monitor-warning) 8%,var(--monitor-surface));color:var(--monitor-text);font-size:12px;line-height:1.45}.monitor-alert.error{border-color:color-mix(in srgb,var(--monitor-danger) 45%,var(--monitor-border));background:color-mix(in srgb,var(--monitor-danger) 8%,var(--monitor-surface))}.monitor-alert svg{flex:0 0 15px;margin-top:1px;color:var(--monitor-warning)}.monitor-alert.error svg{color:var(--monitor-danger)}.monitor-alert strong{display:block;color:var(--monitor-strong);font-weight:650}.monitor-alert span{display:block;color:var(--monitor-muted);font-size:11px}
.monitor-paused{display:flex;align-items:center;justify-content:center;gap:8px;min-height:100px;padding:16px;border:1px dashed var(--monitor-border);border-radius:var(--monitor-radius-md);color:var(--monitor-muted);font-size:12px}.monitor-paused svg{width:15px;height:15px}
@keyframes monitor-pulse{0%,100%{opacity:.45}50%{opacity:1}}
@media (max-width:760px){.monitor-shell{padding:14px}.monitor-header{align-items:flex-start;flex-direction:column}.monitor-actions{width:100%;justify-content:flex-start}.monitor-panel.cpu-panel,.monitor-panel.memory-panel,.monitor-panel.storage-panel,.monitor-panel.network-panel{grid-column:1/-1}.metric-layout{grid-template-columns:1fr}.monitor-footer{align-items:flex-start;flex-direction:column;gap:5px}}
@media (prefers-reduced-motion:reduce){.monitor-refresh,.metric-bar-fill,.disk-bar-fill{transition-duration:.01ms}.monitor-state.loading .monitor-state-dot{animation:none}}
`

let injected = false

export function getServerMonitorStyles(): string {
  return `@scope (.server-monitor) {${CSS}\n}`
}

export function injectStyles(): void {
  if (injected || typeof document === 'undefined') return
  const style = document.createElement('style')
  style.textContent = getServerMonitorStyles()
  document.head.appendChild(style)
  injected = true
}
