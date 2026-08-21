import { useState, useEffect, useCallback } from 'react'
import ConnectionManager from './ConnectionManager'
import Sidebar from './Sidebar'
import TableDetail from './TableDetail'
import SqlEditor from './SqlEditor'
import ResultTable from './ResultTable'
import { SqlIcon, TableIcon } from './Icons'
import { mysqlClient, type Connection, type QueryResult } from './mysql-client'
import {
  CONNECTIONS_STORAGE_KEY,
  LEGACY_CONNECTIONS_STORAGE_KEY,
  LEGACY_QUERY_HISTORY_STORAGE_KEY,
  QUERY_HISTORY_STORAGE_KEY,
  DEFAULT_PROXY_URL
} from './storage'

type ViewTab = 'structure' | 'content' | 'query'
interface WorkspaceTab {
  id: string
  kind: 'table' | 'query'
  title: string
  db: string | null
  table: string | null
  activeView: ViewTab
  sql: string
  queryResult: QueryResult | null
}

export default function MySqlManager(): React.JSX.Element {
  const [connections, setConnections] = useState<Connection[]>([])
  const [activeConnection, setActiveConnection] = useState<Connection | null>(null)
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [databases, setDatabases] = useState<string[]>([])
  const [selectedDb, setSelectedDb] = useState<string | null>(null)
  const [tables, setTables] = useState<string[]>([])
  const [tabs, setTabs] = useState<WorkspaceTab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [queryHistory, setQueryHistory] = useState<string[]>([])

  const activeWorkspaceTab = tabs.find(tab => tab.id === activeTabId) || null
  const selectedTable = activeWorkspaceTab?.kind === 'table' ? activeWorkspaceTab.table : null
  const querySourceTable = activeWorkspaceTab?.kind === 'query' ? activeWorkspaceTab.table : null
  const activeView = activeWorkspaceTab?.activeView || 'structure'
  const sql = activeWorkspaceTab?.sql || ''
  const queryResult = activeWorkspaceTab?.queryResult || null

  useEffect(() => {
    try {
      setConnections(JSON.parse(localStorage.getItem(CONNECTIONS_STORAGE_KEY) || localStorage.getItem(LEGACY_CONNECTIONS_STORAGE_KEY) || '[]'))
    } catch {}
    try {
      setQueryHistory(JSON.parse(localStorage.getItem(QUERY_HISTORY_STORAGE_KEY) || localStorage.getItem(LEGACY_QUERY_HISTORY_STORAGE_KEY) || '[]'))
    } catch {}
  }, [])

  const saveConns = useCallback((c: Connection[]) => {
    setConnections(c)
    localStorage.setItem(CONNECTIONS_STORAGE_KEY, JSON.stringify(c))
  }, [])

  const extractFirstCol = (rows: any[]): string[] =>
    rows.map(r => Array.isArray(r) ? r[0] : typeof r === 'object' && r !== null ? Object.values(r)[0] : r)

  const handleConnect = useCallback(async (conn: Connection) => {
    setLoading(true); setError(null)
    try {
      mysqlClient.setProxyUrl(conn.proxyUrl || DEFAULT_PROXY_URL)
      await mysqlClient.connect(conn)
      const res = await mysqlClient.query('SHOW DATABASES')
      if (res.error) { setError(res.error); setConnected(false); return }
      const dbs = extractFirstCol(res.rows)
      setDatabases(dbs)
      setActiveConnection(conn)
      setConnected(true)
      setSelectedDb(null); setTables([]); setTabs([]); setActiveTabId(null)
      if (conn.database && dbs.includes(conn.database)) {
        await mysqlClient.query(`USE \`${conn.database.replace(/`/g, '``')}\``)
        const tableRes = await mysqlClient.query('SHOW TABLES')
        setSelectedDb(conn.database)
        if (!tableRes.error) setTables(extractFirstCol(tableRes.rows))
      }
    } catch (e) { setError(e instanceof Error ? e.message : '连接失败'); setConnected(false) }
    setLoading(false)
  }, [])

  const handleDisconnect = useCallback(async () => {
    try { await mysqlClient.disconnect() } catch {}
    setActiveConnection(null); setConnected(false)
    setSelectedDb(null); setDatabases([]); setTables([]); setTabs([]); setActiveTabId(null)
  }, [])

  const handleSelectDb = useCallback(async (db: string) => {
    setLoading(true); setError(null)
    try {
      await mysqlClient.query(`USE \`${db}\``)
      setSelectedDb(db); setTabs([]); setActiveTabId(null)
      const res = await mysqlClient.query('SHOW TABLES')
      if (!res.error) setTables(extractFirstCol(res.rows))
    } catch (e) { setError(e instanceof Error ? e.message : '切换数据库失败') }
    setLoading(false)
  }, [])

  const openTableTab = useCallback((table: string, view: 'structure' | 'content' = 'structure') => {
    if (!selectedDb) return null
    const existing = tabs.find(tab => tab.kind === 'table' && tab.db === selectedDb && tab.table === table)
    if (existing) {
      setActiveTabId(existing.id)
      if (view !== 'structure') setTabs(prev => prev.map(tab => tab.id === existing.id ? { ...tab, activeView: view } : tab))
      return existing.id
    }
    const id = `table-${selectedDb}-${table}`
    const next: WorkspaceTab = { id, kind: 'table', title: table, db: selectedDb, table, activeView: view, sql: `SELECT * FROM \`${table}\` LIMIT 100`, queryResult: null }
    setTabs(prev => [...prev, next]); setActiveTabId(id)
    return id
  }, [selectedDb, tabs])

  const handleSelectTable = useCallback((table: string) => { openTableTab(table) }, [openTableTab])

  const closeTab = useCallback((id: string) => {
    setTabs(prev => {
      const index = prev.findIndex(tab => tab.id === id)
      const next = prev.filter(tab => tab.id !== id)
      if (activeTabId === id) {
        const fallback = next[Math.max(0, index - 1)]
        setActiveTabId(fallback?.id || null)
      }
      return next
    })
  }, [activeTabId])

  const updateActiveTab = useCallback((patch: Partial<WorkspaceTab>) => {
    if (!activeTabId) return
    setTabs(prev => prev.map(tab => tab.id === activeTabId ? { ...tab, ...patch } : tab))
  }, [activeTabId])

  const createQueryTab = useCallback((initialSql = '', sourceTable: string | null = null) => {
    const id = `query-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setTabs(prev => [...prev, { id, kind: 'query', title: sourceTable ? `${sourceTable} · SQL` : `查询 ${prev.filter(tab => tab.kind === 'query').length + 1}`, db: selectedDb, table: sourceTable, activeView: 'query', sql: initialSql, queryResult: null }])
    setActiveTabId(id)
    return id
  }, [selectedDb])

  const handleSqlChange = useCallback((value: string) => {
    if (activeTabId) updateActiveTab({ sql: value })
    else createQueryTab(value)
  }, [activeTabId, createQueryTab, updateActiveTab])

  useEffect(() => {
    const onWorkspaceKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return
      if (event.key.toLowerCase() === 't') {
        event.preventDefault()
        if (connected) createQueryTab()
      }
      if (event.key.toLowerCase() === 'w' && activeTabId) {
        event.preventDefault()
        closeTab(activeTabId)
      }
    }
    window.addEventListener('keydown', onWorkspaceKeyDown)
    return () => window.removeEventListener('keydown', onWorkspaceKeyDown)
  }, [connected, activeTabId, createQueryTab, closeTab])

  const handleExecuteQuery = useCallback(async (q: string, tabId?: string) => {
    let targetId = tabId || activeTabId
    const targetTab = targetId ? tabs.find(tab => tab.id === targetId) : null
    if (targetTab?.kind === 'table') {
      targetId = createQueryTab(q, targetTab.table)
    }
    if (!targetId) {
      targetId = createQueryTab(q)
    }
    setLoading(true); setError(null)
    setTabs(prev => prev.map(tab => tab.id === targetId ? { ...tab, activeView: 'query', sql: q } : tab))
    const normalized = q.trim()
    if (normalized) {
      setQueryHistory(prev => {
        const next = [normalized, ...prev.filter(item => item !== normalized)].slice(0, 30)
        localStorage.setItem(QUERY_HISTORY_STORAGE_KEY, JSON.stringify(next))
        return next
      })
    }
    try {
      const res = await mysqlClient.query(q)
      setTabs(prev => prev.map(tab => tab.id === targetId ? { ...tab, queryResult: res } : tab))
      if (res.error) setError(res.error)
    } catch (e) { setError(e instanceof Error ? e.message : '查询失败') }
    setLoading(false)
  }, [activeTabId, tabs, createQueryTab])

  const handleQueryTable = useCallback((table: string) => {
    const query = `SELECT * FROM \`${table}\` LIMIT 100`
    const id = createQueryTab(query, table)
    handleExecuteQuery(query, id)
  }, [createQueryTab, handleExecuteQuery])

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
            onQueryTable={handleQueryTable}
          />
        )}
      </div>
      <div className="mysql-main">
        <div className="workspace-toolbar">
          <div className="workspace-breadcrumb">
            <span className="workspace-product">MySQL Manager</span>
            <span className="workspace-separator">/</span>
            <span>{activeConnection?.name || '未连接'}</span>
            {selectedDb && <><span className="workspace-separator">/</span><span>{selectedDb}</span></>}
            {(selectedTable || querySourceTable) && <><span className="workspace-separator">/</span><span>{selectedTable || querySourceTable}</span></>}
            {activeWorkspaceTab?.kind === 'query' && <><span className="workspace-separator">/</span><span>SQL</span></>}
          </div>
          <div className="workspace-toolbar-actions"><span className={`proxy-indicator ${connected ? 'online' : ''}`}><i />代理 {connected ? '已连接' : '待机'}</span></div>
        </div>
        <div className="workspace-tabs" role="tablist" aria-label="打开的对象">
          {tabs.map(tab => <button key={tab.id} className={`workspace-tab ${tab.id === activeTabId ? 'active' : ''}`} onClick={() => setActiveTabId(tab.id)}><span className="workspace-tab-icon">{tab.kind === 'table' ? <TableIcon /> : <SqlIcon />}</span><span className="workspace-tab-label">{tab.title}</span><span className="workspace-tab-close" role="button" aria-label={`关闭 ${tab.title}`} onClick={(e) => { e.stopPropagation(); closeTab(tab.id) }}>×</span></button>)}
          {connected && <button className="workspace-new-tab" title="新建查询" onClick={() => createQueryTab()}>＋</button>}
          {tabs.length === 0 && <span className="workspace-tabs-empty">从左侧对象树打开表，或直接执行 SQL</span>}
        </div>
        <SqlEditor sql={sql} onSqlChange={handleSqlChange} onExecute={q => handleExecuteQuery(q)} loading={loading} disabled={!connected} history={queryHistory} onSelectHistory={handleSqlChange} />
        {error && <div className="mysql-error">{error}</div>}
        {selectedTable && selectedDb && activeView !== 'query' ? (
          <TableDetail
            db={selectedDb} table={selectedTable}
            activeTab={activeView === 'content' ? 'content' : 'structure'} onTabChange={view => updateActiveTab({ activeView: view })}
            loading={loading}
          />
        ) : activeView === 'query' && queryResult ? (
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
