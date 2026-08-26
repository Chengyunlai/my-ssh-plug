export const POLL_INTERVAL_MS = 3_000

interface PollScheduler {
  setTimeout(callback: () => void, delayMs: number): number
  clearTimeout(timerId: number): void
}

export interface SnapshotPoller {
  start(): void
  stop(): void
}

/** 串行轮询：上一轮完成后再等待 3 秒，避免慢服务器上出现重叠采集。 */
export function createSnapshotPoller(
  task: () => Promise<void>,
  scheduler: PollScheduler = window
): SnapshotPoller {
  let running = false
  let timerId: number | undefined

  const tick = async (): Promise<void> => {
    if (!running) return
    await task()
    if (!running) return
    timerId = scheduler.setTimeout(() => void tick(), POLL_INTERVAL_MS)
  }

  return {
    start() {
      if (running) return
      running = true
      void tick()
    },
    stop() {
      running = false
      if (timerId !== undefined) scheduler.clearTimeout(timerId)
      timerId = undefined
    }
  }
}
