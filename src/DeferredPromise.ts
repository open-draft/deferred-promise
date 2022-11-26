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
class DeferredPromise<Input = never, Output = Input> {
  #promise: Promise<Output>
  #executor: DeferredPromiseExecutor<Input, Output>

  public resolve: (value: Input) => void
  public reject: (reason?: unknown) => void

  constructor(public name?: string) {
    this.#executor = createDeferredExecutor<Input, Output>()
    this.#promise = new Promise<Output>(this.#executor as any)

    Object.defineProperty(this.#executor.resolve, 'name', {
      value: `resolve(${this.name})`,
    })
    Object.defineProperty(this.#executor.reject, 'name', {
      value: `reject(${this.name})`,
    })

    this.resolve = (result) => {
      console.warn('[%s.resolve()]:', this.name, result, this)
      return this.#executor.resolve(result)
    }

    this.reject = (reason) => {
      console.warn('[%s.reject()]:', this.name, reason, this)
      return this.#executor.reject(reason)
    }
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

  public callbacks = []

  public then<FulfillmentResult = Output, RejectionResult = never>(
    onFulfilled?: ResolveFunction<Output, FulfillmentResult> | null,
    onRejected?: RejectFunction<RejectionResult> | null
  ): DeferredPromise<Input, FulfillmentResult | RejectionResult> {
    const derivedPromise = new DeferredPromise<
      Input,
      FulfillmentResult | RejectionResult
    >('derived')

    const resolveDerivedPromise = (result: any): void => {
      console.log('[resolveDerivedPromise]', derivedPromise, {
        result,
        onFulfilled,
        onRejected,
      })

      if (typeof onFulfilled === 'function') {
        try {
          const nextResult = onFulfilled(result)
          derivedPromise.#executor.resolve(nextResult as Input)
        } catch (error) {
          console.error('[resolveDerivedPromise] exception', { error })
          console.log(
            'calling derivedPromise.#executor.reject...',
            derivedPromise.#executor.reject
          )

          derivedPromise.#executor.reject(error)
        }
      } else {
        /**
         * @note Use the executor directly because the "resolve" method
         * always gets overridden to point to the previous Promise in the chain.
         */
        derivedPromise.#executor.resolve(result)
      }
    }

    const rejectDerivedPromise = (result: RejectionResult): void => {
      console.warn('[rejectDerivedPromise] ', this)

      if (typeof onRejected === 'function') {
        const nextReason = onRejected(result)
        derivedPromise.#executor.resolve(nextReason as any)
      } else {
        derivedPromise.#executor.reject(result)
      }
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
        derivedPromise.resolve = this.resolve
        derivedPromise.reject = this.reject

        this.#promise.then(
          (result) => {
            console.trace('[%s.#promise.then]:', this.name, result, this)
            return resolveDerivedPromise(result)
          },
          (reason) => {
            console.trace('[%s.#promise.catch]:', this.name, reason, this)

            return rejectDerivedPromise(reason)
          }
        )

        this.callbacks.push([onFulfilled?.name, onRejected?.name])

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
  ): DeferredPromise<Input, Output | Result> {
    return this.then(undefined, onRejected)
  }

  public finally(onSettled?: (() => void | Promise<any>) | null) {
    console.warn('[%s.finally()] called', this.name, this)

    return this.then(
      function finallyFulfilled(result) {
        onSettled?.()
        return result
      },
      function finallyRejected(reason) {
        onSettled?.()
        throw reason
      }
    )
  }
}

export { DeferredPromise }
// export { DeferredPromise } from './DeferredPromise.subclass'
// export { DeferredPromise } from './DeferredPromise.standalone'
