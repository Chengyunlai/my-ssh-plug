import { useState, useMemo } from 'react'
import type { QueryRow } from './mysql-client'

interface Props {
  columns: string[]
  rows: QueryRow[]
  affectedRows?: number
}

export default function ResultTable({ columns, rows, affectedRows }: Props): React.JSX.Element {
  const [sortCol, setSortCol] = useState<number | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(50)

  const valueAt = (row: QueryRow, index: number): unknown =>
    Array.isArray(row) ? row[index] : row[columns[index]]

  const sorted = useMemo(() => {
    if (sortCol === null) return rows
    return [...rows].sort((a, b) => {
      const av = valueAt(a, sortCol), bv = valueAt(b, sortCol)
      if (av === null) return 1
      if (bv === null) return -1
      const comparison = String(av).localeCompare(String(bv), undefined, { numeric: true })
      return sortDir === 'asc' ? comparison : -comparison
    })
  }, [rows, sortCol, sortDir])

  const pageRows = useMemo(() => {
    const start = page * pageSize
    return sorted.slice(start, start + pageSize)
  }, [sorted, page, pageSize])

  const totalPages = Math.ceil(rows.length / pageSize)

  const handleSort = (i: number) => {
    if (sortCol === i) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else { setSortCol(i); setSortDir('asc') }
  }

  const exportCsv = () => {
    const header = columns.join(',')
    const csvRows = rows.map(row => columns.map((_, index) => valueAt(row, index)).map(c => c === null ? '' : String(c).includes(',') ? `"${String(c).replace(/"/g, '""')}"` : String(c)).join(','))
    const blob = new Blob([[header, ...csvRows].join('\n')], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `result_${Date.now()}.csv`
    a.click()
  }

  if (!columns.length && !rows.length) {
    return (
      <div className="result-empty">
        {affectedRows !== undefined ? <span className="result-success">影响 {affectedRows} 行</span> : <span>无查询结果</span>}
      </div>
    )
  }

  return (
    <div className="result-area">
      <div className="result-header">
        <span>{rows.length} 行</span>
        <div className="result-actions">
          <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0) }}>
            <option value={25}>25/页</option>
            <option value={50}>50/页</option>
            <option value={100}>100/页</option>
          </select>
          <button className="ssh-btn ssh-btn-sm" onClick={exportCsv}>导出 CSV</button>
        </div>
      </div>
      <div className="result-table-wrapper">
        <table className="result-table">
          <thead>
            <tr>
              {columns.map((c, i) => (
                <th key={i} className={sortCol === i ? 'sorted' : ''} onClick={() => handleSort(i)}>
                  {c}{sortCol === i && (sortDir === 'asc' ? ' ↑' : ' ↓')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, ri) => (
              <tr key={ri}>
                {columns.map((_, ci) => {
                  const cell = valueAt(row, ci)
                  return (
                  <td key={ci}>{cell === null ? <span className="null-value">NULL</span> : String(cell)}</td>
                  )
                })}
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
    </div>
  )
}
