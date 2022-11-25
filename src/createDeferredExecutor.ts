export type PromiseState = 'pending' | 'fulfilled' | 'rejected'

export type ResolveFunction<Data extends any, Result = void> = (
  value: Data
) => Result | PromiseLike<Result>

export type RejectFunction<Result = unknown> = (
  reason?: unknown
) => Result | PromiseLike<Result>

export type DeferredPromiseExecutor<Input = void, Output = Input> = {
  (resolve?: ResolveFunction<Input, Output>, reject?: RejectFunction): void

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
      if (executor.state !== 'pending') {
        console.log('NOT PENDING', executor)
        return resolve(data)
      }

      executor.result = data
      queueMicrotask(() => {
        executor.state = 'fulfilled'
      })

      return resolve(data)
    }

    executor.reject = (reason) => {
      if (executor.state !== 'pending') {
        return reject(reason)
      }

      executor.rejectionReason = reason
      queueMicrotask(() => {
        executor.state = 'rejected'
      })

      return reject(reason)
    }
  })

  return executor
}
