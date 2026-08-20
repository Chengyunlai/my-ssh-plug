import { useRef } from 'react'

interface Props {
  sql: string
  onSqlChange: (sql: string) => void
  onExecute: (sql: string) => void
  loading: boolean
  disabled: boolean
}

export default function SqlEditor({ sql, onSqlChange, onExecute, loading, disabled }: Props): React.JSX.Element {
  const ref = useRef<HTMLTextAreaElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      if (!loading && !disabled && sql.trim()) onExecute(sql)
    }
  }

  return (
    <div className="sql-editor">
      <div className="sql-editor-header">
        <h4>SQL</h4>
        <div className="sql-editor-actions">
          <button className="ssh-btn ssh-btn-sm" onClick={() => ref.current?.focus()}>格式化</button>
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
