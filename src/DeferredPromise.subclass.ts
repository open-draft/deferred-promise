import { type PromiseState } from './createDeferredExecutor'

export type Executor<Value> = ConstructorParameters<typeof Promise<Value>>[0]
export type ResolveFunction<Value> = Parameters<Executor<Value>>[0]
export type RejectFunction<Reason> = Parameters<Executor<Reason>>[1]

export class DeferredPromise<Input, Output = Input> extends Promise<Input> {
  #state: PromiseState
  #rejectionReason: unknown

  public resolve: ResolveFunction<Output>
  public reject: RejectFunction<Output>

  constructor(executor: Executor<Input> | null = null) {
    let resolve: ResolveFunction<Input>
    let reject: RejectFunction<Input>

    super((originalResolve, originalReject) => {
      resolve = (next) => {
        if (this.#state !== 'pending') {
          return
        }

        const onFulfilled = <Value>(value: Value) => {
          this.#state = 'fulfilled'
          return value
        }

        originalResolve(
          // Pass `next` directly if it's `this` so the built-in recursion error throws
          next === this ? next : Promise.resolve(next).then(onFulfilled)
        )
      }

      reject = (reason) => {
        if (this.#state !== 'pending') {
          return
        }

        queueMicrotask(() => (this.#state = 'rejected'))
        originalReject((this.#rejectionReason = reason))
      }

      executor?.(resolve, reject)
    })

    this.#state = 'pending'
    this.resolve = resolve as ResolveFunction<Output>
    this.reject = reject as RejectFunction<Output>
  }

  public get state() {
    return this.#state
  }

  public get rejectionReason() {
    return this.#rejectionReason
  }

  public then<ThenResult = Input, CatchResult = never>(
    onFulfilled?: (value: Input) => ThenResult | PromiseLike<ThenResult>,
    onRejected?: (reason: any) => CatchResult | PromiseLike<CatchResult>
  ) {
    return this.#decorate(super.then(onFulfilled, onRejected))
  }

  public catch<CatchResult = never>(
    onRejected?: (reason: any) => CatchResult | PromiseLike<CatchResult>
  ) {
    return this.#decorate(super.catch(onRejected))
  }

  public finally(onfinally?: () => void | Promise<any>) {
    return this.#decorate(super.finally(onfinally))
  }

  #decorate<ChildInput>(
    promise: Promise<ChildInput>
  ): DeferredPromise<ChildInput, Output> {
    return Object.defineProperties(promise, {
      resolve: { configurable: true, value: this.resolve },
      reject: { configurable: true, value: this.reject },
    }) as DeferredPromise<ChildInput, Output>
  }
}
