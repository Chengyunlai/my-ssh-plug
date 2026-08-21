import { useState, useEffect, useCallback } from 'react'
import { mysqlClient, type QueryResult, type QueryRow } from './mysql-client'

interface Props {
  db: string
  table: string
  activeTab: 'structure' | 'content'
  onTabChange: (tab: 'structure' | 'content') => void
  loading: boolean
}

interface ColumnInfo {
  field: string
  type: string
  null: string
  key: string
  default: string | null
  extra: string
}

interface IndexInfo { name: string; column: string; unique: string; type: string; cardinality: string }
interface ForeignKeyInfo { name: string; column: string; refTable: string; refColumn: string; updateRule: string; deleteRule: string }

export default function TableDetail({ db, table, activeTab, onTabChange, loading }: Props) {
  const [structure, setStructure] = useState<ColumnInfo[]>([])
  const [content, setContent] = useState<QueryResult | null>(null)
  const [page, setPage] = useState(0)
  const [totalRows, setTotalRows] = useState(0)
  const [editCell, setEditCell] = useState<{ row: number; col: number; value: string } | null>(null)
  const [showInsert, setShowInsert] = useState(false)
  const [newRow, setNewRow] = useState<Record<string, string>>({})
  const [savingRow, setSavingRow] = useState(false)
  const [structureView, setStructureView] = useState<'columns' | 'indexes' | 'foreignKeys'>('columns')
  const [indexes, setIndexes] = useState<IndexInfo[]>([])
  const [foreignKeys, setForeignKeys] = useState<ForeignKeyInfo[]>([])
  const pageSize = 50

  const loadStructure = useCallback(async () => {
    const res = await mysqlClient.query(`DESCRIBE \`${table}\``)
    if (!res.error) {
      setStructure(res.rows.map(row => {
        const arr = Array.isArray(row) ? row : Object.values(row)
        return {
          field: String(arr[0] ?? ''),
          type: String(arr[1] ?? ''),
          null: String(arr[2] ?? ''),
          key: String(arr[3] ?? ''),
          default: arr[4] != null ? String(arr[4]) : null,
          extra: String(arr[5] ?? '')
        }
      }))
    }
  }, [table])

  const loadIndexes = useCallback(async () => {
    const res = await mysqlClient.query(`SHOW INDEX FROM \`${table}\``)
    if (!res.error) setIndexes(res.rows.map(row => {
      const values = Array.isArray(row) ? row : Object.values(row)
      return { name: String(values[2] ?? ''), column: String(values[4] ?? ''), unique: String(values[1]) === '0' ? '是' : '否', type: String(values[10] ?? values[9] ?? ''), cardinality: values[6] == null ? '—' : String(values[6]) }
    }))
  }, [table])

  const loadForeignKeys = useCallback(async () => {
    const sql = `SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME, UPDATE_RULE, DELETE_RULE FROM information_schema.KEY_COLUMN_USAGE k JOIN information_schema.REFERENTIAL_CONSTRAINTS r ON k.CONSTRAINT_NAME = r.CONSTRAINT_NAME AND k.CONSTRAINT_SCHEMA = r.CONSTRAINT_SCHEMA WHERE k.TABLE_SCHEMA = DATABASE() AND k.TABLE_NAME = '${table.replace(/'/g, "''")}' AND k.REFERENCED_TABLE_NAME IS NOT NULL ORDER BY k.CONSTRAINT_NAME`
    const res = await mysqlClient.query(sql)
    if (!res.error) setForeignKeys(res.rows.map(row => {
      const values = Array.isArray(row) ? row : Object.values(row)
      return { name: String(values[0] ?? ''), column: String(values[1] ?? ''), refTable: String(values[2] ?? ''), refColumn: String(values[3] ?? ''), updateRule: String(values[4] ?? ''), deleteRule: String(values[5] ?? '') }
    }))
  }, [table])

  const loadContent = useCallback(async (p: number) => {
    const offset = p * pageSize
    const res = await mysqlClient.query(`SELECT * FROM \`${table}\` LIMIT ${pageSize} OFFSET ${offset}`)
    if (!res.error) setContent(res)
  }, [table])

  const loadCount = useCallback(async () => {
    const res = await mysqlClient.query(`SELECT COUNT(*) as cnt FROM \`${table}\``)
    if (!res.error && res.rows.length > 0) {
      const row = res.rows[0]
      setTotalRows(Number(Array.isArray(row) ? row[0] : Object.values(row)[0]))
    }
  }, [table])

  useEffect(() => {
    if (activeTab === 'structure' || (activeTab === 'content' && structure.length === 0)) loadStructure()
  }, [activeTab, loadStructure])

  useEffect(() => {
    if (activeTab !== 'structure') return
    if (structureView === 'indexes') loadIndexes()
    if (structureView === 'foreignKeys') loadForeignKeys()
  }, [activeTab, structureView, loadIndexes, loadForeignKeys])

  useEffect(() => {
    setStructureView('columns'); setIndexes([]); setForeignKeys([])
  }, [table])

  useEffect(() => {
    if (activeTab === 'content') { setPage(0); loadCount(); loadContent(0) }
  }, [activeTab, loadCount, loadContent])

  useEffect(() => {
    if (activeTab === 'content') loadContent(page)
  }, [page, activeTab, loadContent])

  const handleCellEdit = async (rowIdx: number, colName: string, newValue: string) => {
    if (!content) return
    const row = content.rows[rowIdx]
    const pkCol = structure.find(c => c.key === 'PRI')
    if (!pkCol) { alert('表没有主键，无法编辑'); return }
    const pkIdx = structure.findIndex(c => c.key === 'PRI')
    const pkVal = Array.isArray(row) ? row[pkIdx] : Object.values(row)[pkIdx]
    const sql = `UPDATE \`${table}\` SET \`${colName}\` = ${newValue === 'NULL' ? 'NULL' : `'${newValue.replace(/'/g, "\\'")}'`} WHERE \`${pkCol.field}\` = ${typeof pkVal === 'string' ? `'${pkVal.replace(/'/g, "\\'")}'` : pkVal}`
    const res = await mysqlClient.query(sql)
    if (res.error) alert(res.error)
    else loadContent(page)
    setEditCell(null)
  }

  const handleDeleteRow = async (rowIdx: number) => {
    if (!content) return
    const pkCol = structure.find(c => c.key === 'PRI')
    if (!pkCol) { alert('表没有主键，无法删除'); return }
    const pkIdx = structure.findIndex(c => c.key === 'PRI')
    const row = content.rows[rowIdx]
    const pkVal = Array.isArray(row) ? row[pkIdx] : Object.values(row)[pkIdx]
    if (!confirm(`确定删除这一行？`)) return
    const sql = `DELETE FROM \`${table}\` WHERE \`${pkCol.field}\` = ${typeof pkVal === 'string' ? `'${pkVal.replace(/'/g, "\\'")}'` : pkVal}`
    const res = await mysqlClient.query(sql)
    if (res.error) alert(res.error)
    else { loadContent(page); loadCount() }
  }

  const totalPages = Math.ceil(totalRows / pageSize)

  const sqlValue = (value: string) => {
    if (value.trim().toUpperCase() === 'NULL') return 'NULL'
    return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
  }

  const handleInsertRow = async () => {
    if (!newRow || !Object.keys(newRow).some(key => newRow[key]?.trim())) return
    setSavingRow(true)
    const fields = structure.filter(col => newRow[col.field] !== undefined && newRow[col.field] !== '').map(col => `\`${col.field}\``)
    const values = structure.filter(col => newRow[col.field] !== undefined && newRow[col.field] !== '').map(col => sqlValue(newRow[col.field]))
    const res = await mysqlClient.query(`INSERT INTO \`${table}\` (${fields.join(', ')}) VALUES (${values.join(', ')})`)
    if (res.error) alert(res.error)
    else { setShowInsert(false); setNewRow({}); await loadCount(); await loadContent(page) }
    setSavingRow(false)
  }

  const getCellValue = (row: QueryRow, idx: number) => {
    const val = Array.isArray(row) ? row[idx] : row[content?.columns[idx] ?? '']
    return val === null ? null : val
  }

  return (
    <div className="table-detail">
      <div className="tab-bar">
        <div className={`tab ${activeTab === 'structure' ? 'active' : ''}`} onClick={() => onTabChange('structure')}>结构</div>
        <div className={`tab ${activeTab === 'content' ? 'active' : ''}`} onClick={() => onTabChange('content')}>内容</div>
        <span className="tab-label">{db}.{table}</span>
      </div>

      {activeTab === 'structure' && (
        <div className="tab-content">
          <div className="structure-switcher">
            <button className={structureView === 'columns' ? 'active' : ''} onClick={() => setStructureView('columns')}>字段 <span>{structure.length}</span></button>
            <button className={structureView === 'indexes' ? 'active' : ''} onClick={() => setStructureView('indexes')}>索引 <span>{indexes.length}</span></button>
            <button className={structureView === 'foreignKeys' ? 'active' : ''} onClick={() => setStructureView('foreignKeys')}>外键 <span>{foreignKeys.length}</span></button>
          </div>
          {structureView === 'columns' && <table className="result-table">
            <thead>
              <tr>
                <th>字段</th><th>类型</th><th>Null</th><th>键</th><th>默认值</th><th>额外</th>
              </tr>
            </thead>
            <tbody>
              {structure.map((col, i) => (
                <tr key={i}>
                  <td><span className="col-name">{col.field}</span></td>
                  <td><span className="col-type">{col.type}</span></td>
                  <td>{col.null}</td>
                  <td>{col.key && <span className={`key-badge ${col.key === 'PRI' ? 'pri' : col.key === 'MUL' ? 'mul' : 'uni'}`}>{col.key}</span>}</td>
                  <td>{col.default ?? <span className="null-value">NULL</span>}</td>
                  <td>{col.extra}</td>
                </tr>
              ))}
            </tbody>
          </table>}
          {structureView === 'indexes' && <table className="result-table"><thead><tr><th>名称</th><th>字段</th><th>唯一</th><th>类型</th><th>基数</th></tr></thead><tbody>{indexes.map((index, i) => <tr key={i}><td><span className="col-name">{index.name}</span></td><td>{index.column}</td><td>{index.unique}</td><td>{index.type}</td><td>{index.cardinality}</td></tr>)}</tbody></table>}
          {structureView === 'foreignKeys' && <table className="result-table"><thead><tr><th>约束</th><th>字段</th><th>引用表</th><th>引用字段</th><th>更新</th><th>删除</th></tr></thead><tbody>{foreignKeys.map((key, i) => <tr key={i}><td><span className="col-name">{key.name}</span></td><td>{key.column}</td><td>{key.refTable}</td><td>{key.refColumn}</td><td>{key.updateRule}</td><td>{key.deleteRule}</td></tr>)}</tbody></table>}
        </div>
      )}

      {activeTab === 'content' && (
        <div className="tab-content tab-content-fill">
          {loading ? (
            <div className="result-empty">加载中...</div>
          ) : content ? (
            <>
              <div className="result-header">
                <span>共 {totalRows} 行</span>
                <div className="result-actions">
                  <button className="ssh-btn ssh-btn-sm ssh-btn-primary" onClick={() => { setShowInsert(true); if (structure.length === 0) loadStructure() }}>＋ 新增行</button>
                  <button className="ssh-btn ssh-btn-sm" onClick={() => loadContent(page)}>刷新</button>
                </div>
              </div>
              {showInsert && (
                <div className="insert-row-panel">
                  <div className="insert-row-title"><strong>新增一行</strong><span>留空字段使用数据库默认值，输入 NULL 写入空值</span></div>
                  <div className="insert-row-fields">
                    {structure.map(col => <label key={col.field}><span>{col.field}</span><input value={newRow[col.field] || ''} placeholder={col.extra.includes('auto_increment') ? '自动递增' : col.default ?? '默认'} onChange={e => setNewRow({ ...newRow, [col.field]: e.target.value })} disabled={col.extra.includes('auto_increment')} /></label>)}
                  </div>
                  <div className="insert-row-actions"><button className="ssh-btn ssh-btn-sm ssh-btn-primary" onClick={handleInsertRow} disabled={savingRow}>{savingRow ? '保存中…' : '保存行'}</button><button className="ssh-btn ssh-btn-sm" onClick={() => { setShowInsert(false); setNewRow({}) }}>取消</button></div>
                </div>
              )}
              <div className="result-table-wrapper">
                <table className="result-table">
                  <thead>
                    <tr>
                      {content.columns.map((c, i) => <th key={i}>{c}</th>)}
                      <th className="action-col">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {content.rows.map((row, ri) => (
                      <tr key={ri}>
                        {content.columns.map((_, ci) => {
                          const val = getCellValue(row, ci)
                          const isEditing = editCell?.row === ri && editCell?.col === ci
                          return (
                            <td key={ci} onDoubleClick={() => setEditCell({ row: ri, col: ci, value: val === null ? 'NULL' : String(val) })}>
                              {isEditing ? (
                                <input
                                  className="cell-input"
                                  value={editCell.value}
                                  autoFocus
                                  onChange={e => setEditCell({ ...editCell, value: e.target.value })}
                                  onBlur={() => handleCellEdit(ri, content.columns[ci], editCell.value)}
                                  onKeyDown={e => { if (e.key === 'Enter') handleCellEdit(ri, content.columns[ci], editCell.value); if (e.key === 'Escape') setEditCell(null) }}
                                />
                              ) : val === null ? (
                                <span className="null-value">NULL</span>
                              ) : (
                                String(val)
                              )}
                            </td>
                          )
                        })}
                        <td className="action-col">
                          <button className="ssh-btn ssh-btn-sm ssh-btn-danger" onClick={() => handleDeleteRow(ri)}>删</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="result-pagination">
                  <button className="ssh-btn ssh-btn-sm" onClick={() => setPage(0)} disabled={page === 0}>«</button>
                  <button className="ssh-btn ssh-btn-sm" onClick={() => setPage(page - 1)} disabled={page === 0}>‹</button>
                  <span>{page + 1} / {totalPages}</span>
                  <button className="ssh-btn ssh-btn-sm" onClick={() => setPage(page + 1)} disabled={page >= totalPages - 1}>›</button>
                  <button className="ssh-btn ssh-btn-sm" onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}>»</button>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}

    </div>
  )
}
