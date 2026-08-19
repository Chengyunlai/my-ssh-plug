import { useState, useEffect } from 'react'

interface WslDistribution {
  name: string
  state: string
  version: string
}

export default function WslPanel(): React.JSX.Element {
  const [distributions, setDistributions] = useState<WslDistribution[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkWslAvailability()
  }, [])

  const checkWslAvailability = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // 检查是否在 Windows 环境
      const isWindows = navigator.platform.toLowerCase().includes('win')
      if (!isWindows) {
        setError('此插件仅支持 Windows 系统')
        return
      }

      // 尝试获取 WSL 发行版列表
      // 注意：这里需要通过 MySSH 的 API 执行本地命令
      // 由于没有具体的 API 文档，这里使用模拟数据
      const mockDistributions: WslDistribution[] = [
        { name: 'Ubuntu', state: 'Running', version: '2' },
        { name: 'Ubuntu-20.04', state: 'Stopped', version: '2' },
        { name: 'Debian', state: 'Running', version: '2' }
      ]
      
      setDistributions(mockDistributions)
    } catch (err) {
      setError('无法检测 WSL 发行版')
    } finally {
      setLoading(false)
    }
  }

  const openWslTerminal = (distributionName: string) => {
    // 这里应该调用 MySSH 的 API 打开新的终端会话
    // 由于没有具体的 API 文档，这里只是显示提示
    alert(`打开 ${distributionName} 终端\n\n注意：需要实现 MySSH 的本地终端 API`)
  }

  const refreshDistributions = () => {
    checkWslAvailability()
  }

  return (
    <div className="wsl-panel">
      <div className="wsl-header">
        <h3>WSL 终端</h3>
        <button 
          className="wsl-refresh-btn"
          onClick={refreshDistributions}
          disabled={loading}
        >
          {loading ? '检测中...' : '刷新'}
        </button>
      </div>

      {error && (
        <div className="wsl-error">
          {error}
        </div>
      )}

      {!error && (
        <div className="wsl-content">
          {loading ? (
            <div className="wsl-loading">正在检测 WSL 发行版...</div>
          ) : distributions.length === 0 ? (
            <div className="wsl-empty">
              未检测到 WSL 发行版
              <br />
              <small>请先在 Windows 中安装 WSL</small>
            </div>
          ) : (
            <div className="wsl-list">
              {distributions.map((dist) => (
                <div key={dist.name} className="wsl-item">
                  <div className="wsl-item-info">
                    <div className="wsl-item-name">{dist.name}</div>
                    <div className="wsl-item-status">
                      <span className={`wsl-status ${dist.state.toLowerCase()}`}>
                        {dist.state}
                      </span>
                      <span className="wsl-version">v{dist.version}</span>
                    </div>
                  </div>
                  <button
                    className="wsl-open-btn"
                    onClick={() => openWslTerminal(dist.name)}
                  >
                    打开终端
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="wsl-footer">
        <small>WSL (Windows Subsystem for Linux)</small>
      </div>
    </div>
  )
}