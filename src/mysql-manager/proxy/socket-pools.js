export async function registerSocketPool({
  connectionId,
  pool,
  pools,
  socketConnections,
  socketIsOpen
}) {
  if (!socketIsOpen) {
    await pool.end()
    return false
  }

  pools.set(connectionId, pool)
  socketConnections.add(connectionId)
  return true
}
