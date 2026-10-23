/** Small deterministic layered layout. Cycles share a layer; barycentric sweeps reduce crossings. */
export interface LayoutBox { table: string; width: number; height: number }
export interface LayoutLink { source: string; target: string }
export function arrangeRelationBoxes(boxes: LayoutBox[], links: LayoutLink[]): Map<string, { x: number; y: number }> {
  const names = boxes.map(box => box.table).sort()
  const byName = new Map(boxes.map(box => [box.table, box]))
  const edges = [...new Map(links.filter(link => link.source !== link.target && byName.has(link.source) && byName.has(link.target)).map(link => [JSON.stringify([link.source, link.target]), link])).values()]
  const outgoing = (name: string) => edges.filter(edge => edge.source === name).map(edge => edge.target).sort()
  // Tarjan condensation keeps cycles finite without arbitrarily clipping dependency depth.
  let sequence = 0
  const indices = new Map<string, number>(), low = new Map<string, number>(), stack: string[] = [], active = new Set<string>()
  const components: string[][] = []
  const visit = (name: string) => {
    indices.set(name, sequence); low.set(name, sequence++); stack.push(name); active.add(name)
    for (const next of outgoing(name)) {
      if (!indices.has(next)) { visit(next); low.set(name, Math.min(low.get(name)!, low.get(next)!)) }
      else if (active.has(next)) low.set(name, Math.min(low.get(name)!, indices.get(next)!))
    }
    if (low.get(name) === indices.get(name)) {
      const group: string[] = []
      let member: string
      do { member = stack.pop()!; active.delete(member); group.push(member) } while (member !== name)
      components.push(group.sort())
    }
  }
  for (const name of names) if (!indices.has(name)) visit(name)
  const component = new Map(components.flatMap((group, index) => group.map(name => [name, index] as const)))
  const ranks = components.map(() => 0)
  // Condensed graph is acyclic, so at most component-count passes suffice.
  for (let pass = 0; pass < components.length; pass++) {
    let changed = false
    for (const edge of edges) {
      const a = component.get(edge.source)!, b = component.get(edge.target)!
      if (a !== b && ranks[b] < ranks[a] + 1) { ranks[b] = ranks[a] + 1; changed = true }
    }
    if (!changed) break
  }
  const rank = (name: string) => ranks[component.get(name)!]
  const layers: string[][] = Array.from({ length: Math.max(0, ...ranks) + 1 }, () => [])
  for (const name of names) layers[rank(name)].push(name)
  const neighbors = (name: string, direction: number) => edges.flatMap(edge => edge.source === name && (rank(edge.target) - rank(name)) * direction > 0 ? [edge.target] : edge.target === name && (rank(edge.source) - rank(name)) * direction > 0 ? [edge.source] : [])
  const mean = (values: number[], fallback: number) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : fallback
  for (let pass = 0; pass < 6; pass++) {
    const direction = pass % 2 ? 1 : -1
    const order = direction < 0 ? layers : [...layers].reverse()
    const positions = new Map(layers.flatMap(layer => layer.map((name, index) => [name, index] as const)))
    for (const layer of order) layer.sort((a, b) => mean(neighbors(a, direction).map(name => positions.get(name)!), positions.get(a)!) - mean(neighbors(b, direction).map(name => positions.get(name)!), positions.get(b)!) || a.localeCompare(b))
  }
  const gap = 56, positions = new Map<string, { x: number; y: number }>()
  const layerHeight = (layer: string[]) => layer.reduce((sum, name) => sum + byName.get(name)!.height, 0) + Math.max(0, layer.length - 1) * gap
  const tallest = Math.max(0, ...layers.map(layerHeight))
  for (const layer of layers) {
    let y = (tallest - layerHeight(layer)) / 2
    for (const name of layer) { positions.set(name, { x: rank(name) * 380, y }); y += byName.get(name)!.height + gap }
  }
  // Align related card centres, then project onto non-overlapping ordered rows.
  for (let pass = 0; pass < 8; pass++) for (const layer of pass % 2 ? [...layers].reverse() : layers) {
    const desired = layer.map(name => {
      const connected = edges.flatMap(edge => edge.source === name ? [edge.target] : edge.target === name ? [edge.source] : [])
      return mean(connected.map(other => positions.get(other)!.y + byName.get(other)!.height / 2), positions.get(name)!.y + byName.get(name)!.height / 2) - byName.get(name)!.height / 2
    })
    const projected: number[] = []
    for (let i = 0; i < layer.length; i++) projected[i] = Math.max(desired[i], i ? projected[i - 1] + byName.get(layer[i - 1])!.height + gap : -Infinity)
    const shift = mean(projected.map((value, index) => value - desired[index]), 0)
    layer.forEach((name, index) => { positions.get(name)!.y = projected[index] - shift })
  }
  const top = Math.min(0, ...[...positions.values()].map(point => point.y))
  for (const point of positions.values()) { point.x += 36; point.y += 152 - top }
  return positions
}
