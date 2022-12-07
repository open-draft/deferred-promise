export type PromiseState = 'pending' | 'fulfilled' | 'rejected'

export type Executor<Value> = ConstructorParameters<typeof Promise<Value>>[0]
export type ResolveFunction<Value> = Parameters<Executor<Value>>[0]
export type RejectFunction<Reason> = Parameters<Executor<Reason>>[1]

export type DeferredPromiseExecutor<Input = never, Output = Input> = {
  (resolve?: ResolveFunction<Input>, reject?: RejectFunction<any>): void

  resolve: ResolveFunction<Input>
  reject: RejectFunction<any>
  result?: Output
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
        return resolve(data)
      }

      executor.result = data as Output
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
