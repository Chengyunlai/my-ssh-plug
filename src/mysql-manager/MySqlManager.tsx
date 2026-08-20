import { useState, useEffect, useCallback } from 'react'
import ConnectionManager from './ConnectionManager'
import Sidebar from './Sidebar'
import TableDetail from './TableDetail'
import SqlEditor from './SqlEditor'
import ResultTable from './ResultTable'
import { mysqlClient, type Connection, type QueryResult } from './mysql-client'

const PROXY_URL = 'ws://localhost:3000'

export default function MySqlManager(): React.JSX.Element {
  const [connections, setConnections] = useState<Connection[]>([])
  const [activeConnection, setActiveConnection] = useState<Connection | null>(null)
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [databases, setDatabases] = useState<string[]>([])
  const [selectedDb, setSelectedDb] = useState<string | null>(null)
  const [tables, setTables] = useState<string[]>([])
  const [selectedTable, setSelectedTable] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState<'structure' | 'content' | 'query'>('structure')
  const [sql, setSql] = useState('')
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null)

  useEffect(() => {
    try { setConnections(JSON.parse(localStorage.getItem('mysql-connections') || '[]')) } catch {}
  }, [])

  const saveConns = useCallback((c: Connection[]) => {
    setConnections(c)
    localStorage.setItem('mysql-connections', JSON.stringify(c))
  }, [])

  const extractFirstCol = (rows: any[]): string[] =>
    rows.map(r => Array.isArray(r) ? r[0] : typeof r === 'object' && r !== null ? Object.values(r)[0] : r)

  const handleConnect = useCallback(async (conn: Connection) => {
    setLoading(true); setError(null)
    try {
      mysqlClient.setProxyUrl(PROXY_URL)
      await mysqlClient.connect(conn)
      const res = await mysqlClient.query('SHOW DATABASES')
      if (res.error) { setError(res.error); setConnected(false); return }
      const dbs = extractFirstCol(res.rows)
      setDatabases(dbs)
      setActiveConnection(conn)
      setConnected(true)
      setSelectedDb(null); setTables([]); setSelectedTable(null)
    } catch (e) { setError(e instanceof Error ? e.message : '连接失败'); setConnected(false) }
    setLoading(false)
  }, [])

  const handleDisconnect = useCallback(async () => {
    try { await mysqlClient.disconnect() } catch {}
    setActiveConnection(null); setConnected(false)
    setSelectedDb(null); setDatabases([]); setTables([]); setSelectedTable(null)
    setQueryResult(null); setSql('')
  }, [])

  const handleSelectDb = useCallback(async (db: string) => {
    setLoading(true); setError(null)
    try {
      await mysqlClient.query(`USE \`${db}\``)
      setSelectedDb(db); setSelectedTable(null)
      const res = await mysqlClient.query('SHOW TABLES')
      if (!res.error) setTables(extractFirstCol(res.rows))
    } catch (e) { setError(e instanceof Error ? e.message : '切换数据库失败') }
    setLoading(false)
  }, [])

  const handleSelectTable = useCallback((table: string) => {
    setSelectedTable(table)
    setActiveTab('structure')
  }, [])

  const handleExecuteQuery = useCallback(async (q: string) => {
    setLoading(true); setError(null); setActiveTab('query')
    try {
      const res = await mysqlClient.query(q)
      setQueryResult(res)
      if (res.error) setError(res.error)
    } catch (e) { setError(e instanceof Error ? e.message : '查询失败') }
    setLoading(false)
  }, [])

  const handleSaveConn = useCallback((conn: Connection) => {
    const n = [...connections]
    const i = n.findIndex(c => c.id === conn.id)
    i >= 0 ? n[i] = conn : n.push(conn)
    saveConns(n)
  }, [connections, saveConns])

  const handleDeleteConn = useCallback((id: string) => {
    saveConns(connections.filter(c => c.id !== id))
    if (activeConnection?.id === id) handleDisconnect()
  }, [connections, activeConnection, saveConns, handleDisconnect])

  return (
    <div className="mysql-manager">
      <div className="mysql-sidebar">
        <ConnectionManager
          connections={connections} activeConnection={activeConnection}
          connected={connected} loading={loading}
          onConnect={handleConnect} onDisconnect={handleDisconnect}
          onSave={handleSaveConn} onDelete={handleDeleteConn}
        />
        {connected && (
          <Sidebar
            databases={databases} selectedDb={selectedDb}
            tables={tables} selectedTable={selectedTable}
            onSelectDb={handleSelectDb} onSelectTable={handleSelectTable}
            onQueryTable={(t) => { setSql(`SELECT * FROM \`${t}\` LIMIT 100`); setActiveTab('query'); handleExecuteQuery(`SELECT * FROM \`${t}\` LIMIT 100`); }}
          />
        )}
      </div>
      <div className="mysql-main">
        <SqlEditor sql={sql} onSqlChange={setSql} onExecute={handleExecuteQuery} loading={loading} disabled={!connected} />
        {error && <div className="mysql-error">{error}</div>}
        {selectedTable && selectedDb ? (
          <TableDetail
            db={selectedDb} table={selectedTable}
            activeTab={activeTab} onTabChange={setActiveTab}
            queryResult={activeTab === 'query' ? queryResult : null}
            loading={loading}
          />
        ) : activeTab === 'query' && queryResult ? (
          <ResultTable columns={queryResult.columns} rows={queryResult.rows} affectedRows={queryResult.affectedRows} />
        ) : (
          <div className="result-empty">
            {connected ? '选择一个表查看结构和内容' : '连接数据库开始使用'}
          </div>
        )}
      </div>
    </div>
  )
}
