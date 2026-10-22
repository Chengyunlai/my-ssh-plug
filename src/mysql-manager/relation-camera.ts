export interface RelationCamera { x: number; y: number; scale: number }
export const MIN_RELATION_ZOOM = .2
export const MAX_RELATION_ZOOM = 3
export function zoomCamera(camera: RelationCamera, scale: number, anchor: { x: number; y: number }): RelationCamera {
  const next = Math.max(MIN_RELATION_ZOOM, Math.min(MAX_RELATION_ZOOM, scale))
  const ratio = next / camera.scale
  return { scale: next, x: anchor.x - (anchor.x - camera.x) * ratio, y: anchor.y - (anchor.y - camera.y) * ratio }
}
export function fitCamera(viewWidth: number, viewHeight: number, graphWidth: number, graphHeight: number): RelationCamera {
  const scale = Math.max(MIN_RELATION_ZOOM, Math.min(1, (viewWidth - 48) / graphWidth, (viewHeight - 48) / graphHeight))
  return { scale, x: (viewWidth - graphWidth * scale) / 2, y: (viewHeight - graphHeight * scale) / 2 }
}
export function wheelCamera(camera: RelationCamera, event: { deltaX: number; deltaY: number; deltaMode: number; ctrlKey: boolean; metaKey: boolean }, anchor: { x: number; y: number }, pageHeight: number): RelationCamera {
  const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? pageHeight : 1
  if (event.ctrlKey || event.metaKey) return zoomCamera(camera, camera.scale * Math.exp(-Math.max(-100, Math.min(100, event.deltaY * unit)) * .01), anchor)
  return { ...camera, x: camera.x - event.deltaX * unit, y: camera.y - event.deltaY * unit }
}

export function frameCamera(viewWidth: number, viewHeight: number, bounds: { x: number; y: number; width: number; height: number }): RelationCamera {
  const fit = fitCamera(viewWidth, viewHeight, bounds.width, bounds.height)
  return { ...fit, x: fit.x - bounds.x * fit.scale, y: fit.y - bounds.y * fit.scale }
}
