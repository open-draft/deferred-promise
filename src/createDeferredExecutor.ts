export type PromiseState = 'pending' | 'fulfilled' | 'rejected'
export type ResolveFunction<Data> = (value?: Data | PromiseLike<Data>) => void
export type RejectFunction<Reason = unknown> = (reason?: Reason) => void

export type DeferredPromiseExecutor<T> = {
  (ok?: ResolveFunction<T>, bad?: RejectFunction): void
  resolve: ResolveFunction<T>
  reject: RejectFunction
  state: PromiseState
  rejectionReason?: unknown
}

export function createDeferredExecutor<T>(): DeferredPromiseExecutor<T> {
  const executor = <DeferredPromiseExecutor<T>>((ok, bad) => {
    executor.state = 'pending'

    executor.resolve = (data) => {
      if (executor.state === 'pending') {
        executor.state = 'fulfilled'
        ok(data)
      }
    }

    executor.reject = (reason) => {
      if (executor.state === 'pending') {
        executor.state = 'rejected'
        executor.rejectionReason = reason
        bad(reason)
      }
    }
  })

  return executor
}
