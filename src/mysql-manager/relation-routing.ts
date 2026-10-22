export interface RoutePoint { x: number; y: number }
export interface RouteEdge { id: string; source: RoutePoint; target: RoutePoint; group?: string; laneTop?: number }
export interface RouteBox { x: number; y: number; width: number; height: number; group?: string }
type Segment = [RoutePoint, RoutePoint]
const length = (a: RoutePoint, b: RoutePoint) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
const intersectsBox = (a: RoutePoint, b: RoutePoint, box: RouteBox) => a.y === b.y
  ? a.y > box.y - 8 && a.y < box.y + box.height + 8 && Math.max(a.x, b.x) > box.x - 8 && Math.min(a.x, b.x) < box.x + box.width + 8
  : a.x > box.x - 8 && a.x < box.x + box.width + 8 && Math.max(a.y, b.y) > box.y - 8 && Math.min(a.y, b.y) < box.y + box.height + 8

/** Search the free corridors between cards instead of sending every long edge over the graph. */
function corridor(a: RoutePoint, b: RoutePoint, boxes: RouteBox[], top: number, used: Segment[]): RoutePoint[] | null {
  const xs = [...new Set([a.x, b.x, ...boxes.flatMap(box => [box.x - 20, box.x + box.width + 20])])].sort((x, y) => x - y)
  const ys = [...new Set([a.y, b.y, top, ...boxes.flatMap(box => [box.y - 20, box.y + box.height + 20])])].sort((x, y) => x - y)
  const start = ys.indexOf(a.y) * xs.length + xs.indexOf(a.x), end = ys.indexOf(b.y) * xs.length + xs.indexOf(b.x)
  const point = (id: number) => ({ x: xs[id % xs.length], y: ys[Math.floor(id / xs.length)] })
  const costs = new Map<number, number>(), previous = new Map<number, number>()
  // A binary heap keeps routing bounded for a large schema; direction is part of the state.
  const queue: { state: number; cost: number; score: number }[] = []
  const push = (item: typeof queue[number]) => {
    queue.push(item)
    let i = queue.length - 1
    while (i > 0) { const parent = (i - 1) >> 1; if (queue[parent].score <= item.score) break; queue[i] = queue[parent]; i = parent }
    queue[i] = item
  }
  const pop = () => {
    const first = queue[0], last = queue.pop()!
    if (queue.length) {
      let i = 0
      while (i * 2 + 1 < queue.length) {
        let child = i * 2 + 1
        if (child + 1 < queue.length && queue[child + 1].score < queue[child].score) child++
        if (queue[child].score >= last.score) break
        queue[i] = queue[child]; i = child
      }
      queue[i] = last
    }
    return first
  }
  costs.set(start * 2, 0); push({ state: start * 2, cost: 0, score: length(a, b) })
  while (queue.length) {
    const current = pop(), id = Math.floor(current.state / 2), direction = current.state % 2, p = point(id)
    if (costs.get(current.state) !== current.cost) continue
    if (id === end) {
      const path = [b]
      let state = current.state
      while (previous.has(state)) { state = previous.get(state)!; path.push(point(Math.floor(state / 2))) }
      return path.reverse().filter((p, i, all) => !i || i === all.length - 1 || !(all[i - 1].x === p.x && p.x === all[i + 1].x || all[i - 1].y === p.y && p.y === all[i + 1].y))
    }
    const x = id % xs.length, y = Math.floor(id / xs.length)
    const neighbors = [x > 0 ? id - 1 : -1, x + 1 < xs.length ? id + 1 : -1, y > 0 ? id - xs.length : -1, y + 1 < ys.length ? id + xs.length : -1]
    for (const next of neighbors) {
      if (next < 0) continue
      const q = point(next), dir = p.y === q.y ? 0 : 1
      if (boxes.some(box => intersectsBox(p, q, box))) continue
      let congestion = 0
      for (const [u, v] of used) {
        if (dir === 0 && u.y === v.y && u.y === p.y) congestion += Math.max(0, Math.min(Math.max(p.x, q.x), Math.max(u.x, v.x)) - Math.max(Math.min(p.x, q.x), Math.min(u.x, v.x))) * 3
        else if (dir === 1 && u.x === v.x && u.x === p.x) congestion += Math.max(0, Math.min(Math.max(p.y, q.y), Math.max(u.y, v.y)) - Math.max(Math.min(p.y, q.y), Math.min(u.y, v.y))) * 3
      }
      const cost = current.cost + length(p, q) + (dir !== direction ? 28 : 0) + congestion
      const state = next * 2 + dir
      if (cost >= (costs.get(state) ?? Infinity)) continue
      costs.set(state, cost); previous.set(state, current.state)
      push({ state, cost, score: cost + length(q, b) })
    }
  }
  return null
}

/** Allocate ports, then prefer short obstacle-free corridors; standalone calls retain upper lanes. */
export function routeRelationEdges(edges: RouteEdge[], boxes: RouteBox[] = []): Map<string, string> {
  const ordered = [...edges].sort((a, b) => a.id.localeCompare(b.id))
  const tracks = (edge: RouteEdge, side: 'source' | 'target') => {
    const group = ordered.filter(other => other.group === edge.group && other[side].x === edge[side].x)
    return 12 + 32 * (group.indexOf(edge) + 1) / (group.length + 1)
  }
  const port = (edge: RouteEdge, side: 'source' | 'target'): RoutePoint => {
    const group = ordered.filter(other => other.group === edge.group && other[side].x === edge[side].x && other[side].y === edge[side].y)
    const offset = group.length > 1 ? -6 + 12 * group.indexOf(edge) / (group.length - 1) : 0
    return { x: edge[side].x, y: edge[side].y + offset }
  }
  const routes = new Map<string, string>()
  const lanes = new Map<string, number>()
  const used = new Map<string, Segment[]>()
  for (const edge of ordered) {
    const a = port(edge, 'source'), b = port(edge, 'target')
    const sourceTrack = a.x + tracks(edge, 'source'), targetTrack = b.x - tracks(edge, 'target')
    if (b.x - a.x > 400 || b.x <= a.x) {
      const group = edge.group ?? ''
      const lane = lanes.get(group) ?? 0
      lanes.set(group, lane + 1)
      const y = (edge.laneTop ?? 20) + lane * 14
      const obstacles = boxes.filter(box => box.group === edge.group)
      const segments = used.get(group) ?? []
      const points = obstacles.length ? corridor({ x: sourceTrack, y: a.y }, { x: targetTrack, y: b.y }, obstacles, edge.laneTop ?? 20, segments) : null
      if (points) {
        const all = [a, ...points, b]
        routes.set(edge.id, `M${a.x},${a.y}` + all.slice(1).map((p, i) => p.y === all[i].y ? ` H${p.x}` : ` V${p.y}`).join(''))
        used.set(group, [...segments, ...all.slice(1).map((p, i) => [all[i], p] as Segment)])
        continue
      }
      routes.set(edge.id, `M${a.x},${a.y} H${sourceTrack} V${y} H${targetTrack} V${b.y} H${b.x}`)
    } else {
      const curve = Math.max(45, Math.abs(b.x - a.x) * .45)
      routes.set(edge.id, `M${a.x},${a.y} C${a.x + curve},${a.y} ${b.x - curve},${b.y} ${b.x},${b.y}`)
    }
  }
  return routes
}

/** Labels belong on the longest horizontal corridor, never at an arbitrary card-crossing midpoint. */
export function routeLabelPoint(path: string, source: RoutePoint, target: RoutePoint): RoutePoint {
  let point = source, best = { x: (source.x + target.x) / 2, y: (source.y + target.y) / 2 - 10 }, longest = 0
  for (const match of path.matchAll(/([MHV])(-?[\d.]+)(?:,(-?[\d.]+))?/g)) {
    const next = match[1] === 'M' ? { x: Number(match[2]), y: Number(match[3]) } : match[1] === 'H' ? { x: Number(match[2]), y: point.y } : { x: point.x, y: Number(match[2]) }
    if (match[1] === 'H' && Math.abs(next.x - point.x) > longest) { longest = Math.abs(next.x - point.x); best = { x: (next.x + point.x) / 2, y: point.y } }
    point = next
  }
  return best
}
