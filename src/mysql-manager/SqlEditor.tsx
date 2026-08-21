import { useRef } from 'react'

interface Props {
  sql: string
  onSqlChange: (sql: string) => void
  onExecute: (sql: string) => void
  loading: boolean
  disabled: boolean
  history?: string[]
  onSelectHistory?: (sql: string) => void
}

export default function SqlEditor({ sql, onSqlChange, onExecute, loading, disabled, history = [], onSelectHistory }: Props): React.JSX.Element {
  const ref = useRef<HTMLTextAreaElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      if (!loading && !disabled && sql.trim()) onExecute(sql)
    }
  }

  const formatSql = () => {
    const formatted = sql.trim().replace(/\s+/g, ' ').replace(/\b(SELECT|FROM|WHERE|GROUP BY|ORDER BY|LIMIT|INSERT INTO|VALUES|UPDATE|SET|DELETE FROM|JOIN|LEFT JOIN|RIGHT JOIN|INNER JOIN|CREATE TABLE|ALTER TABLE)\b/gi, '\n$1').trim()
    onSqlChange(formatted)
  }

  return (
    <div className="sql-editor">
      <div className="sql-editor-header">
        <div className="sql-title"><span className="sql-dot" />SQL 查询</div>
        <div className="sql-editor-actions">
          {history.length > 0 && <select className="history-select" value="" onChange={e => e.target.value && onSelectHistory?.(e.target.value)}><option value="">历史记录</option>{history.map((item, i) => <option key={i} value={item}>{item.slice(0, 56)}</option>)}</select>}
          <button className="ssh-btn ssh-btn-sm" onClick={formatSql} disabled={!sql.trim()}>格式化</button>
          <button className="ssh-btn ssh-btn-sm ssh-btn-primary" onClick={() => onExecute(sql)} disabled={loading || disabled || !sql.trim()}>
            {loading ? '执行中...' : '执行'}
          </button>
        </div>
      </div>
      <div className="sql-editor-body">
        <textarea ref={ref} value={sql} onChange={(e) => onSqlChange(e.target.value)} onKeyDown={handleKeyDown} disabled={disabled} placeholder="输入 SQL 查询..." spellCheck={false} />
      </div>
    </div>
  )
}
