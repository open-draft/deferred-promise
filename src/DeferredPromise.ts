import {
  createDeferredExecutor,
  DeferredPromiseExecutor,
  PromiseState,
  ResolveFunction,
  RejectFunction,
} from './createDeferredExecutor'

/**
 * @example
 * function getPort() {
 *   const portReadyPromise = new DeferredPromise<number>()
 *   port.on('ready', (port) => portReadyPromise.resolve(port))
 *   port.on('error', (error) => portReadyPromise.reject(error))
 *   returtn portReadyPromise
 * }
 */
export class DeferredPromise<Data = void> {
  #promise: Promise<Data>
  #executor: DeferredPromiseExecutor<Data>

  public resolve: ResolveFunction<Data>
  public reject: RejectFunction

  constructor() {
    this.#executor = createDeferredExecutor<Data>()
    this.#promise = new Promise<Data>(this.#executor)

    this.resolve = this.#executor.resolve
    this.reject = this.#executor.reject
  }

  static get [Symbol.species]() {
    return Promise
  }

  get [Symbol.toStringTag]() {
    return 'DeferredPromise'
  }

  public get state(): PromiseState {
    return this.#executor.state
  }

  public get rejectionReason(): unknown {
    return this.#executor.rejectionReason
  }

  public then<FulfillmentResult = Data, RejectionResult = never>(
    onFulfilled?: ResolveFunction<Data, FulfillmentResult> | null,
    onRejected?: RejectFunction<RejectionResult> | null
  ): DeferredPromise<FulfillmentResult | RejectionResult> {
    const derivedPromise = new DeferredPromise<
      FulfillmentResult | RejectionResult
    >()

    const resolveDerivedPromise = (result: any): void => {
      if (typeof onFulfilled === 'function') {
        try {
          const nextResult = onFulfilled(result)
          derivedPromise.#executor.resolve(nextResult as any)
        } catch (error) {
          rejectDerivedPromise(error)
        }

        return
      }

      /**
       * @note Use the executor directly because the "resolve" method
       * always gets overridden to point to the previous Promise in the chain.
       */
      derivedPromise.#executor.resolve(result)
    }

    const rejectDerivedPromise = (result: RejectionResult): void => {
      if (typeof onRejected === 'function') {
        try {
          const nextReason = onRejected(result)

          /**
           * @note If the rejection has a handler callback ("catch"),
           * resolve the chained promise instead of rejecting it.
           * The "catch" callback is there precisely to prevent
           * uncaught promise rejection errors.
           */
          derivedPromise.#executor.resolve(nextReason as any)

          /**
           * @note Since the handled rejected promise was resolved internally,
           * still mark its state as rejected. Do so in the next microtask
           * because executor rejects the promise in the next task as well
           */
          queueMicrotask(() => {
            derivedPromise.#executor.state = 'rejected'
            derivedPromise.#executor.rejectionReason = nextReason
          })
        } catch (error) {
          rejectDerivedPromise(error)
        }

        return
      }

      derivedPromise.#executor.reject(result)
    }

    switch (this.state) {
      case 'pending': {
        /**
         * @note Override the chainable "resolve" so that when called
         * it executes the resolve of the Promise from which it was
         * chained from.
         *
         * @example
         * const p1 = new DeferredPromise().then(A).then(B)
         * p1.resolve()
         *
         * Here, "p1" points to the rightmost promise (B) but the
         * order of resolving the value must be left-to-right:
         * Initial -> A -> B
         */
        derivedPromise.resolve = this.resolve as ResolveFunction<
          FulfillmentResult | RejectionResult
        >
        derivedPromise.reject = this.reject

        this.#promise.then(resolveDerivedPromise, rejectDerivedPromise)

        break
      }

      case 'fulfilled': {
        resolveDerivedPromise(this.#executor.result)
        break
      }

      case 'rejected': {
        rejectDerivedPromise(this.#executor.rejectionReason as RejectionResult)
        break
      }
    }

    return derivedPromise
  }

  public catch<Result>(
    onRejected?: RejectFunction<Result>
  ): DeferredPromise<Data | Result> {
    return this.then(undefined, onRejected)
  }

  public finally(onSettled?: (() => void) | null) {
    return this.then(
      (result) => {
        onSettled?.()
        return result
      },
      (reason) => {
        onSettled?.()
        throw reason
      }
    )
  }
}
