export type Executor<T> = ConstructorParameters<typeof Promise<T>>[0]
export type ResolveFn<T> = Parameters<Executor<T>>[0]
export type RejectFn<T> = Parameters<Executor<T>>[1]

export class DeferredPromise<T> extends Promise<T> {
  #state: 'pending' | 'fulfilled' | 'rejected' = 'pending'
  #rejectionReason = undefined

  resolve: (value?: any) => void // TODO: type value (keep T | PromiseLike<T> when chained)
  reject: RejectFn<T>

  constructor(executor: Executor<T> = null) {
    let resolve: ResolveFn<T>, reject: RejectFn<T>

    super((originalResolve, originalReject) => {
      let resolved = false

      resolve = (next) => {
        if (!resolved) {
          resolved = true
          const onFulfilled = <V>(value: V) => ((this.#state = 'fulfilled'), value)
          // Pass `next` directly if it's `this` so the built-in recursion error throws
          originalResolve(next === this ? next : Promise.resolve(next).then(onFulfilled))
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

    this.resolve = resolve
    this.reject = reject
  }

  get state() {
    return this.#state
  }
  get rejectionReason() {
    return this.#rejectionReason
  }

  #decorate<V>(promise: Promise<V>) {
    return Object.defineProperties(promise, {
      resolve: { configurable: true, value: this.resolve },
      reject: { configurable: true, value: this.reject },
    }) as DeferredPromise<V>
  }

  then<ThenResult = T, CatchResult = never>(
    onfulfilled?: (value: T) => ThenResult | PromiseLike<ThenResult>,
    onrejected?: (reason: any) => CatchResult | PromiseLike<CatchResult>
  ) {
    return this.#decorate(super.then(onfulfilled, onrejected))
  }

  catch<Result = never>(onrejected?: (reason: any) => Result | PromiseLike<Result>) {
    return this.#decorate(super.catch(onrejected))
  }

  finally(onfinally?: () => void | Promise<any>) {
    return this.#decorate(super.finally(onfinally))
  }
}
