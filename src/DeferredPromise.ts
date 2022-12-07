import {
  type Executor,
  type RejectFunction,
  type ResolveFunction,
  type DeferredPromiseExecutor,
  createDeferredExecutor,
} from './createDeferredExecutor'

export class DeferredPromise<Input, Output = Input> extends Promise<Input> {
  #executor: DeferredPromiseExecutor

  public resolve: ResolveFunction<Output>
  public reject: RejectFunction<Output>

  constructor(executor: Executor<Input> | null = null) {
    const deferredExecutor = createDeferredExecutor()
    super((originalResolve, originalReject) => {
      deferredExecutor(originalResolve, originalReject)
      executor?.(deferredExecutor.resolve, deferredExecutor.reject)
    })

    this.#executor = deferredExecutor
    this.resolve = this.#executor.resolve
    this.reject = this.#executor.reject
  }

  public get state() {
    return this.#executor.state
  }

  public get rejectionReason() {
    return this.#executor.rejectionReason
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
