/** Keep input state current while publishing only the latest visual state per frame. */
export function createFrameQueue<T>(publish: (value: T) => void, request: (callback: FrameRequestCallback) => number, cancel: (id: number) => void) {
  let pending: number | null = null
  let latest: T
  return {
    schedule(value: T) {
      latest = value
      if (pending !== null) return
      pending = request(() => { pending = null; publish(latest) })
    },
    cancel() {
      if (pending !== null) cancel(pending)
      pending = null
    }
  }
}
