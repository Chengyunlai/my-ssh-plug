import { useState } from 'react'
import { ChevronIcon, DatabaseIcon, QueryIcon, SearchIcon, TableIcon } from './Icons'

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
  const [filter, setFilter] = useState('')
  const [databasesOpen, setDatabasesOpen] = useState(true)
  const [tablesOpen, setTablesOpen] = useState(true)
  const visibleTables = tables.filter(t => t.toLowerCase().includes(filter.toLowerCase()))
  return (
    <div className="sidebar object-tree">
      <button type="button" className="object-tree-root" onClick={() => setDatabasesOpen(open => !open)} aria-expanded={databasesOpen} aria-controls="mysql-database-tree">
        <ChevronIcon open={databasesOpen} />
        <DatabaseIcon className="object-tree-icon" />
        <span>数据库</span>
        <span className="sidebar-section-count">{databases.length}</span>
      </button>
      {databasesOpen && <div id="mysql-database-tree" className="object-tree-content">
        {databases.map(db => (
          <div key={db} className="database-node">
            <button type="button" className={`database-item ${selectedDb === db ? 'selected' : ''}`} onClick={() => { if (selectedDb === db) setTablesOpen(open => !open); else { onSelectDb(db); setTablesOpen(true) } }} aria-expanded={selectedDb === db ? tablesOpen : undefined}>
              <ChevronIcon open={selectedDb === db && tablesOpen} />
              <DatabaseIcon className="database-icon" />
              <span className="database-name">{db}</span>
            </button>
            {selectedDb === db && <div className="database-children">
              <button type="button" className="table-group-row" onClick={() => setTablesOpen(open => !open)} aria-expanded={tablesOpen} aria-controls={`mysql-table-tree-${db}`}>
                <ChevronIcon open={tablesOpen} />
                <TableIcon className="table-group-icon" />
                <span>表</span>
                <span className="sidebar-section-count">{tables.length}</span>
              </button>
              {tablesOpen && <div id={`mysql-table-tree-${db}`} className="table-group-content">
                <div className="table-search"><SearchIcon /><input aria-label="筛选表" value={filter} onChange={e => setFilter(e.target.value)} placeholder="筛选表…" /></div>
                <div className="sidebar-section-body">
            {visibleTables.length === 0 ? (
              <div className="sidebar-empty">无表</div>
            ) : (
              <div className="table-list">
                {visibleTables.map(t => (
                  <div
                    key={t}
                    className={`table-item ${selectedTable === t ? 'selected' : ''}`}
                    onClick={() => onSelectTable(t)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectTable(t) } }}
                  >
                    <TableIcon className="table-icon" />
                    <span className="table-name">{t}</span>
                    <button type="button" className="table-query-button" title="在查询中打开" aria-label={`在查询中打开 ${t}`} onClick={(e) => { e.stopPropagation(); onQueryTable(t) }}><QueryIcon /></button>
                  </div>
                ))}
              </div>
            )}
                </div>
              </div>}
            </div>}
          </div>
        ))}
      </div>}
    </div>
  )
}
