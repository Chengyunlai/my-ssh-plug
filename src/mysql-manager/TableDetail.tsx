import { useState, useEffect, useCallback, useMemo } from 'react'
import { mysqlClient, type QueryResult } from './mysql-client'

interface Props {
  db: string
  table: string
  activeTab: 'structure' | 'content' | 'query'
  onTabChange: (tab: 'structure' | 'content' | 'query') => void
  queryResult: QueryResult | null
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

export default function TableDetail({ db, table, activeTab, onTabChange, queryResult, loading }: Props) {
  const [structure, setStructure] = useState<ColumnInfo[]>([])
  const [content, setContent] = useState<QueryResult | null>(null)
  const [page, setPage] = useState(0)
  const [totalRows, setTotalRows] = useState(0)
  const [editCell, setEditCell] = useState<{ row: number; col: number; value: string } | null>(null)
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
    if (activeTab === 'structure') loadStructure()
  }, [activeTab, loadStructure])

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

  const getCellValue = (row: any[], idx: number) => {
    const val = Array.isArray(row) ? row[idx] : Object.values(row)[idx]
    return val === null ? null : val
  }

  return (
    <div className="table-detail">
      <div className="tab-bar">
        <div className={`tab ${activeTab === 'structure' ? 'active' : ''}`} onClick={() => onTabChange('structure')}>结构</div>
        <div className={`tab ${activeTab === 'content' ? 'active' : ''}`} onClick={() => onTabChange('content')}>内容</div>
        <div className={`tab ${activeTab === 'query' ? 'active' : ''}`} onClick={() => onTabChange('query')}>查询</div>
        <span className="tab-label">{db}.{table}</span>
      </div>

      {activeTab === 'structure' && (
        <div className="tab-content">
          <table className="result-table">
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
          </table>
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
                  <button className="ssh-btn ssh-btn-sm" onClick={() => loadContent(page)}>刷新</button>
                </div>
              </div>
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

      {activeTab === 'query' && queryResult && (
        <div className="tab-content tab-content-fill">
          <ResultTable columns={queryResult.columns} rows={queryResult.rows} affectedRows={queryResult.affectedRows} />
        </div>
      )}
    </div>
  )
}

function ResultTable({ columns, rows, affectedRows }: { columns: string[]; rows: any[][]; affectedRows?: number }) {
  const [sortCol, setSortCol] = useState<number | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(0)
  const pageSize = 50

  const sorted = useMemo(() => {
    if (sortCol === null) return rows
    return [...rows].sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol]
      if (av === null) return 1; if (bv === null) return -1
      return sortDir === 'asc' ? (av < bv ? -1 : 1) : (av > bv ? -1 : 1)
    })
  }, [rows, sortCol, sortDir])

  const pageRows = useMemo(() => sorted.slice(page * pageSize, (page + 1) * pageSize), [sorted, page])
  const totalPages = Math.ceil(rows.length / pageSize)

  if (!columns.length && !rows.length) {
    return <div className="result-empty">{affectedRows !== undefined ? <span className="result-success">影响 {affectedRows} 行</span> : '无结果'}</div>
  }

  return (
    <>
      <div className="result-header"><span>{rows.length} 行</span></div>
      <div className="result-table-wrapper">
        <table className="result-table">
          <thead><tr>{columns.map((c, i) => <th key={i} className={sortCol === i ? 'sorted' : ''} onClick={() => { if (sortCol === i) setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); else { setSortCol(i); setSortDir('asc') } }}>{c}{sortCol === i && (sortDir === 'asc' ? ' ↑' : ' ↓')}</th>)}</tr></thead>
          <tbody>{pageRows.map((row, ri) => <tr key={ri}>{row.map((cell, ci) => <td key={ci}>{cell === null ? <span className="null-value">NULL</span> : String(cell)}</td>)}</tr>)}</tbody>
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
  )
}
