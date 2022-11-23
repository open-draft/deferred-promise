export type PromiseState = 'pending' | 'fulfilled' | 'rejected'

export type ResolveFunction<Data extends any, Result = void> = (
  value: Data
) => Result | PromiseLike<Result>

export type RejectFunction<Result = unknown> = (
  reason?: unknown
) => Result | PromiseLike<Result>

export type DeferredPromiseExecutor<T> = {
  (ok?: ResolveFunction<T>, bad?: RejectFunction): void
  resolve: ResolveFunction<T>
  reject: RejectFunction
  result?: T
  state: PromiseState
  rejectionReason?: unknown
}

export function createDeferredExecutor<T>(): DeferredPromiseExecutor<T> {
  const executor = <DeferredPromiseExecutor<T>>((resolve, reject) => {
    executor.state = 'pending'

    executor.resolve = (data) => {
      queueMicrotask(() => {
        if (executor.state === 'pending') {
          executor.state = 'fulfilled'
          executor.result = data
          resolve(data)
        }
      })
    }

    executor.reject = (reason) => {
      queueMicrotask(() => {
        if (executor.state === 'pending') {
          executor.state = 'rejected'
          executor.rejectionReason = reason
          reject(reason)
        }
      })
    }
  })

  return executor
}
