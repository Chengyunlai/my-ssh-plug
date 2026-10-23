const CSS = `
:scope{height:100%;min-width:0;min-height:0;display:flex;font-family:var(--myssh-plugin-font-ui);font-size:13px;color:var(--myssh-plugin-text);background:var(--myssh-plugin-bg);--mysql-gutter:14px;--mysql-bg:var(--myssh-plugin-bg);--mysql-surface:var(--myssh-plugin-surface);--mysql-raised:var(--myssh-plugin-surface-raised);--mysql-hover:var(--myssh-plugin-surface-hover);--mysql-border:var(--myssh-plugin-border);--mysql-border-strong:var(--myssh-plugin-border-strong);--mysql-text:var(--myssh-plugin-text);--mysql-text-strong:var(--myssh-plugin-text-strong);--mysql-text-muted:var(--myssh-plugin-text-muted);--mysql-accent:var(--myssh-plugin-accent);--mysql-success:var(--myssh-plugin-success);--mysql-tab-active:color-mix(in srgb,var(--mysql-accent) 20%,var(--mysql-surface));--mysql-danger:var(--myssh-plugin-danger);--mysql-space-1:var(--myssh-plugin-space-1);--mysql-space-2:var(--myssh-plugin-space-2);--mysql-space-3:var(--myssh-plugin-space-3);--mysql-space-4:var(--myssh-plugin-space-4);--mysql-radius-sm:var(--myssh-plugin-radius-sm);--mysql-radius-md:var(--myssh-plugin-radius-md);--mysql-radius-lg:var(--myssh-plugin-radius-lg)}

/* ENUM metadata uses neutral ordinal colors, never infers business meaning from names. */
.enum-value{display:inline-block;max-width:240px;overflow:hidden;text-overflow:ellipsis;vertical-align:middle;padding:2px 8px;border:1px solid color-mix(in srgb,currentColor 25%,transparent);border-radius:4px;font-size:11px;line-height:18px;white-space:nowrap;background:color-mix(in srgb,currentColor 7%,transparent)}
.enum-tone-0{color:#83b9e8}.enum-tone-1{color:#b8a6df}.enum-tone-2{color:#9bc6b2}.enum-tone-3{color:#d8bd8f}.enum-tone-4{color:#aab8c8}
.enum-definition{display:inline-block;margin-left:8px;font-weight:400;vertical-align:middle}
.enum-definition>summary{cursor:pointer;font-size:10px;color:var(--mysql-text-muted);border:1px solid var(--mysql-border);border-radius:4px;padding:2px 5px;list-style:none}
.enum-definition>summary:focus-visible,.enum-editor select:focus-visible{outline:2px solid var(--mysql-accent);outline-offset:2px}
.enum-definition>div{position:absolute;z-index:12;width:260px;max-height:260px;overflow:auto;white-space:normal;padding:12px;border:1px solid var(--mysql-border-strong);border-radius:6px;background:var(--mysql-surface);color:var(--mysql-text);box-shadow:0 8px 24px #0005;text-align:left}
.enum-definition p{font-size:12px;line-height:1.5;overflow-wrap:anywhere}.enum-definition ul{display:flex;flex-wrap:wrap;gap:6px;padding:0;list-style:none}.enum-definition small{color:var(--mysql-text-muted)}
.enum-editor{display:flex;gap:6px;align-items:center;min-width:210px}
.enum-editor select{max-width:220px;min-width:100px;background:var(--mysql-bg);color:var(--mysql-text);border:1px solid var(--mysql-accent);border-radius:4px;padding:5px;font:inherit;color-scheme:dark}

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
.table-item{display:flex;align-items:center;gap:8px;padding:5px 12px;cursor:pointer;border-radius:4px;color:#aaa;font-size:13px;transition:background-color .1s,color .1s,border-color .1s}
.table-item:hover{background:#2a2d2e;color:#ddd}
.table-item.selected{background:#094771;color:#fff}
.table-icon{font-size:12px;color:#666;flex-shrink:0}
.table-item.selected .table-icon{color:#4fc3f7}
.table-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* Connection */
.ssh-btn{display:inline-flex;align-items:center;justify-content:center;gap:4px;padding:5px 12px;border:1px solid #3c3c3c;border-radius:4px;background:#2d2d2d;cursor:pointer;font-size:12px;font-family:inherit;transition:background-color .15s,color .15s,border-color .15s,opacity .15s,transform .15s;user-select:none;white-space:nowrap;line-height:1.4;color:#ccc}
.ssh-btn:hover{border-color:#555;background:#353535;color:#fff}
.ssh-btn:active{background:#404040}
.ssh-btn:disabled{opacity:.35;cursor:not-allowed;pointer-events:none}
.ssh-btn-sm{padding:3px 8px;font-size:11px}
.ssh-btn-primary{background:#007acc;border-color:#007acc;color:#fff}
.ssh-btn-primary:hover{background:#1a8ae8;border-color:#1a8ae8;color:#fff}
.ssh-btn-danger{color:#e74c3c;border-color:transparent;background:transparent}
.ssh-btn-danger:hover{background:#2a1515;color:#ff6b6b}

.conn-card{background:#252526;border:1px solid #333;border-radius:6px;padding:10px 12px;margin-bottom:6px;transition:background-color .15s,border-color .15s,color .15s;cursor:pointer}
.conn-card:hover{border-color:#444}
.conn-card.active{border-color:#007acc;background:#1a3352}
.conn-card-header{display:block}
.conn-card-info{flex:1;min-width:0}
.conn-card-name{display:block;font-weight:500;font-size:13px;color:#e0e0e0;margin-bottom:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.conn-card-detail{display:block;font-size:11px;color:#666;font-family:Monaco,Menlo,'Ubuntu Mono',monospace}
.conn-card-actions{display:flex;gap:4px;flex-shrink:0}

.ssh-form-group{margin-bottom:10px}
.ssh-form-group label{display:block;margin-bottom:3px;font-size:12px;font-weight:500;color:#999}
.ssh-input{width:100%;padding:6px 10px;border:1px solid #3c3c3c;border-radius:4px;font-size:13px;font-family:inherit;color:#e0e0e0;background:#2d2d2d;transition:background-color .15s,color .15s,border-color .15s,box-shadow .15s;outline:none;box-sizing:border-box}
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
.sql-editor-body textarea{width:100%;height:100px;border:1px solid #333;border-radius:6px;padding:10px 12px;font-family:Monaco,Menlo,'Ubuntu Mono',monospace;font-size:13px;line-height:1.6;color:#e0e0e0;background:#1e1e1e;resize:vertical;outline:none;transition:background-color .15s,color .15s,border-color .15s,box-shadow .15s;box-sizing:border-box}
.sql-editor-body textarea:focus{border-color:#007acc;box-shadow:0 0 0 1px rgba(0,122,204,.3)}
.sql-editor-body textarea::placeholder{color:#555}

.mysql-error{padding:8px 12px;background:#2a1515;border-bottom:1px solid #4a2020;color:#ff6b6b;font-size:12px}

/* Table Detail */
.table-detail{flex:1;display:flex;flex-direction:column;overflow:hidden}
.tab-bar{display:flex;align-items:center;background:#1f1f1f;border-bottom:1px solid #2d2d2d;padding:0 8px}
.tab{padding:8px 16px;font-size:12px;color:#888;cursor:pointer;border-bottom:2px solid transparent;transition:color .15s,border-color .15s,background-color .15s;user-select:none}
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

/* Navicat-style workspace refinements */
:scope{background:#101316;color:#d7dde5;font-size:12px;letter-spacing:.01em}
.mysql-sidebar{width:286px;background:#15191d;border-right:1px solid #2b333b}
.mysql-main{background:#101316}
.connection-panel{display:flex;flex:0 0 auto;flex-direction:column;max-height:42%;min-height:0;border-bottom:1px solid #2b333b;overflow:hidden}
.connection-panel.editing{flex:1 1 100%;max-height:none}
.connection-panel-header{display:flex;justify-content:space-between;align-items:center;padding:12px var(--mysql-gutter);background:#181d22;border-bottom:1px solid #262e35}
.connection-panel-header h3{margin:0;font-size:14px;font-weight:650;color:#eef2f5}
.panel-kicker{font-size:9px;letter-spacing:.14em;color:#6e7b87}
.connection-list{flex:0 1 auto;min-height:0;max-height:240px;overflow:auto;padding:10px var(--mysql-gutter) 8px}
.connection-empty{display:flex;flex-direction:column;align-items:center;gap:5px;padding:22px 10px;color:#71808d;text-align:center}
.connection-empty strong{color:#c6d0d8;font-size:12px;font-weight:550}
.connection-empty-icon{font-size:25px;color:#4f6678;line-height:1}
.connection-form{flex:1;min-height:0;overflow:auto;padding:14px}
.connection-form .ssh-form-group{margin-bottom:11px}
.connection-form label span{float:right;color:#61707c;font-weight:400}
.conn-card{box-sizing:border-box;background:#1b2127;border:1px solid #2c353d;border-radius:7px;padding:10px 11px;margin-bottom:8px;cursor:default}
.conn-card:hover{border-color:#42515d;background:#20272e}
.conn-card.active{border-color:var(--mysql-accent);border-top:2px solid var(--mysql-accent);background:var(--mysql-tab-active)}
.conn-card-main{display:flex;align-items:center;gap:9px;min-width:0}
.conn-card-dot{width:8px;height:8px;flex:0 0 8px;border-radius:50%;background:#55636d}
.conn-card-dot.online{background:var(--mysql-success);box-shadow:0 0 0 3px color-mix(in srgb,var(--mysql-success) 16%,transparent)}
.conn-card-name{color:#e4ebf0;font-size:12px;font-weight:600}
.conn-card-detail{color:#72808b;font-size:10px}
.conn-card-actions{display:flex;align-items:center;justify-content:flex-end;gap:5px;margin-top:9px;padding-top:8px;border-top:1px solid color-mix(in srgb,var(--mysql-border) 70%,transparent);flex-shrink:0;opacity:1}
.conn-card-actions .ssh-btn{min-width:38px}
.conn-status{display:flex;align-items:center;gap:8px;margin:0 var(--mysql-gutter) 10px;padding:8px 10px;background:color-mix(in srgb,var(--mysql-success) 8%,var(--mysql-surface));border:1px solid color-mix(in srgb,var(--mysql-success) 28%,var(--mysql-border));border-radius:var(--mysql-radius-sm);font-size:12px}
.conn-status-text{color:var(--mysql-text);font-weight:500}
.sidebar-section-header{min-height:40px;box-sizing:border-box;padding:10px var(--mysql-gutter);background:#181d22;border-bottom:1px solid #262e35}
.sidebar-section-header{padding:10px var(--mysql-gutter)}
.sidebar-section-title{display:flex;align-items:center;gap:5px;color:#9daab4;font-size:10px;letter-spacing:.07em}
.tree-chevron{color:#557487;font-size:13px;line-height:1}
.sidebar-section-count{background:#29333c;color:#8c9aa5;border-radius:9px}
.db-select{display:block;width:calc(100% - 28px);height:34px;margin:10px var(--mysql-gutter);background:#1b2228;border-color:#35414a;color:#d5dde3;border-radius:5px}
.table-search{display:flex;align-items:center;gap:6px;height:34px;box-sizing:border-box;margin:8px var(--mysql-gutter) 6px;padding:0 8px;border:1px solid #303b44;border-radius:5px;background:#1b2228;color:#687985}
.table-search input{min-width:0;width:100%;border:0;outline:0;background:transparent;color:#cdd6dd;font:inherit}
.table-search input::placeholder{color:#65737e}
.table-list{padding:0 var(--mysql-gutter)}
.table-item{min-height:32px;box-sizing:border-box;padding:0 8px;color:#a8b4bd;border-radius:5px}
.table-item:hover{background:#202b33;color:#e1e8ed}
.table-item.selected{background:#1d4b68;color:#fff}
.table-icon{color:#668da4;font-size:13px}
.table-query-button{margin-left:auto;opacity:0;border:0;background:transparent;color:#7daac2;cursor:pointer;font-size:12px;padding:0 2px}
.table-item:hover .table-query-button,.table-item.selected .table-query-button{opacity:1}
.workspace-toolbar{height:38px;display:flex;align-items:center;justify-content:space-between;padding:0 var(--mysql-gutter);border-bottom:1px solid #2b333b;background:#151a1e;flex-shrink:0}
.workspace-breadcrumb{display:flex;align-items:center;gap:8px;color:#86939d;font-size:11px;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.workspace-product{font-weight:650;color:#dce5ea}
.workspace-separator{color:#4a5964}
.workspace-toolbar-actions{display:flex;align-items:center;gap:10px}
.workspace-tabs{display:flex;align-items:stretch;min-height:46px;overflow:auto;border-bottom:1px solid #2b333b;background:#11161a;flex-shrink:0}
.workspace-tab{display:inline-flex;align-items:center;gap:9px;min-width:180px;max-width:320px;height:46px;padding:0 14px;border:0;border-right:1px solid #252e35;border-top:2px solid transparent;border-radius:0;box-shadow:none;background:#151b20;color:#7f8d96;font:inherit;cursor:pointer;white-space:nowrap}
    .workspace-tab:hover{background:#1b252c;color:#bdcbd3}
.workspace-tab.active{background:var(--mysql-tab-active);color:var(--mysql-text-strong);border-top-color:var(--mysql-accent);border-bottom:0;box-shadow:none}
.workspace-tab-icon{display:inline-flex;align-items:center;justify-content:center;flex:0 0 14px;width:14px;height:14px;color:#6d9bb2;font-size:12px}
.workspace-tab-icon svg{width:14px;height:14px;display:block}
.workspace-tab-label{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.workspace-tab-close{flex-shrink:0;margin-left:auto;padding:1px 3px;border-radius:3px;color:#687781;font-size:15px;line-height:1}
.workspace-tab-close:hover{background:#33414a;color:#e5edf1}
.workspace-new-tab{display:flex;align-items:center;justify-content:center;width:46px;height:46px;border:0;border-right:1px solid #252e35;background:#11161a;color:#9aaab6;font-size:22px;cursor:pointer}
.workspace-new-tab:hover{background:#1b252c;color:#c9e3ef}
.workspace-tabs-empty{display:flex;align-items:center;padding:0 14px;color:#5e6d77;font-size:10px}
.proxy-indicator{display:inline-flex;align-items:center;gap:5px;color:#778690;font-size:10px}
.proxy-indicator i{width:6px;height:6px;border-radius:50%;background:#65727b}
.proxy-indicator.online i{background:#52c78a;box-shadow:0 0 0 3px rgba(82,199,138,.12)}
.sql-editor{border-bottom:1px solid #2b333b;background:#12171b}
.sql-editor-header{padding:7px 14px;background:#181d22;border-bottom:1px solid #262e35}
.sql-title{display:flex;align-items:center;gap:7px;color:#aab7c0;font-size:11px;font-weight:600}
.sql-dot{width:6px;height:6px;border-radius:50%;background:#4fa2d0}
.sql-editor-body{padding:10px 14px 12px}
.sql-editor-body textarea{height:116px;background:#0f1418;border-color:#303b44;border-radius:5px;color:#d9e2e8;font-size:12px;line-height:1.7}
.sql-editor-body textarea:focus{border-color:#3e9bd0;box-shadow:0 0 0 2px rgba(62,155,208,.13)}
.history-select{max-width:170px;padding:4px 7px;border:1px solid #35414a;border-radius:4px;background:#1b2228;color:#9eabb4;font:inherit}
.mysql-error{padding:9px 14px;background:#321c20;border-bottom:1px solid #65343c;color:#ff9b9b}
.tab-bar{display:flex;align-items:stretch;min-height:40px;padding:0;background:#11161a;border-bottom:1px solid #2b333b}
.tab{display:inline-flex;align-items:center;justify-content:center;min-width:88px;height:40px;padding:0 14px;border:0;border-top:2px solid transparent;border-radius:0;box-shadow:none;background:var(--mysql-surface);color:#7f8d96;font-size:12px;cursor:pointer;user-select:none}
.tab:hover{background:#1b252c;color:#bdcbd3}
.tab.active{background:var(--mysql-tab-active);color:var(--mysql-text-strong);border-top-color:var(--mysql-accent);border-bottom:0;box-shadow:none}
.tab.active::after{content:none;display:none}
.tab-label{padding-right:var(--mysql-gutter);color:#6e7b84}
.result-header{padding:8px 14px;background:#171c20;border-bottom:1px solid #2b333b;color:#87949e}
.result-table{font-size:12px}
.result-table th{padding:8px 10px;background:#1a2025;border-bottom:1px solid #34404a;color:#91a0aa;font-size:11px}
.result-table th.sorted{background:#1b435c;color:#9fdaef}
.result-table td{padding:7px 10px;border-bottom:1px solid #242d34;color:#c4cdd4}
.result-table tr:hover td{background:#1a252c}
.result-pagination{padding:8px;background:#171c20;border-top:1px solid #2b333b}
.result-empty{color:#6f7e88}
.structure-switcher{display:flex;align-items:center;gap:4px;padding:9px var(--mysql-gutter);border-bottom:1px solid #2b333b;background:#141a1e}
.structure-switcher button{border:0;border-radius:4px;padding:5px 9px;background:transparent;color:#84939d;font:inherit;cursor:pointer}
.structure-switcher button:hover{background:#202b33;color:#c8d5dc}
.structure-switcher button.active{background:#214a62;color:#bde6f7}
.structure-switcher button span{display:inline-flex;min-width:16px;justify-content:center;margin-left:4px;padding:1px 4px;border-radius:8px;background:#2d3941;color:#7e919c;font-size:10px}
.structure-switcher button.active span{background:#336d89;color:#d8f3ff}
.structure-description{display:flex;align-items:baseline;flex-wrap:wrap;gap:8px 14px;padding:12px var(--mysql-gutter);border-bottom:1px solid var(--mysql-border);line-height:1.7;white-space:pre-wrap;overflow-wrap:anywhere}
.structure-description>strong{flex-shrink:0;font-size:12px;color:var(--mysql-text-muted)}
.structure-comment-text{color:var(--mysql-text);line-height:1.6}
.structure-comment-empty{color:var(--mysql-text-muted);font-size:12px}
.structure-columns td.structure-comment{min-width:240px;max-width:460px;width:36%;white-space:pre-wrap;overflow-wrap:anywhere;vertical-align:top}
.structure-comment-raw{margin-top:5px;font-size:11px;color:var(--mysql-text-muted);width:100%}
.structure-comment-raw summary{cursor:pointer;white-space:nowrap}
.structure-comment-raw p{margin:6px 0;white-space:pre-wrap;overflow-wrap:anywhere}
.insert-row-panel{padding:12px 14px;background:#17232a;border-bottom:1px solid #2f5365}
.insert-row-title{display:flex;align-items:baseline;gap:10px;margin-bottom:10px;color:#d7e4eb;font-size:12px}
.insert-row-title span{color:#7f929d;font-size:10px}
.insert-row-fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;max-height:190px;overflow:auto}
.insert-row-fields label{display:flex;flex-direction:column;gap:4px;color:#8b9da8;font-size:10px}
.insert-row-fields input{width:100%;box-sizing:border-box;padding:6px 7px;border:1px solid #354956;border-radius:4px;background:#11191e;color:#d8e3e9;font:inherit;outline:none}
.insert-row-fields input:focus{border-color:#3e9bd0;box-shadow:0 0 0 2px rgba(62,155,208,.12)}
.insert-row-fields input:disabled{color:#647681;background:#192126}
.insert-row-actions{display:flex;gap:7px;margin-top:11px}
.ssh-btn{border-color:#35414a;background:#20272d;color:#b8c4cc;border-radius:5px}
.ssh-btn:hover{border-color:#4d6473;background:#27323a;color:#e9f0f4}
.ssh-btn-primary{background:#267cac;border-color:#267cac}
.ssh-btn-primary:hover{background:#338fbf;border-color:#338fbf}
.ssh-input{background:#1b2228;border-color:#35414a;color:#d6e0e6;border-radius:5px}
.ssh-input:focus{border-color:#3e9bd0;box-shadow:0 0 0 2px rgba(62,155,208,.13)}

/* 宿主主题对齐：内部结构自由，视觉语义由 MySSH token 控制。 */
:scope,.mysql-main{background:var(--mysql-bg);color:var(--mysql-text)}
.mysql-sidebar,.connection-panel-header,.sidebar-section-header,.sql-editor-header,.result-header,.tab-bar,.result-pagination{background:var(--mysql-surface);border-color:var(--mysql-border)}
.mysql-sidebar{border-right-color:var(--mysql-border)}
.workspace-toolbar,.workspace-tabs,.sql-editor{background:var(--mysql-bg);border-color:var(--mysql-border)}
.workspace-tab,.workspace-new-tab,.conn-card,.db-select,.ssh-input,.history-select{background:var(--mysql-surface);border-color:var(--mysql-border-strong);color:var(--mysql-text)}
.connection-panel-header h3,.workspace-product,.conn-card-name{color:var(--mysql-text-strong)}
.panel-kicker,.workspace-breadcrumb,.workspace-separator,.workspace-tabs-empty,.proxy-indicator,.conn-card-detail,.sidebar-section-title,.result-empty{color:var(--mysql-text-muted)}
.workspace-tab.active,.tab.active,.table-item.selected,.structure-switcher button.active{background:var(--mysql-tab-active);color:var(--mysql-text-strong)}
.workspace-tab.active{box-shadow:none}
.conn-status-dot{background:var(--mysql-success)}
.ssh-btn-primary{background:var(--mysql-accent);border-color:var(--mysql-accent);color:var(--mysql-bg)}
.ssh-btn-danger,.mysql-error{color:var(--mysql-danger)}
.sidebar-heading{display:flex;align-items:center;gap:8px;min-width:0}
.sidebar-heading-icon{color:var(--mysql-accent);font-size:15px}
.sidebar-heading h3{margin:0!important}
.sidebar-heading-count{min-width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center;border-radius:9px;background:var(--mysql-raised);color:var(--mysql-text-muted);font-size:10px;font-weight:500}
.connection-add{width:28px;height:28px;padding:0;font-size:18px;line-height:1}
.connection-add svg{width:15px;height:15px}
.connection-row{display:flex;align-items:center;gap:9px;min-height:48px;box-sizing:border-box;padding:7px 8px;border-bottom:1px solid color-mix(in srgb,var(--mysql-border) 60%,transparent);color:var(--mysql-text);cursor:pointer}
.connection-row:hover{background:var(--mysql-hover)}
.connection-row.active{background:var(--mysql-tab-active);box-shadow:inset 2px 0 0 var(--mysql-accent)}
.connection-row-info{flex:1;min-width:0}
.connection-row .conn-card-name{font-size:12px;line-height:1.3}
.connection-row .conn-card-detail{font-size:10px;line-height:1.3}
.connection-row-actions{display:flex;align-items:center;gap:2px;opacity:0;transition:opacity .12s}
.connection-row:hover .connection-row-actions,.connection-row.active .connection-row-actions{opacity:1}
.connection-icon-button{width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;padding:0;border:0;border-radius:4px;background:transparent;color:var(--mysql-text-muted);font:inherit;font-size:12px;cursor:pointer}
.connection-icon-button svg{width:14px;height:14px;display:block}
.connection-icon-button:hover{background:var(--mysql-raised);color:var(--mysql-text-strong)}
.connection-icon-button.connect{color:var(--mysql-accent)}
.connection-icon-button.danger:hover{background:color-mix(in srgb,var(--mysql-danger) 15%,transparent);color:var(--mysql-danger)}
.connection-icon-button:focus-visible,.connection-add:focus-visible,.object-tree button:focus-visible,.table-item:focus-visible,.table-query-button:focus-visible{outline:2px solid var(--mysql-accent);outline-offset:-2px}
.database-list{padding:4px 0 7px;max-height:150px;overflow:auto}
.database-item{width:100%;height:30px;display:flex;align-items:center;gap:7px;padding:0 var(--mysql-gutter);border:0;background:transparent;color:var(--mysql-text);font:inherit;text-align:left;cursor:pointer}
.database-item:hover{background:var(--mysql-hover)}
.database-item.selected{background:var(--mysql-tab-active);color:var(--mysql-text-strong)}
.database-chevron{width:11px;color:var(--mysql-text-muted);font-size:14px}
.database-icon{color:var(--mysql-accent);font-size:12px}
.tree-icon{color:var(--mysql-text-muted);font-size:11px}
.sidebar-section-fill{min-height:0}
.object-tree{display:block;overflow:auto;padding:0 0 10px}
.object-tree-root,.table-group-row{width:100%;height:38px;display:flex;align-items:center;gap:7px;padding:0 var(--mysql-gutter);border:0;border-bottom:1px solid var(--mysql-border);background:var(--mysql-surface);color:var(--mysql-text);font:inherit;font-size:11px;font-weight:600;text-align:left;cursor:pointer}
.object-tree-root:hover,.table-group-row:hover{background:var(--mysql-hover);color:var(--mysql-text-strong)}
.object-tree-root .sidebar-section-count,.table-group-row .sidebar-section-count{margin-left:auto}
.object-tree-icon,.database-icon,.table-group-icon{flex-shrink:0;color:var(--mysql-accent)}
.object-tree-content{padding:3px 0}
.database-node{display:block}
.object-tree .database-item{height:30px;padding:0 var(--mysql-gutter);gap:7px}
.database-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.database-children{position:relative}
.database-children::before{content:'';position:absolute;left:20px;top:0;bottom:0;width:1px;background:var(--mysql-border)}
.table-group-row{height:32px;padding-left:32px;border-bottom:0;background:transparent;font-weight:500}
.table-group-content{padding-left:24px}
.object-tree .table-search{margin:5px var(--mysql-gutter) 5px 8px}
.object-tree .table-search svg{width:13px;height:13px;flex:0 0 13px;color:var(--mysql-text-muted)}
.object-tree .sidebar-section-body{overflow:visible;flex:none}
.object-tree .table-list{padding:0 var(--mysql-gutter) 0 8px}
.object-tree .table-item{min-height:29px;padding:0 7px}
.object-tree .table-item:focus-visible{background:var(--mysql-hover);color:var(--mysql-text-strong)}
.object-tree .table-icon{width:14px;height:14px;flex:0 0 14px;color:var(--mysql-text-muted)}
.object-tree .table-query-button{width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center}
.object-tree .table-query-button svg{width:13px;height:13px}
@media (max-width: 760px){.mysql-sidebar{width:230px}.workspace-product{display:none}.sql-editor-body textarea{height:90px}}
@media (prefers-reduced-motion: reduce){*,*::before,*::after{transition-duration:0.01ms!important;animation-duration:0.01ms!important}}
.mysql-sidebar{position:relative;min-width:220px;max-width:65%}
.mysql-sidebar>.object-tree{width:100%;max-width:none;min-height:0;box-sizing:border-box}
.mysql-main{min-width:0}
.mysql-sidebar-resizer{position:absolute;right:0;top:0;bottom:0;width:7px;z-index:5;cursor:col-resize;touch-action:none;user-select:none}
.mysql-sidebar-resizer:hover,.mysql-sidebar-resizer:focus-visible,.mysql-sidebar.resizing .mysql-sidebar-resizer{background:var(--mysql-accent,#58a6ff);outline:none}
.mysql-sidebar.resizing{user-select:none}
.json-viewer{min-width:0;max-width:100%;white-space:normal;text-align:left;border:1px solid var(--mysql-border);border-radius:6px;background:var(--mysql-bg);overflow:hidden}
.json-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:7px 10px;border-bottom:1px solid var(--mysql-border);font-size:11px;font-family:var(--myssh-plugin-font-ui)}
.json-badge{color:var(--mysql-text-muted);font-size:10px;letter-spacing:.06em}
.json-modes{display:flex;gap:2px}
.json-toolbar button,.json-more{border:0;border-radius:4px;padding:3px 7px;background:transparent;color:var(--mysql-text-muted);font:inherit;cursor:pointer}
.json-toolbar button[aria-pressed=true]{background:var(--mysql-tab-active);color:var(--mysql-accent)}
.json-toolbar button:hover,.json-more:hover{background:var(--mysql-hover);color:var(--mysql-text-strong)}
.json-copy{margin-left:auto}
.json-body{padding:10px;max-height:360px;overflow:auto;font-family:var(--myssh-plugin-font-mono,monospace);font-size:12px;line-height:1.8;user-select:text}
.json-node-toggle{display:flex;align-items:baseline;gap:0;max-width:100%;padding:0;border:0;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer;overflow-wrap:anywhere}
.json-node-toggle:hover{background:var(--mysql-hover)}
.json-chevron{width:16px;flex-shrink:0;color:var(--mysql-text-muted);user-select:none}
.json-children{margin-left:7px;padding-left:16px;border-left:1px solid var(--mysql-border)}
.json-leaf{padding-left:16px;overflow-wrap:anywhere;white-space:pre-wrap}
.json-closing{padding-left:16px;color:var(--mysql-text-muted)}
.json-key{color:var(--mysql-text-strong)}
.json-string{color:#9acb9c}
.json-number{color:#e7bc83}
.json-boolean{color:#aeb9ef}
.json-null,.json-punctuation{color:var(--mysql-text-muted)}
.json-meta{margin-left:9px;font-size:10px;color:var(--mysql-text-muted);font-family:var(--myssh-plugin-font-ui);white-space:nowrap}
.json-raw{margin:0;white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;color:var(--mysql-text)}
.json-copy-status{padding:4px 10px;font-size:11px;color:var(--mysql-text-muted)}
.json-viewer button:focus-visible,.json-raw:focus-visible{outline:2px solid var(--mysql-accent);outline-offset:-2px}

.result-table td{vertical-align:top;height:36px;box-sizing:border-box}
.json-cell-preview{display:inline-flex;align-items:center;gap:9px;max-width:100%;height:25px;padding:0 7px;border:1px solid var(--mysql-border);border-radius:4px;background:transparent;color:var(--mysql-text-muted);font:inherit;font-size:11px;white-space:nowrap;cursor:pointer}
.json-cell-preview:hover{background:var(--mysql-hover);border-color:var(--mysql-accent);color:var(--mysql-text-strong)}
.json-cell-symbol{font-family:monospace;color:var(--mysql-accent)}
.json-cell-open{font-size:10px;color:var(--mysql-accent)}
.json-inspector{position:absolute;inset:auto;margin:0;width:min(560px,calc(100vw - 24px));max-width:none;height:100dvh;max-height:none;padding:0;border:0;border-left:1px solid var(--mysql-border);background:var(--mysql-surface);color:var(--mysql-text);box-shadow:-16px 0 48px #0005;box-sizing:border-box}
.json-inspector[open]{display:flex;flex-direction:column}
.json-inspector::backdrop{background:#0003}
.json-inspector.fullscreen{width:100vw}
.json-inspector-header{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:20px 24px;border-bottom:1px solid var(--mysql-border);flex-shrink:0}
.json-inspector-eyebrow{font-size:11px;color:var(--mysql-text-muted)}
.json-inspector-header h3{margin:6px 0 0;font-size:18px;font-weight:600;color:var(--mysql-text-strong);overflow-wrap:anywhere}
.json-inspector-actions{display:flex;gap:10px;flex-shrink:0}
.json-inspector-actions button{border:1px solid var(--mysql-border);border-radius:5px;padding:5px 10px;background:transparent;color:var(--mysql-text);font:inherit;cursor:pointer}
.json-inspector-actions button:hover{background:var(--mysql-hover)}
.json-inspector>.json-viewer{border:0;border-radius:0;flex:1;min-height:0;display:flex;flex-direction:column}
.json-inspector .json-toolbar{padding:12px 24px;flex-shrink:0}
.json-inspector .json-body{max-height:none;flex:1;min-height:0;padding:20px 24px;font-size:13px;line-height:1.9}
.json-inspector .json-node-toggle,.json-inspector .json-leaf{white-space:pre;overflow-wrap:normal}
.json-search{margin:12px 24px 0;padding:8px 10px;border:1px solid var(--mysql-border);border-radius:5px;background:var(--mysql-bg);color:var(--mysql-text);font:inherit;font-size:12px;flex-shrink:0}
.json-inspector-footer{padding:10px 24px;border-top:1px solid var(--mysql-border);font-size:11px;color:var(--mysql-text-muted);flex-shrink:0}
.json-cell-preview:focus-visible,.json-inspector-actions button:focus-visible{outline:2px solid var(--mysql-accent);outline-offset:2px}

:scope.relations-open>.mysql-sidebar{display:none}
.relations-entry{display:flex;align-items:center;gap:var(--mysql-space-2);width:100%;padding:var(--mysql-space-2) calc(var(--mysql-space-4) + var(--mysql-space-2));border:0;background:transparent;color:var(--mysql-accent);font:inherit;font-size:12px;text-align:left;cursor:pointer}@media(hover:hover) and (pointer:fine){
.relations-entry:hover{background:var(--mysql-hover)}}
.relations-entry small{margin-left:auto;color:var(--mysql-text-muted);font-family:monospace;font-size:10px}
.relations-view{display:flex;flex-direction:column;flex:1;min-height:0;overflow:auto;background:var(--mysql-bg)}
.relations-header{display:flex;align-items:center;justify-content:space-between;gap:var(--mysql-space-4);padding:calc(var(--mysql-space-4) + var(--mysql-space-1)) calc(var(--mysql-space-4) + var(--mysql-space-2)) var(--mysql-space-4);flex-shrink:0;border-bottom:1px solid var(--mysql-border)}
.relations-eyebrow{font-size:10px;color:var(--mysql-text-muted);letter-spacing:.04em}
.relations-header h2{display:flex;align-items:center;gap:var(--mysql-space-2);margin:var(--mysql-space-2) 0;font-size:20px;font-weight:600;color:var(--mysql-text-strong)}
.relations-header h2 svg{color:var(--mysql-accent)}
.relations-header p{margin:0;font-size:11px;color:var(--mysql-text-muted)}
.relations-toolbar{display:flex;align-items:center;gap:var(--mysql-space-4);flex-wrap:wrap;padding:var(--mysql-space-2) calc(var(--mysql-space-4) + var(--mysql-space-2));background:var(--mysql-surface);border-bottom:1px solid var(--mysql-border);flex-shrink:0;font-size:11px}
.relations-stat{color:var(--mysql-text-muted);white-space:nowrap}
.relations-stat strong{font-weight:600;font-variant-numeric:tabular-nums;color:var(--mysql-text-strong);margin-right:var(--mysql-space-1)}
.relations-validation{color:var(--mysql-success);font-size:11px}
.relations-validation.warning,.relations-warning{color:var(--myssh-plugin-warning)}
.relations-toolbar input{margin-left:auto;min-width:140px;flex:1;max-width:240px;padding:var(--mysql-space-2) var(--mysql-space-2);border:1px solid var(--mysql-border);border-radius:var(--mysql-radius-sm);background:var(--mysql-bg);color:var(--mysql-text);font:inherit;font-size:11px}
.relations-zoom{display:flex;align-items:center;gap:var(--mysql-space-2);white-space:nowrap;color:var(--mysql-text-muted)}
.relations-zoom button{display:inline-flex;align-items:center;justify-content:center;min-width:24px;height:26px;padding:0 var(--mysql-space-2);border:1px solid var(--mysql-border);background:transparent;color:var(--mysql-text);border-radius:var(--mysql-radius-sm);font:inherit;cursor:pointer}@media(hover:hover) and (pointer:fine){
.relations-zoom button:hover{background:var(--mysql-hover)}}
.relations-canvas{flex:1;min-height:260px;overflow:auto;position:relative;background-color:var(--mysql-bg);background-image:radial-gradient(var(--mysql-border) .7px,transparent .7px);background-size:18px 18px}
.relations-canvas-size{position:relative;margin:auto}
.relations-canvas-content{position:relative;transform-origin:top left}
.relations-edges{position:absolute;inset:0;overflow:visible}
.relation-edge{cursor:pointer;color:var(--mysql-text-muted);outline:none}
.relation-edge-hit{fill:none;stroke:transparent;stroke-width:16}
.relation-edge-line{fill:none;stroke:currentColor;stroke-width:1.5;stroke-dasharray:5 4;pointer-events:none;opacity:.65}@media(hover:hover) and (pointer:fine){
.relation-edge.selected,.relation-edge:hover,.relation-edge:focus-visible{color:var(--mysql-accent)}}@media(hover:hover) and (pointer:fine){
.relation-edge.selected .relation-edge-line,.relation-edge:hover .relation-edge-line,.relation-edge:focus-visible .relation-edge-line{stroke-width:2.5;opacity:1;stroke-dasharray:none}}
.relation-edge.invalid{color:var(--myssh-plugin-warning)}
.relation-table{position:absolute;overflow:hidden;background:var(--mysql-surface);border:1px solid var(--mysql-border);border-radius:var(--mysql-radius-sm);box-sizing:border-box}
.relation-table.highlighted{border-color:color-mix(in srgb,var(--mysql-accent) 70%,var(--mysql-border))}
.relation-table header{display:flex;align-items:center;gap:var(--mysql-space-2);height:58px;padding:0 var(--mysql-space-3);border-bottom:1px solid var(--mysql-border);box-sizing:border-box}
.relation-table header svg{color:var(--mysql-accent);flex-shrink:0}
.relation-table header button{padding:0;border:0;background:transparent;color:var(--mysql-text-strong);font:inherit;font-size:12px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer;text-align:left}@media(hover:hover) and (pointer:fine){
.relation-table header button:hover{text-decoration:underline}}
.relation-field{display:flex;align-items:center;gap:var(--mysql-space-2);height:30px;padding:0 var(--mysql-space-3);font-size:11px;box-sizing:border-box;color:var(--mysql-text)}
.relation-field>span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.relation-field code{margin-left:auto;color:var(--mysql-text-muted);font-size:10px;white-space:nowrap}
.relation-field small{color:var(--mysql-text-muted);font-size:9px}
.relation-field.selected{background:var(--mysql-tab-active);color:var(--mysql-accent)}
.relation-field.missing{color:var(--myssh-plugin-warning)}
.relations-lower{display:grid;grid-template-columns:minmax(200px,32%) minmax(0,1fr);min-height:180px;max-height:300px;border-top:1px solid var(--mysql-border);background:var(--mysql-surface);flex-shrink:0}
.relations-list{overflow:auto;border-right:1px solid var(--mysql-border);padding:var(--mysql-space-2)}
.relations-list>button{display:flex;align-items:flex-start;gap:var(--mysql-space-2);width:100%;padding:var(--mysql-space-2);border:0;border-radius:var(--mysql-radius-sm);background:transparent;color:var(--mysql-text);font:inherit;text-align:left;cursor:pointer}
.relations-list>button.selected{background:var(--mysql-tab-active)}@media(hover:hover) and (pointer:fine){
.relations-list>button:hover{background:var(--mysql-hover)}}
.relations-list strong{display:block;font-size:11px;font-weight:500;overflow-wrap:anywhere}
.relations-list small{display:block;margin-top:var(--mysql-space-1);font-size:10px;color:var(--mysql-text-muted);overflow-wrap:anywhere}
.relation-field-label{color:var(--mysql-text-muted)}
.relation-status-dot{flex-shrink:0;width:5px;height:5px;margin-top:var(--mysql-space-2);border-radius:50%;background:var(--myssh-plugin-warning)}
.relation-status-dot.valid{background:var(--mysql-success)}
.relation-detail{padding:calc(var(--mysql-space-4) + var(--mysql-space-1)) calc(var(--mysql-space-4) + var(--mysql-space-2));min-width:0;overflow:auto}
.relation-detail-heading{display:flex;align-items:center;gap:var(--mysql-space-2);flex-wrap:wrap}
.relation-source-badge{padding:var(--mysql-space-1) var(--mysql-space-2);border:1px solid var(--mysql-border);border-radius:var(--mysql-radius-sm);font-size:10px;color:var(--mysql-text-muted)}
.relation-endpoints{display:flex;align-items:center;gap:var(--mysql-space-2);flex-wrap:wrap;margin:var(--mysql-space-4) 0;font-size:12px;color:var(--mysql-text-strong);overflow-wrap:anywhere}
.relation-endpoints svg{color:var(--mysql-accent);flex-shrink:0}
.relation-comment{font-size:11px;line-height:1.7;color:var(--mysql-text);overflow-wrap:anywhere}
.relation-verification{font-size:10px;line-height:1.7;color:var(--mysql-text-muted)}
.relation-detail-actions{display:flex;align-items:center;gap:var(--mysql-space-2);flex-wrap:wrap;margin-top:var(--mysql-space-4)}
.relation-detail-actions [role=status]{font-size:10px;color:var(--mysql-text-muted)}
.relations-diagnostics{padding:var(--mysql-space-2) calc(var(--mysql-space-4) + var(--mysql-space-2));font-size:11px;color:var(--myssh-plugin-warning)}
.relations-state{margin:auto;padding:40px calc(var(--mysql-space-4) + var(--mysql-space-2));text-align:center;max-width:520px;color:var(--mysql-text-muted)}
.relations-state>svg{color:var(--mysql-accent)}
.relations-state h3{font-size:16px;font-weight:500;color:var(--mysql-text-strong)}
.relations-state p{font-size:12px;line-height:1.7;overflow-wrap:anywhere}
.relations-view button:focus-visible,.relations-view input:focus-visible,.relations-entry:focus-visible{outline:2px solid var(--mysql-accent);outline-offset:-2px}
@media(max-width:900px){.relations-header{padding:var(--mysql-space-4) var(--mysql-space-4)}.relations-toolbar{padding:var(--mysql-space-2) var(--mysql-space-4);gap:var(--mysql-space-2)}.relations-lower{grid-template-columns:minmax(150px,35%) minmax(0,1fr)}.relation-detail{padding:var(--mysql-space-3)}.relations-header p{max-width:360px}}

.relation-table header{flex-direction:column;align-items:stretch;justify-content:center;gap:var(--mysql-space-2)}
.relation-table-title,.relation-field-title{display:flex;align-items:center;gap:var(--mysql-space-2);min-width:0}
.relation-table-comment,.relation-field-comment{margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--mysql-text-muted);font-size:11px;line-height:14px}
.relation-field{flex-direction:column;align-items:stretch;justify-content:center}
.relation-field-title{line-height:18px;flex-shrink:0}
.relation-field-title>span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.relation-field-comment{font-size:10px;line-height:14px}
.relation-field.selected .relation-field-comment{color:var(--mysql-text)}
.relations-comments-toggle{border:1px solid var(--mysql-border);border-radius:var(--mysql-radius-sm);background:transparent;color:var(--mysql-text-muted);padding:var(--mysql-space-1) var(--mysql-space-2);font:inherit;font-size:11px;white-space:nowrap;cursor:pointer}
.relations-comments-toggle[aria-pressed=true]{color:var(--mysql-accent);background:var(--mysql-tab-active)}
.relation-comment-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--mysql-space-4);margin:var(--mysql-space-3) 0}
.relation-comment-grid h3{font-size:10px;font-weight:500;color:var(--mysql-text-muted);margin:0 0 var(--mysql-space-2)}
.relation-comment-grid p{font-size:11px;line-height:1.7;margin:var(--mysql-space-1) 0;color:var(--mysql-text);white-space:pre-wrap;overflow-wrap:anywhere}
.relation-comment-grid .relation-table-description{color:var(--mysql-text-strong)}
.relation-raw-comment{font-size:10px;color:var(--mysql-text-muted);margin-top:var(--mysql-space-2)}
.relation-raw-comment summary{cursor:pointer}
.relation-raw-comment p{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.7}
@media(max-width:900px){.relation-comment-grid{grid-template-columns:minmax(0,1fr)}}

.relations-canvas{overflow:hidden;cursor:grab;overscroll-behavior:contain}
.relations-canvas-size{position:absolute;inset:0;margin:0;pointer-events:none}
/* Let Chromium re-raster text/SVG at the current scale; persistent promotion retains blurry tiles. */
.relations-canvas-content{position:absolute;left:0;top:0;pointer-events:auto;will-change:auto}
.relations-canvas.is-panning,.relations-canvas.is-panning *{cursor:grabbing!important;user-select:none}
.relations-canvas:focus-visible{outline:2px solid var(--mysql-accent);outline-offset:-2px}

/* Canvas-first relationship workspace: independent components, optional inspector. */
.relations-view{overflow:hidden}
.relations-header{padding:12px 20px;gap:16px}
.relations-header h2{font-size:16px;margin:0 0 4px}
.relations-header h2 span{font-size:11px;font-weight:400;color:var(--mysql-text-muted);margin-left:8px}
.relations-header p{font-size:10px}
.relations-toolbar{padding:8px 20px;gap:12px}
.relations-groups{display:flex;align-items:center;gap:6px;padding:9px 20px;overflow:auto;flex-shrink:0;background:var(--mysql-surface);border-bottom:1px solid var(--mysql-border)}
.relations-groups>button{display:flex;align-items:center;gap:8px;white-space:nowrap;flex-shrink:0;padding:7px 10px;border:1px solid transparent;border-radius:var(--mysql-radius-sm);background:transparent;color:var(--mysql-text-muted);font:inherit;font-size:11px;cursor:pointer}
.relations-groups>button[aria-pressed=true]{background:var(--mysql-tab-active);border-color:color-mix(in srgb,var(--mysql-accent) 35%,transparent);color:var(--mysql-text-strong)}
.relations-groups small,.relation-group-number{font-size:10px;color:var(--mysql-text-muted)}
.relations-workspace{display:flex;position:relative;min-height:0;flex:1;overflow:hidden}
.relations-workspace>.relations-canvas{min-height:0;min-width:0;flex:1}
.relation-group-region{position:absolute;box-sizing:border-box;border:1px solid var(--mysql-border);border-radius:12px;background:color-mix(in srgb,var(--mysql-surface) 35%,transparent);pointer-events:none}
.relation-group-region>div{display:flex;align-items:center;justify-content:space-between;gap:16px;height:56px;padding:0 24px;border-bottom:1px solid color-mix(in srgb,var(--mysql-border) 55%,transparent)}
.relation-group-region strong{font-size:13px;font-weight:500;color:var(--mysql-text-strong)}
.relation-group-region span{font-size:11px;color:var(--mysql-text-muted)}
.relations-canvas-caption{position:absolute;bottom:0;left:0;right:0;display:flex;justify-content:space-between;gap:12px;padding:10px 16px;font-size:10px;color:var(--mysql-text-muted);background:color-mix(in srgb,var(--mysql-bg) 90%,transparent);pointer-events:none}
.relations-canvas.has-selection .relation-edge:not(.selected){opacity:.25}
.relation-edge.selected{color:var(--mysql-accent)}
.relation-edge.selected .relation-edge-line{stroke-width:2.5;opacity:1;stroke-dasharray:none}
.relations-workspace>.relations-lower{display:flex;flex-direction:column;flex:0 0 360px;max-width:42%;min-height:0;max-height:none;border-top:0;border-left:1px solid var(--mysql-border);overflow:hidden}
.relation-inspector-header{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:12px 14px;border-bottom:1px solid var(--mysql-border);font-size:12px}
.relation-inspector-header>div{display:flex;gap:6px}
.relation-inspector-header button{padding:4px 6px;background:transparent;border:1px solid var(--mysql-border);border-radius:var(--mysql-radius-sm);color:var(--mysql-text-muted);font:inherit;font-size:10px;cursor:pointer}
.relation-inspector-header button:disabled{opacity:.4;cursor:default}
.relations-lower>.relations-list{flex:0 1 190px;min-height:76px;border-right:0;border-bottom:1px solid var(--mysql-border)}
.relations-lower>.relation-detail{flex:1;padding:16px;min-height:0}
.relations-lower .relation-comment-grid{grid-template-columns:minmax(0,1fr)}
.relations-lower .relation-endpoints{font-size:11px;align-items:flex-start;flex-direction:column}
.relations-lower .relation-detail-actions{position:sticky;bottom:-16px;padding:12px 0;margin-bottom:-16px;background:var(--mysql-surface)}
.relation-inspector-empty{font-size:12px;line-height:1.7;color:var(--mysql-text-muted)}
@media(max-width:1000px){.relations-validation{display:none}.relations-toolbar{gap:8px}.relations-toolbar input{max-width:180px}.relations-workspace>.relations-lower{flex-basis:320px;max-width:45%}.relations-canvas-caption>span:last-child{display:none}}
@media(max-width:700px){.relations-header{padding:10px 12px}.relations-header p{display:none}.relations-toolbar,.relations-groups{padding-left:12px;padding-right:12px}.relations-workspace>.relations-lower{position:absolute;right:0;top:0;bottom:0;width:min(360px,100%);max-width:100%;z-index:5;box-shadow:-8px 0 24px #0003}.relations-stat{font-size:10px}.relations-toolbar input{max-width:none;min-width:100px}.relation-group-region strong{font-size:12px}}

.relations-toolbar select{padding:6px 8px;border:1px solid var(--mysql-border);border-radius:var(--mysql-radius-sm);background:var(--mysql-bg);color:var(--mysql-text);font:inherit;font-size:11px}
.relation-edge.mapping{color:var(--myssh-plugin-mapping,#b49bea)}
.relation-edge.mapping .relation-edge-line{stroke-dasharray:2 7;stroke-width:2;opacity:.9}
.relation-edge.mapping.selected .relation-edge-line{stroke-dasharray:2 7;stroke-width:3;opacity:1}
.relation-edge.mapping.invalid{color:var(--myssh-plugin-warning)}
.relation-mapping-label rect{fill:var(--mysql-surface);stroke:currentColor;stroke-width:1}
.relation-mapping-label text{fill:currentColor;font-size:10px;font-family:inherit;pointer-events:none}
.relation-edge-halo{fill:none;stroke:var(--mysql-bg);stroke-width:6;pointer-events:none;stroke-linejoin:round}
.relation-edge-line{stroke-linejoin:round;stroke-linecap:round}
.relation-edge.selected .relation-edge-halo{stroke-width:8}
.relation-pair-branches path{fill:none;stroke:currentColor;stroke-width:1.5;stroke-linejoin:round;pointer-events:none}
.relations-export-actions{display:flex;align-items:center;gap:8px;flex-shrink:0}
.relations-export-status{margin:0;padding:8px 20px;border-bottom:1px solid var(--mysql-border);color:var(--mysql-text-muted);font-size:12px}
.relation-status-dot.mapping{border-radius:1px;background:var(--myssh-plugin-mapping,#b49bea)}
.relation-mapping-notice{padding:10px 12px;border-left:2px solid var(--myssh-plugin-mapping,#b49bea);background:var(--mysql-bg);color:var(--mysql-text);font-size:11px;line-height:1.7}
.relation-detail-actions button:disabled{opacity:.4;cursor:not-allowed}

`

let injected = false

/** 交给 Chromium 原生 CSS 作用域处理，避免手写选择器解析器产生漏网规则。 */
export function getMysqlManagerStyles(): string {
  return `@scope (.mysql-manager) {${CSS}\n}
`
}

export function injectStyles(): void {
  if (injected) return
  if (typeof document === 'undefined') return
  const style = document.createElement('style')
  style.textContent = getMysqlManagerStyles()
  document.head.appendChild(style)
  injected = true
}
