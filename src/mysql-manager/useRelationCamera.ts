import { useCallback, useLayoutEffect, useRef, useState, type PointerEvent, type KeyboardEvent, type MouseEvent } from 'react'
import { frameCamera, fitCamera, wheelCamera, zoomCamera, type RelationCamera } from './relation-camera'

export function useRelationCamera(width: number, height: number, active: boolean, viewKey = '') {
  const viewport = useRef<HTMLDivElement>(null)
  const [camera, setCamera] = useState<RelationCamera>({ x: 24, y: 24, scale: .85 })
  const current = useRef(camera)
  const [panning, setPanning] = useState(false)
  const drag = useRef<{ id: number; x: number; y: number; start: RelationCamera; moved: boolean } | null>(null)
  const suppressClick = useRef(false)
  const space = useRef(false)
  const update = useCallback((next: RelationCamera) => { current.current = next; setCamera(next) }, [])
  const fit = useCallback(() => {
    const element = viewport.current
    if (element) update(fitCamera(element.clientWidth, element.clientHeight, width, height))
  }, [width, height, update])
  const frame = (bounds: { x: number; y: number; width: number; height: number }) => {
    const element = viewport.current
    if (element) update(frameCamera(element.clientWidth, element.clientHeight, bounds))
  }
  const zoom = (factor: number) => {
    const element = viewport.current
    if (element) update(zoomCamera(current.current, current.current.scale * factor, { x: element.clientWidth / 2, y: element.clientHeight / 2 }))
  }
  useLayoutEffect(() => {
    const element = viewport.current
    if (!active || !element) return
    fit()
    let previous = { width: element.clientWidth, height: element.clientHeight }
    const observer = new ResizeObserver(() => {
      const next = { width: element.clientWidth, height: element.clientHeight }
      update({ ...current.current, x: current.current.x + (next.width - previous.width) / 2, y: current.current.y + (next.height - previous.height) / 2 })
      previous = next
    })
    observer.observe(element)
    // Chromium emits trackpad pinch as ctrl+wheel. A passive React wheel handler cannot cancel page zoom.
    const wheel = (event: WheelEvent) => {
      event.preventDefault()
      const bounds = element.getBoundingClientRect()
      update(wheelCamera(current.current, event, { x: event.clientX - bounds.left, y: event.clientY - bounds.top }, element.clientHeight))
    }
    element.addEventListener('wheel', wheel, { passive: false })
    return () => { observer.disconnect(); element.removeEventListener('wheel', wheel); space.current = false; drag.current = null }
  }, [active, fit, update, viewKey])
  const interactive = (target: EventTarget) => target instanceof Element && !!target.closest('button,input,textarea,select,a,[role="button"]')
  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch' || ![0, 1].includes(event.button) || event.button === 0 && !space.current && interactive(event.target)) return
    event.preventDefault()
    viewport.current?.focus({ preventScroll: true })
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, start: current.current, moved: false }
    suppressClick.current = false
    event.currentTarget.setPointerCapture(event.pointerId)
    setPanning(true)
  }
  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const previous = drag.current
    if (!previous || previous.id !== event.pointerId) return
    const dx = event.clientX - previous.x, dy = event.clientY - previous.y
    if (Math.hypot(dx, dy) > 3) previous.moved = true
    update({ ...previous.start, x: previous.start.x + dx, y: previous.start.y + dy })
  }
  const stop = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.id !== event.pointerId) return
    suppressClick.current = drag.current.moved
    drag.current = null; setPanning(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }
  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (interactive(event.target)) return
    if (event.code === 'Space') { event.preventDefault(); space.current = true }
    const steps: Record<string, [number, number]> = { ArrowLeft: [40, 0], ArrowRight: [-40, 0], ArrowUp: [0, 40], ArrowDown: [0, -40] }
    if (steps[event.key]) { event.preventDefault(); const [x, y] = steps[event.key]; update({ ...current.current, x: current.current.x + x, y: current.current.y + y }) }
    if (event.key === 'Home') { event.preventDefault(); fit() }
  }
  return {
    viewport, camera, panning, fit, frame, zoom,
    bindings: {
      tabIndex: 0, 'aria-label': '关系画布：拖动平移，双指滚动平移，双指捏合缩放；方向键移动，Home 适应画布',
      onPointerDown: pointerDown, onPointerMove: pointerMove, onPointerUp: stop, onPointerCancel: stop,
      onLostPointerCapture: () => { drag.current = null; setPanning(false) },
      onClickCapture: (event: MouseEvent<HTMLDivElement>) => { if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false } },
      onKeyDown: keyDown, onKeyUp: (event: KeyboardEvent<HTMLDivElement>) => { if (event.code === 'Space') space.current = false },
      onBlur: () => { space.current = false }
    }
  }
}
