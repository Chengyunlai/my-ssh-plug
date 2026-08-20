import { useState } from 'react'

interface Connection {
  id: string
  name: string
  host: string
  port: number
  user: string
  password: string
  database?: string
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
    id: '', name: '', host: 'localhost', port: 3306, user: 'root', password: '', database: ''
  })

  const handleNew = () => {
    setEditingConn(null)
    setForm({ id: `conn-${Date.now()}`, name: '', host: 'localhost', port: 3306, user: 'root', password: '', database: '' })
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
    <div className="mysql-sidebar-section">
      <div className="mysql-sidebar-header">
        <h3>连接</h3>
        {!showForm && (
          <button className="ssh-btn ssh-btn-sm" onClick={handleNew}>+ 新建</button>
        )}
      </div>

      {!showForm ? (
        <div className="mysql-sidebar-body">
          {connections.length === 0 ? (
            <div className="result-empty" style={{ padding: '24px' }}>暂无连接</div>
          ) : (
            connections.map((conn) => (
              <div key={conn.id} className={`conn-card ${activeConnection?.id === conn.id ? 'active' : ''}`}>
                <div className="conn-card-header">
                  <div className="conn-card-info">
                    <div className="conn-card-name">{conn.name || conn.host}</div>
                    <div className="conn-card-detail">{conn.user}@{conn.host}:{conn.port}</div>
                  </div>
                  <div className="conn-card-actions">
                    <button className="ssh-btn ssh-btn-sm ssh-btn-primary" onClick={() => onConnect(conn)} disabled={loading}>连接</button>
                    <button className="ssh-btn ssh-btn-sm" onClick={() => handleEdit(conn)}>编辑</button>
                    <button className="ssh-btn ssh-btn-sm ssh-btn-danger" onClick={() => onDelete(conn.id)}>删除</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="mysql-sidebar-body">
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
            <label>数据库 (可选)</label>
            <input className="ssh-input" type="text" value={form.database || ''} onChange={(e) => setForm({ ...form, database: e.target.value })} placeholder="连接后选择" />
          </div>
          <div className="ssh-form-actions">
            <button className="ssh-btn ssh-btn-sm ssh-btn-primary" onClick={handleSave}>{editingConn ? '更新' : '保存'}</button>
            <button className="ssh-btn ssh-btn-sm" onClick={handleCancel}>取消</button>
          </div>
        </div>
      )}

      {connected && activeConnection && (
        <div className="conn-status">
          <span className="conn-status-dot"></span>
          <span className="conn-status-text">{activeConnection.name || activeConnection.host}</span>
          <button className="ssh-btn ssh-btn-sm" onClick={onDisconnect}>断开</button>
        </div>
      )}
    </div>
  )
}
