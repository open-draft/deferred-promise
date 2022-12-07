import { type PromiseState } from './createDeferredExecutor'

export type Executor<T> = ConstructorParameters<typeof Promise<T>>[0]
export type ResolveFn<T> = Parameters<Executor<T>>[0]
export type RejectFn<T> = Parameters<Executor<T>>[1]

export class DeferredPromise<Input, Output = Input> extends Promise<Input> {
  #state: PromiseState
  #rejectionReason: unknown

  public resolve: ResolveFn<Output>
  public reject: RejectFn<Output>

  constructor(executor: Executor<Input> | null = null) {
    let resolve: ResolveFn<Input>
    let reject: RejectFn<Input>

    super((originalResolve, originalReject) => {
      let resolved = false

      resolve = (next) => {
        if (!resolved) {
          resolved = true
          const onFulfilled = <V>(val: V) => ((this.#state = 'fulfilled'), val)
          originalResolve(
            // Pass `next` directly if it's `this` so the built-in recursion error throws
            next === this ? next : Promise.resolve(next).then(onFulfilled)
          )
        }
      }
      reject = (reason?) => {
        if (!resolved) {
          resolved = true
          queueMicrotask(() => (this.#state = 'rejected'))
          originalReject((this.#rejectionReason = reason))
        }
      }

      executor?.(resolve, reject)
    })

    this.#state = 'pending'
    this.resolve = resolve as ResolveFn<Output>
    this.reject = reject as RejectFn<Output>
  }

  public get state() {
    return this.#state
  }

  public get rejectionReason() {
    return this.#rejectionReason
  }

  #decorate<ChildInput>(
    promise: Promise<ChildInput>
  ): DeferredPromise<ChildInput, Output> {
    return Object.defineProperties(promise, {
      resolve: { configurable: true, value: this.resolve },
      reject: { configurable: true, value: this.reject },
    }) as DeferredPromise<ChildInput, Output>
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
}
