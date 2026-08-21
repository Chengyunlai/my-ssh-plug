import { useState } from 'react'
import { ConnectionIcon, EditIcon, PlusIcon, PowerIcon, TrashIcon } from './Icons'

interface Connection {
  id: string
  name: string
  host: string
  port: number
  user: string
  password: string
  database?: string
  proxyUrl?: string
}

interface Props {
  connections: Connection[]
  activeConnection: Connection | null
  connected: boolean
  loading: boolean
  onConnect: (conn: Connection) => void
  onDisconnect: () => void
  onSave: (conn: Connection) => void
  onDelete: (connId: string) => void
}

export default function ConnectionManager({
  connections, activeConnection, connected, loading,
  onConnect, onDisconnect, onSave, onDelete
}: Props): React.JSX.Element {
  const [showForm, setShowForm] = useState(false)
  const [editingConn, setEditingConn] = useState<Connection | null>(null)
  const [form, setForm] = useState<Connection>({
    id: '', name: '', host: 'localhost', port: 3306, user: 'root', password: '', database: '', proxyUrl: ''
  })

  const handleNew = () => {
    setEditingConn(null)
    setForm({ id: `conn-${Date.now()}`, name: '', host: 'localhost', port: 3306, user: 'root', password: '', database: '', proxyUrl: '' })
    setShowForm(true)
  }

  const handleEdit = (conn: Connection) => {
    setEditingConn(conn)
    setForm({ ...conn })
    setShowForm(true)
  }

  const handleSave = () => {
    onSave(form)
    setShowForm(false)
    setEditingConn(null)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingConn(null)
  }

  return (
    <div className={`connection-panel ${showForm ? 'editing' : ''}`}>
      <div className="connection-panel-header">
        <div className="sidebar-heading"><ConnectionIcon className="sidebar-heading-icon" /><h3>连接</h3><span className="sidebar-heading-count">{connections.length}</span></div>
        {!showForm && (
          <button type="button" className="ssh-btn ssh-btn-sm connection-add" onClick={handleNew} title="新建连接" aria-label="新建连接"><PlusIcon /></button>
        )}
      </div>

      {!showForm ? (
        <div className="connection-list">
          {connections.length === 0 ? (
            <div className="connection-empty"><span className="connection-empty-icon">⌁</span><strong>还没有连接</strong><span>保存一个 MySQL 连接开始工作</span></div>
          ) : (
            connections.map((conn) => (
              <div key={conn.id} className={`connection-row ${activeConnection?.id === conn.id ? 'active' : ''}`}>
                <span className={`conn-card-dot ${activeConnection?.id === conn.id ? 'online' : ''}`} />
                <div className="connection-row-info">
                  <div className="conn-card-name">{conn.name || conn.host}</div>
                  <div className="conn-card-detail">{conn.user}@{conn.host}:{conn.port}</div>
                </div>
                <div className="connection-row-actions">
                  {activeConnection?.id === conn.id ? <button type="button" className="connection-icon-button" title="断开" aria-label={`断开 ${conn.name || conn.host}`} onClick={onDisconnect}><PowerIcon /></button> : <button type="button" className="connection-icon-button connect" title="连接" aria-label={`连接 ${conn.name || conn.host}`} onClick={() => onConnect(conn)} disabled={loading}><PowerIcon /></button>}
                  <button type="button" className="connection-icon-button" title="编辑" aria-label={`编辑 ${conn.name || conn.host}`} onClick={() => handleEdit(conn)}><EditIcon /></button>
                  <button type="button" className="connection-icon-button danger" title="删除" aria-label={`删除 ${conn.name || conn.host}`} onClick={() => onDelete(conn.id)}><TrashIcon /></button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="connection-form">
          <div className="ssh-form-group">
            <label>名称</label>
            <input className="ssh-input" type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="可选" />
          </div>
          <div className="ssh-form-group">
            <label>主机</label>
            <input className="ssh-input" type="text" value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} />
          </div>
          <div className="ssh-form-group">
            <label>端口</label>
            <input className="ssh-input" type="number" value={form.port} onChange={(e) => setForm({ ...form, port: parseInt(e.target.value) || 3306 })} />
          </div>
          <div className="ssh-form-group">
            <label>用户名</label>
            <input className="ssh-input" type="text" value={form.user} onChange={(e) => setForm({ ...form, user: e.target.value })} />
          </div>
          <div className="ssh-form-group">
            <label>密码</label>
            <input className="ssh-input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className="ssh-form-group">
            <label>默认数据库 <span>可选</span></label>
            <input className="ssh-input" type="text" value={form.database || ''} onChange={(e) => setForm({ ...form, database: e.target.value })} placeholder="连接后选择" />
          </div>
          <div className="ssh-form-group">
            <label>代理地址 <span>可选，留空由 MySSH 管理</span></label>
            <input className="ssh-input" type="url" value={form.proxyUrl || ''} onChange={(e) => setForm({ ...form, proxyUrl: e.target.value })} placeholder="由 MySSH 自动分配（旧代理可填 ws://127.0.0.1:3000）" />
          </div>
          <div className="ssh-form-actions">
            <button className="ssh-btn ssh-btn-sm ssh-btn-primary" onClick={handleSave}>{editingConn ? '更新' : '保存'}</button>
            <button className="ssh-btn ssh-btn-sm" onClick={handleCancel}>取消</button>
          </div>
        </div>
      )}

    </div>
  )
}
