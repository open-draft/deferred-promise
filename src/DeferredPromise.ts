import {
  PromiseState,
  RejectFunction,
  ResolveFunction,
} from './createDeferredExecutor'

export type ExtractItemType<A extends Array<any>> = A extends Array<infer T>
  ? T
  : never

/**
 * Represents the completion of an asynchronous operation.
 * Can be resolved or rejected outside of its closure.
 *
 * @example
 * const numberReady = new DeferredPromise()
 * numberReady.resolve(123)
 *
 * @example
 * const portReady = new DeferredPromise()
 * portReady.reject(new Error('Port is already in use'))
 */
export class DeferredPromise<Data extends any = void> {
  public resolve: ResolveFunction<Data>
  public reject: RejectFunction
  public state: PromiseState
  public result?: Promise<Data>
  public rejectionReason?: unknown

  private thenCallbacks: Array<ResolveFunction<unknown> | undefined>
  private catchCallbacks: Array<RejectFunction<unknown>>
  private promise: Promise<unknown>

  constructor() {
    this.thenCallbacks = []
    this.catchCallbacks = []

    this.promise = new Promise<Data>((resolve, reject) => {
      this.resolve = (data) => {
        if (this.state !== 'pending') {
          return
        }

        this.state = 'fulfilled'
        this.result = this.waterfall(data, this.thenCallbacks) as Promise<Data>
        this.result.then((result) => {
          resolve(result)
        })
      }

      this.reject = (reason) => {
        if (this.state !== 'pending') {
          return
        }

        console.trace('reject', reason)

        this.state = 'rejected'
        this.rejectionReason = reason
        reject(reason)

        // this.waterfall(reason, this.catchCallbacks).then((result) => {
        //   console.warn('reject waterfall result:', result)

        // })
      }
    }).catch((reason) => {
      console.log('REJE')
      return this.waterfall(reason, this.catchCallbacks)
    })

    this.state = 'pending'
    this.result = undefined
    this.rejectionReason = undefined
  }

  // /**
  //  * Creates a Promise that reduces all the `.then()` callbacks
  //  * over the result that the deferred promise has resolved with.
  //  * Returns the result of that.
  //  */
  // private async toResultPromise(data: Data): Promise<Data> {
  //   let result: Data = data
  //   let tuple: ExtractItemType<typeof this.transforms>

  //   console.log('--> toResultPromise', this.transforms)

  //   while ((tuple = this.transforms.shift())) {
  //     const [next, reject] = tuple

  //     try {
  //       result = (await next(result)) as Data
  //     } catch (error) {
  //       reject?.(error)
  //     }
  //   }

  //   return result
  // }

  private async waterfall(
    input: unknown,
    fns: Array<(...args: unknown[]) => unknown>
  ): Promise<unknown> {
    let result = input
    let fn: (...args: unknown[]) => unknown

    while ((fn = fns.shift())) {
      try {
        result = await fn(result)
      } catch (error) {
        console.trace('HEY THIS IS WRONG', error)
      }
    }

    return result
  }

  /**
   * Attaches callbacks for the fulfillment and rejection of the Promise.
   */
  public then<ResolveData = Data, RejectionReason = never>(
    onFulfilled?: ResolveFunction<Data>,
    onRejected?: RejectFunction<RejectionReason>
  ): DeferredPromise<ResolveData | RejectionReason> {
    const chainable = new DeferredPromise<ResolveData | RejectionReason>()

    /**
     * @todo Delegate all transforms to the right-most (current) Promise.
     * Since `.resolve()` will be called only on that last Promise,
     * other preceding promises won't be able to yield value.
     */
    if (typeof onFulfilled === 'function') {
      chainable.thenCallbacks.push(...this.thenCallbacks, onFulfilled)
    }

    if (typeof onRejected === 'function') {
      chainable.catchCallbacks.push(...this.catchCallbacks, onRejected)
    }

    this.promise.then(
      (result: ResolveData | RejectionReason) => {
        chainable.resolve(result)
      },
      (error) => {
        console.error('rejected!', error)
        chainable.reject(error)
      }
    )

    return chainable
  }

  /**
   * Attaches a callback for only the rejection of the Promise.
   */
  public catch<RejectReason = never>(
    onRejected?: RejectFunction<RejectReason>
  ): DeferredPromise<Data | RejectReason> {
    return this.then(null, onRejected)
  }

  /**
   * Attaches a callback that is invoked when
   * the Promise is settled (fulfilled or rejected). The resolved
   * value cannot be modified from the callback.
   */
  public finally(onFinally?: () => void): DeferredPromise<Data> {
    // this.promise = this.promise.finally(onFinally)
    return this
  }

  static get [Symbol.species]() {
    return Promise
  }

  get [Symbol.toStringTag]() {
    return 'DeferredPromise'
  }
}
