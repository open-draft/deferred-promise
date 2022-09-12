export type DeferredPromiseState = 'pending' | 'resolved' | 'rejected'
export type ResolveFunction<Data extends any, Result = void> = (
  data: Data
) => Result
export type RejectFunction<Result = void> = (reason?: unknown) => Result

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
export class DeferredPromise<Data extends any> {
  public resolve: ResolveFunction<Data>
  public reject: RejectFunction
  public state: DeferredPromiseState
  public result?: Data
  public rejectionReason?: unknown

  private promise: Promise<Data>

  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = (data) => {
        if (this.state !== 'pending') {
          throw new TypeError(
            `Cannot resolve a DeferredPromise: illegal state ("${this.state}")`
          )
        }

        this.state = 'resolved'
        this.result = data
        resolve(data)
      }

      this.reject = (reason) => {
        if (this.state !== 'pending') {
          throw new TypeError(
            `Cannot reject a DeferredPromise: illegal state ("${this.state}")`
          )
        }

        this.state = 'rejected'
        this.rejectionReason = reason
        reject(reason)
      }
    })

    this.state = 'pending'
    this.result = undefined
    this.rejectionReason = undefined
  }

  public then(onresolved?: ResolveFunction<Data>, onrejected?: RejectFunction) {
    this.promise.then(onresolved, onrejected)
    return this
  }

  public catch<RejectReason = never>(
    onrejected?: RejectFunction<RejectReason>
  ): this {
    this.promise.catch<RejectReason>(onrejected)
    return this
  }

  static get [Symbol.species]() {
    return Promise
  }

  get [Symbol.toStringTag]() {
    return 'DeferredPromise'
  }
}
