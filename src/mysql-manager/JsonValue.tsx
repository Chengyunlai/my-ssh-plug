import { useState } from 'react'

function JsonNode({ value, label, depth = 0, query = '' }: { value: unknown; label?: string; depth?: number; query?: string }): React.JSX.Element {
  const [open, setOpen] = useState(depth === 0)
  const [limit, setLimit] = useState(100)
  const complex = value !== null && typeof value === 'object'
  const prefix = label === undefined ? null : <><span className="json-key">{JSON.stringify(label)}</span><span className="json-punctuation">: </span></>
  if (!complex) {
    const kind = value === null ? 'null' : typeof value
    return <div className="json-leaf">{prefix}<span className={`json-${kind}`}>{JSON.stringify(value)}</span></div>
  }
  const array = Array.isArray(value)
  const allEntries = Object.entries(value as Record<string, unknown>)
  const entries = query ? allEntries.filter(([key, child]) => (key + ' ' + JSON.stringify(child)).toLowerCase().includes(query.toLowerCase())) : allEntries
  const expanded = query.length > 0 || open
  const brackets = array ? ['[', ']'] : ['{', '}']
  if (!allEntries.length) return <div className="json-leaf">{prefix}<span className="json-punctuation">{brackets.join('')}</span><span className="json-meta">空{array ? '数组' : '对象'}</span></div>
  return <div className="json-node">
    <button type="button" className="json-node-toggle" aria-expanded={expanded} onClick={() => setOpen(!open)}>
      <span className="json-chevron" aria-hidden="true">{expanded ? '▾' : '▸'}</span>{prefix}<span className="json-punctuation">{brackets[0]}{!expanded && ` … ${brackets[1]}`}</span><span className="json-meta">{allEntries.length} {array ? '项' : '个字段'}</span>
    </button>
    {expanded && <><div className="json-children">
      {depth >= 20 ? <pre className="json-raw">{JSON.stringify(value, null, 2)}</pre> : entries.slice(0, limit).map(([key, child]) => <JsonNode key={key} value={child} label={key} depth={depth + 1} query={key.toLowerCase().includes(query.toLowerCase()) ? '' : query} />)}
      {depth < 20 && entries.length > limit && <button type="button" className="json-more" onClick={() => setLimit(limit + 100)}>再显示 {Math.min(100, entries.length - limit)} 项（剩余 {entries.length - limit}）</button>}
    </div><div className="json-closing">{brackets[1]}</div></>}
  </div>
}

export default function JsonValue({ value }: { value: object }): React.JSX.Element {
  const [mode, setMode] = useState<'tree' | 'raw'>('tree')
  const [copyState, setCopyState] = useState('')
  const [query, setQuery] = useState('')
  const text = JSON.stringify(value, null, 2)
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopyState('已复制') }
    catch { setCopyState('复制失败，请在原文中选中复制') }
  }
  return <div className="json-viewer" onDoubleClick={event => event.stopPropagation()}>
    <div className="json-toolbar">
      <span className="json-badge">JSON</span>
      <div className="json-modes" role="group" aria-label="JSON 显示方式">
        <button type="button" aria-pressed={mode === 'tree'} onClick={() => setMode('tree')}>树形</button>
        <button type="button" aria-pressed={mode === 'raw'} onClick={() => setMode('raw')}>原文</button>
      </div>
      <button type="button" className="json-copy" onClick={() => void copy()}>复制 JSON</button>
    </div>
    {copyState && <div className="json-copy-status" role="status">{copyState}</div>}
    <input className="json-search" aria-label="搜索 JSON 键或值" placeholder="搜索键或值…" value={query} onChange={event => { setQuery(event.target.value); setMode('tree') }} />
    <div className="json-body">{mode === 'tree' ? <JsonNode key={query} value={value} query={query} /> : <pre className="json-raw" tabIndex={0}>{text}</pre>}</div>
  </div>
}
