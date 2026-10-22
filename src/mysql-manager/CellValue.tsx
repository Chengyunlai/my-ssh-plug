import { useJsonInspector } from './JsonInspector'
import { formatCellValue } from './cell-value'

export default function CellValue({ value, field = 'JSON', row = 1 }: { value: unknown; field?: string; row?: number }): React.JSX.Element {
  const inspect = useJsonInspector()
  if (value == null) return <span className="null-value">NULL</span>
  const text = formatCellValue(value)
  if (typeof value === 'object' || typeof value === 'string') {
    const candidate = text.trim()
    if (candidate.startsWith('{') || candidate.startsWith('[')) {
      try {
        const json = JSON.parse(candidate)
        if (json !== null && typeof json === 'object') return <button type="button" className="json-cell-preview" title={`查看 ${field} 的完整 JSON`} onClick={() => inspect({ value: json, field, row })} onDoubleClick={event => event.stopPropagation()}><span className="json-cell-symbol">{Array.isArray(json) ? '[…]' : '{…}'}</span><span>{Object.keys(json).length} {Array.isArray(json) ? '项' : '个字段'}</span><span className="json-cell-open">查看</span></button>
      } catch { /* Ordinary text remains a text cell. */ }
    }
  }
  if (text.length <= 120 && !text.includes('\n')) return <span title={text}>{text}</span>
  return <details style={{ whiteSpace: 'normal', minWidth: 160 }}>
    <summary title="点击展开完整内容">{text.slice(0, 80)}…</summary>
    <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', maxHeight: 400, overflow: 'auto', margin: '8px 0', userSelect: 'text' }}>{text}</pre>
  </details>
}
