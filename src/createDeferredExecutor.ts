export type PromiseState = 'pending' | 'fulfilled' | 'rejected'

export type ResolveFunction<Data extends any, Result = void> = (
  value: Data
) => Result | PromiseLike<Result>

export type RejectFunction<Result = unknown> = (
  reason?: unknown
) => Result | PromiseLike<Result>

export type DeferredPromiseExecutor<Input = void, Output = Input> = {
  (resolve?: ResolveFunction<any, unknown>, reject?: RejectFunction): void

  resolve: ResolveFunction<Input, Output | void>
  reject: RejectFunction
  result?: Output | Input
  state: PromiseState
  rejectionReason?: unknown
}
export function createDeferredExecutor<
  Input = never,
  Output = Input
>(): DeferredPromiseExecutor<Input, Output> {
  const executor = <DeferredPromiseExecutor<Input, Output>>((
    resolve,
    reject
  ) => {
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
