interface Props {
  databases: string[]
  selectedDb: string | null
  tables: string[]
  selectedTable: string | null
  onSelectDb: (db: string) => void
  onSelectTable: (table: string) => void
  onQueryTable: (table: string) => void
}

export default function Sidebar({
  databases, selectedDb, tables, selectedTable,
  onSelectDb, onSelectTable, onQueryTable
}: Props): React.JSX.Element {
  return (
    <div className="sidebar">
      <div className="sidebar-section">
        <div className="sidebar-section-header">
          <span className="sidebar-section-title">数据库</span>
          <span className="sidebar-section-count">{databases.length}</span>
        </div>
        <div className="sidebar-section-body">
          <select
            className="db-select"
            value={selectedDb || ''}
            onChange={(e) => e.target.value && onSelectDb(e.target.value)}
          >
            <option value="">选择数据库...</option>
            {databases.map(db => <option key={db} value={db}>{db}</option>)}
          </select>
        </div>
      </div>

      {selectedDb && (
        <div className="sidebar-section sidebar-section-fill">
          <div className="sidebar-section-header">
            <span className="sidebar-section-title">表</span>
            <span className="sidebar-section-count">{tables.length}</span>
          </div>
          <div className="sidebar-section-body">
            {tables.length === 0 ? (
              <div className="sidebar-empty">无表</div>
            ) : (
              <div className="table-list">
                {tables.map(t => (
                  <div
                    key={t}
                    className={`table-item ${selectedTable === t ? 'selected' : ''}`}
                    onClick={() => onSelectTable(t)}
                  >
                    <span className="table-icon">⊞</span>
                    <span className="table-name">{t}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
