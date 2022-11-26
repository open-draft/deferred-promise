export type Executor<T> = ConstructorParameters<typeof Promise<T>>[0]
export type ResolveFn<T> = Parameters<Executor<T>>[0]
export type RejectFn<T> = Parameters<Executor<T>>[1]

export class DeferredPromise<T, ResolveT = T> implements Promise<T> {
  get [Symbol.toStringTag]() {
    return 'DeferredPromise'
  }

  #state: 'pending' | 'fulfilled' | 'rejected' = 'pending'
  #value: unknown = undefined
  #queue: (() => void)[] = []

  public resolve: ResolveFn<ResolveT>
  public reject: RejectFn<ResolveT>

  get state() {
    return this.#state
  }
  get rejectionReason() {
    return this.#state === 'rejected' ? this.#value : undefined
  }

  constructor(executor: Executor<T> | null = null) {
    let handled = false

    const resolve: ResolveFn<T> = (value) => {
      !handled && (handled = true) && queueMicrotask(() => this.#fulfill(value))
    }
    const reject: RejectFn<T> = (reason?) => {
      !handled && (handled = true) && queueMicrotask(() => this.#reject(reason))
    }

    try {
      executor?.(resolve, reject)
    } catch (reason) {
      reject(reason)
    }

    this.resolve = resolve as ResolveFn<ResolveT>
    this.reject = reject as RejectFn<ResolveT>
  }

  then<ThenResult = T, CatchResult = never>(
    onFulfill?: (value: T) => ThenResult | PromiseLike<ThenResult>,
    onReject?: (reason: any) => CatchResult | PromiseLike<CatchResult>
  ) {
    if (typeof onFulfill !== 'function') onFulfill = (x: any) => x
    if (typeof onReject !== 'function') {
      onReject = (x) => {
        throw x
      }
    }

    type ChildT = ThenResult | CatchResult
    const childPromise = new DeferredPromise<ChildT, ResolveT>()
    const childResolve = childPromise.resolve as ResolveFn<ChildT>
    const childReject = childPromise.reject as RejectFn<ChildT>

    const onParentResolved = () => {
      try {
        childResolve(
          (this.#state === 'rejected' ? onReject : onFulfill)!(this.#value as T)
        )
      } catch (reason) {
        childReject(reason)
      }
    }

    // If parent promise is already done, resolve the child in the next microtask.
    if (this.#state !== 'pending') queueMicrotask(onParentResolved)
    // Otherwise we register a callback. Once the parent is done, its callbacks
    // run so the child promise will resolve. Unshift so that the queue pops in order.
    else this.#queue.unshift(onParentResolved)

    childPromise.resolve = this.resolve
    childPromise.reject = this.reject

    return childPromise
  }

  catch<CatchResult = never>(
    onReject?: (reason: any) => CatchResult | PromiseLike<CatchResult>
  ) {
    return this.then(undefined, onReject)
  }

  finally(onFinally?: () => void | Promise<any>) {
    const resolveValueIfFinallyFulfills = <V>(value: V) => {
      const resolveFinally = (resolve: ResolveFn<any>) => resolve(onFinally?.())
      return new DeferredPromise(resolveFinally).then(() => value)
    }

    return this.then(resolveValueIfFinallyFulfills, (reason: any) => {
      return resolveValueIfFinallyFulfills(reason).then(() => {
        throw reason
      })
    })
  }

  // Recursively unwrap promises until we reach a non-thenable value.
  // Fulfill with this value or reject if something in the chain throws/rejects.
  #fulfill<N>(next: Parameters<ResolveFn<N>>[0]) {
    if (next === this) {
      return this.#reject(
        new TypeError(`Chaining cycle detected for promise: ${next}`)
      )
    }

    type NextValue = Awaited<typeof next>

    // If next could be a thenable (object or function), check for a .then method.
    // It could be a getter that throws - catch and reject promise in that case.
    let then: Executor<NextValue> | undefined
    if (typeof next === 'object' || typeof next === 'function') {
      try {
        then = (next as PromiseLike<NextValue>)?.then
      } catch (error) {
        return this.#reject(error)
      }
    }

    // If next is a thenable, unwrap it: add onResolve and onReject callbacks
    // that recursively call #fulfill, which will then check for the next thenable.
    if (typeof then === 'function') {
      let handled = false

      const onResolve: ResolveFn<NextValue> = (value) => {
        !handled && (handled = true) && this.#fulfill(value)
      }
      const onReject: RejectFn<NextValue> = (reason) => {
        !handled && (handled = true) && this.#reject(reason)
      }

      try {
        then.call(next, onResolve, onReject)
      } catch (reason) {
        onReject(reason)
      }
    } else {
      // If next isn't a thenable, the chain is fully unwrapped to its final value.
      // Settle (change state & set value), then run the queued .then callbacks.
      this.#value = next as Awaited<typeof next>
      this.#state = 'fulfilled'

      let callback: (() => void) | undefined
      while ((callback = this.#queue.pop())) callback()
    }
  }

  // Rejecting has no unwrapping behavior, so we can settle immediately.
  #reject(reason: unknown) {
    this.#value = reason
    this.#state = 'rejected'

    let callback: (() => void) | undefined
    while ((callback = this.#queue.pop())) callback()
  }
}
