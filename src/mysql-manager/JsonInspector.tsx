import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import JsonValue from './JsonValue'

type Selection = { value: object; field: string; row: number }
const InspectorContext = createContext<(selection: Selection) => void>(() => {})
export const useJsonInspector = () => useContext(InspectorContext)

export function JsonInspectorProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [selection, setSelection] = useState<Selection | null>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (selection && !dialog.current?.open) dialog.current?.showModal()
  }, [selection])
  useEffect(() => {
    const panel = dialog.current
    const workspace = panel?.closest('.mysql-manager')
    if (!panel || !workspace || !selection) return
    const updateBounds = () => {
      const bounds = workspace.getBoundingClientRect()
      const width = fullscreen ? bounds.width : Math.min(560, bounds.width)
      Object.assign(panel.style, { top: `${bounds.top}px`, left: `${bounds.right - width}px`, width: `${width}px`, height: `${bounds.height}px` })
    }
    updateBounds()
    const observer = new ResizeObserver(updateBounds)
    observer.observe(workspace)
    window.addEventListener('resize', updateBounds)
    return () => { observer.disconnect(); window.removeEventListener('resize', updateBounds) }
  }, [selection, fullscreen])
  return <InspectorContext.Provider value={setSelection}>
    {children}
    <dialog ref={dialog} className={`json-inspector${fullscreen ? ' fullscreen' : ''}`} aria-labelledby="json-inspector-title" onClose={() => { setSelection(null); setFullscreen(false) }} onClick={event => { if (event.target === dialog.current) { const bounds = event.currentTarget.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right) dialog.current?.close() } }}>
      {selection && <>
        <header className="json-inspector-header">
          <div><span className="json-inspector-eyebrow">JSON 详情 · 第 {selection.row} 行</span><h3 id="json-inspector-title">{selection.field}</h3></div>
          <div className="json-inspector-actions"><button type="button" onClick={() => setFullscreen(!fullscreen)}>{fullscreen ? '退出全屏' : '全屏'}</button><button type="button" aria-label="关闭 JSON 详情" onClick={() => dialog.current?.close()}>×</button></div>
        </header>
        <JsonValue key={`${selection.field}-${selection.row}`} value={selection.value} />
        <footer className="json-inspector-footer">只读查看 · Esc 关闭</footer>
      </>}
    </dialog>
  </InspectorContext.Provider>
}
