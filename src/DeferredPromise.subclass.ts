export type Executor<T> = ConstructorParameters<typeof Promise<T>>[0]
export type ResolveFn<T> = Parameters<Executor<T>>[0]
export type RejectFn<T> = Parameters<Executor<T>>[1]

export class DeferredPromise<T, ResolveT = T> extends Promise<T> {
  #state: 'pending' | 'fulfilled' | 'rejected' = 'pending'
  #rejectionReason = undefined

  resolve: ResolveFn<ResolveT>
  reject: RejectFn<ResolveT>

  constructor(executor: Executor<T> = null) {
    let resolve: ResolveFn<T>, reject: RejectFn<T>

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

    this.resolve = resolve as ResolveFn<ResolveT>
    this.reject = reject as RejectFn<ResolveT>
  }

  get state() {
    return this.#state
  }
  get rejectionReason() {
    return this.#rejectionReason
  }

  #decorate<ChildT>(promise: Promise<ChildT>) {
    return Object.defineProperties(promise, {
      resolve: { configurable: true, value: this.resolve },
      reject: { configurable: true, value: this.reject },
    }) as DeferredPromise<ChildT, ResolveT>
  }

  then<ThenResult = T, CatchResult = never>(
    onfulfilled?: (value: T) => ThenResult | PromiseLike<ThenResult>,
    onrejected?: (reason: any) => CatchResult | PromiseLike<CatchResult>
  ) {
    return this.#decorate(super.then(onfulfilled, onrejected))
  }

  catch<CatchResult = never>(
    onrejected?: (reason: any) => CatchResult | PromiseLike<CatchResult>
  ) {
    return this.#decorate(super.catch(onrejected))
  }

  finally(onfinally?: () => void | Promise<any>) {
    return this.#decorate(super.finally(onfinally))
  }
}
