import { useRef, useState, type ReactNode } from 'react'

const STORAGE_KEY = 'mysql-manager-sidebar-width'
const DEFAULT_WIDTH = 340
export default function ResizableSidebar({ children }: { children: ReactNode }): React.JSX.Element {
  const container = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; width: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  const [width, setWidth] = useState(() => {
    try {
      const stored = Number(localStorage.getItem(STORAGE_KEY))
      return Number.isFinite(stored) && stored >= 220 ? Math.min(640, stored) : DEFAULT_WIDTH
    } catch { return DEFAULT_WIDTH }
  })
  const clamp = (value: number) => Math.max(220, Math.min(640, (container.current?.parentElement?.clientWidth ?? 1000) * .65, value))
  const save = (value: number) => { try { localStorage.setItem(STORAGE_KEY, String(value)) } catch { /* Width remains usable without storage. */ } }
  return <div ref={container} className={`mysql-sidebar${dragging ? ' resizing' : ''}`} style={{ width }}>
    {children}
    <div className="mysql-sidebar-resizer" role="separator" tabIndex={0}
      aria-label="调整数据库侧栏宽度" aria-orientation="vertical" aria-valuemin={220} aria-valuemax={640} aria-valuenow={Math.round(width)}
      title="拖动调整宽度，双击恢复默认；方向键微调"
      onPointerDown={event => {
        if (event.button !== 0) return
        event.preventDefault()
        drag.current = { x: event.clientX, width: container.current?.getBoundingClientRect().width ?? width }
        event.currentTarget.setPointerCapture(event.pointerId)
        setDragging(true)
      }}
      onPointerMove={event => { if (drag.current) setWidth(clamp(drag.current.width + event.clientX - drag.current.x)) }}
      onPointerUp={event => {
        if (!drag.current) return
        save(width); drag.current = null; setDragging(false)
        event.currentTarget.releasePointerCapture(event.pointerId)
      }}
      onLostPointerCapture={() => { drag.current = null; setDragging(false) }}
      onDoubleClick={() => { const next = clamp(DEFAULT_WIDTH); setWidth(next); save(next) }}
      onKeyDown={event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
        event.preventDefault()
        const next = clamp(event.key === 'Home' ? 220 : event.key === 'End' ? 640 : width + (event.key === 'ArrowLeft' ? -1 : 1) * (event.shiftKey ? 40 : 10))
        setWidth(next); save(next)
      }} />
  </div>
}
