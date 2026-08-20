const CSS = `
.mysql-manager{height:100%;display:flex;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;color:#e0e0e0;background:#1e1e1e}

/* Sidebar */
.mysql-sidebar{width:260px;border-right:1px solid #2d2d2d;display:flex;flex-direction:column;background:#181818;overflow:hidden;flex-shrink:0}
.mysql-main{flex:1;display:flex;flex-direction:column;overflow:hidden;background:#1e1e1e}

.sidebar{flex:1;display:flex;flex-direction:column;overflow:hidden}
.sidebar-section{border-bottom:1px solid #2d2d2d}
.sidebar-section-fill{flex:1;display:flex;flex-direction:column;overflow:hidden}
.sidebar-section-header{display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:#1f1f1f}
.sidebar-section-title{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:#666}
.sidebar-section-count{font-size:10px;color:#555;background:#2d2d2d;padding:1px 6px;border-radius:8px}
.sidebar-section-body{overflow-y:auto;flex:1}
.sidebar-empty{padding:16px;text-align:center;color:#555;font-size:12px}

.db-select{width:calc(100% - 16px);margin:8px;padding:6px 8px;background:#2d2d2d;border:1px solid #3c3c3c;border-radius:4px;color:#ccc;font-size:13px;outline:none}
.db-select:focus{border-color:#007acc}
.db-select option{background:#2d2d2d;color:#ccc}

.table-list{padding:0 4px}
.table-item{display:flex;align-items:center;gap:8px;padding:5px 12px;cursor:pointer;border-radius:4px;color:#aaa;font-size:13px;transition:all .1s}
.table-item:hover{background:#2a2d2e;color:#ddd}
.table-item.selected{background:#094771;color:#fff}
.table-icon{font-size:12px;color:#666;flex-shrink:0}
.table-item.selected .table-icon{color:#4fc3f7}
.table-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* Connection */
.ssh-btn{display:inline-flex;align-items:center;justify-content:center;gap:4px;padding:5px 12px;border:1px solid #3c3c3c;border-radius:4px;background:#2d2d2d;cursor:pointer;font-size:12px;font-family:inherit;transition:all .15s;user-select:none;white-space:nowrap;line-height:1.4;color:#ccc}
.ssh-btn:hover{border-color:#555;background:#353535;color:#fff}
.ssh-btn:active{background:#404040}
.ssh-btn:disabled{opacity:.35;cursor:not-allowed;pointer-events:none}
.ssh-btn-sm{padding:3px 8px;font-size:11px}
.ssh-btn-primary{background:#007acc;border-color:#007acc;color:#fff}
.ssh-btn-primary:hover{background:#1a8ae8;border-color:#1a8ae8;color:#fff}
.ssh-btn-danger{color:#e74c3c;border-color:transparent;background:transparent}
.ssh-btn-danger:hover{background:#2a1515;color:#ff6b6b}

.conn-card{background:#252526;border:1px solid #333;border-radius:6px;padding:10px 12px;margin-bottom:6px;transition:all .15s;cursor:pointer}
.conn-card:hover{border-color:#444}
.conn-card.active{border-color:#007acc;background:#1a3352}
.conn-card-header{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
.conn-card-info{flex:1;min-width:0}
.conn-card-name{display:block;font-weight:500;font-size:13px;color:#e0e0e0;margin-bottom:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.conn-card-detail{display:block;font-size:11px;color:#666;font-family:Monaco,Menlo,'Ubuntu Mono',monospace}
.conn-card-actions{display:flex;gap:4px;flex-shrink:0}

.ssh-form-group{margin-bottom:10px}
.ssh-form-group label{display:block;margin-bottom:3px;font-size:12px;font-weight:500;color:#999}
.ssh-input{width:100%;padding:6px 10px;border:1px solid #3c3c3c;border-radius:4px;font-size:13px;font-family:inherit;color:#e0e0e0;background:#2d2d2d;transition:all .15s;outline:none;box-sizing:border-box}
.ssh-input:hover{border-color:#555}
.ssh-input:focus{border-color:#007acc;box-shadow:0 0 0 1px rgba(0,122,204,.3)}
.ssh-input::placeholder{color:#555}
.ssh-form-actions{display:flex;gap:8px;margin-top:14px}

.conn-status{display:flex;align-items:center;gap:8px;padding:8px 12px;background:#1a2e1a;border-top:1px solid #2d4a2d;font-size:12px}
.conn-status-dot{width:8px;height:8px;border-radius:50%;background:#4caf50;flex-shrink:0}
.conn-status-text{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#6f6}

/* SQL Editor */
.sql-editor{display:flex;flex-direction:column;border-bottom:1px solid #2d2d2d}
.sql-editor-header{display:flex;justify-content:space-between;align-items:center;padding:6px 12px;background:#1f1f1f;border-bottom:1px solid #2d2d2d}
.sql-editor-header h4{margin:0;font-size:11px;font-weight:600;color:#666;text-transform:uppercase;letter-spacing:.5px}
.sql-editor-actions{display:flex;gap:6px}
.sql-editor-body{padding:8px 12px}
.sql-editor-body textarea{width:100%;height:100px;border:1px solid #333;border-radius:6px;padding:10px 12px;font-family:Monaco,Menlo,'Ubuntu Mono',monospace;font-size:13px;line-height:1.6;color:#e0e0e0;background:#1e1e1e;resize:vertical;outline:none;transition:all .15s;box-sizing:border-box}
.sql-editor-body textarea:focus{border-color:#007acc;box-shadow:0 0 0 1px rgba(0,122,204,.3)}
.sql-editor-body textarea::placeholder{color:#555}

.mysql-error{padding:8px 12px;background:#2a1515;border-bottom:1px solid #4a2020;color:#ff6b6b;font-size:12px}

/* Table Detail */
.table-detail{flex:1;display:flex;flex-direction:column;overflow:hidden}
.tab-bar{display:flex;align-items:center;background:#1f1f1f;border-bottom:1px solid #2d2d2d;padding:0 8px}
.tab{padding:8px 16px;font-size:12px;color:#888;cursor:pointer;border-bottom:2px solid transparent;transition:all .15s;user-select:none}
.tab:hover{color:#ccc}
.tab.active{color:#4fc3f7;border-bottom-color:#007acc}
.tab-label{margin-left:auto;font-size:11px;color:#555;font-family:Monaco,Menlo,'Ubuntu Mono',monospace}
.tab-content{overflow:auto;flex:1}
.tab-content-fill{display:flex;flex-direction:column;flex:1}

/* Result */
.result-header{display:flex;justify-content:space-between;align-items:center;padding:6px 12px;background:#1f1f1f;border-bottom:1px solid #2d2d2d;font-size:12px;color:#666}
.result-actions{display:flex;gap:8px;align-items:center}
.result-table-wrapper{flex:1;overflow:auto}
.result-table{width:100%;border-collapse:collapse;font-size:13px}
.result-table th{position:sticky;top:0;padding:6px 10px;text-align:left;font-weight:500;background:#1f1f1f;border-bottom:2px solid #333;cursor:pointer;user-select:none;white-space:nowrap;color:#888;font-size:12px}
.result-table th:hover{background:#2a2a2a;color:#bbb}
.result-table th.sorted{background:#094771;color:#4fc3f7}
.result-table td{padding:5px 10px;border-bottom:1px solid #252525;max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#ccc}
.result-table tr:hover td{background:#2a2a2a}
.null-value{color:#555;font-style:italic;font-size:11px}
.col-name{color:#4fc3f7}
.col-type{color:#c586c0;font-size:12px}
.key-badge{font-size:10px;padding:1px 5px;border-radius:3px;font-weight:600}
.key-badge.pri{background:#3a1a5c;color:#c084fc}
.key-badge.uni{background:#1a3a5c;color:#60a5fa}
.key-badge.mul{background:#3a3a1c;color:#fbbf24}
.action-col{width:40px;text-align:center}
.cell-input{width:100%;padding:3px 6px;border:1px solid #007acc;border-radius:3px;background:#1e1e1e;color:#e0e0e0;font-size:12px;outline:none;box-sizing:border-box}
.result-pagination{display:flex;justify-content:center;align-items:center;gap:8px;padding:6px;background:#1f1f1f;border-top:1px solid #2d2d2d;font-size:12px;color:#666}
.result-empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px;color:#555;font-size:13px;gap:4px}
.result-success{color:#6f6}
`

let injected = false

export function injectStyles(): void {
  if (injected) return
  if (typeof document === 'undefined') return
  const style = document.createElement('style')
  style.textContent = CSS
  document.head.appendChild(style)
  injected = true
}
