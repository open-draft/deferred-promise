import { IllegalStateError } from "./IllegalStateError";

export type DeferredPromiseState = "pending" | "resolved" | "rejected";

export type ResolveFunction<Data extends any, Result = void> = (
  data: Data
) => Result | PromiseLike<Result>;

export type RejectFunction<Result = void> = (
  reason?: unknown
) => Result | PromiseLike<Result>;

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
  public resolve: ResolveFunction<Data>;
  public reject: RejectFunction;
  public state: DeferredPromiseState;
  public result?: Data;
  public rejectionReason?: unknown;

  private promise: Promise<unknown>;

  constructor() {
    this.promise = new Promise<Data>((resolve, reject) => {
      this.resolve = (data) => {
        if (this.state !== "pending") {
          throw new IllegalStateError(
            "Cannot resolve a DeferredPromise: illegal state",
            this.state
          );
        }

        this.state = "resolved";
        this.result = data;
        resolve(data);
      };

      this.reject = (reason) => {
        if (this.state !== "pending") {
          throw new IllegalStateError(
            "Cannot reject a DeferredPromise: illegal state",
            this.state
          );
        }

        this.state = "rejected";
        this.rejectionReason = reason;
        reject(reason);
      };
    });

    this.state = "pending";
    this.result = undefined;
    this.rejectionReason = undefined;
  }

  /**
   * Attaches callbacks for the resolution and/or rejection of the Promise.
   */
  public then<ResolveData = Data, RejectionReason = never>(
    onresolved?: ResolveFunction<Data, ResolveData>,
    onrejected?: RejectFunction<RejectionReason>
  ): DeferredPromise<ResolveData | RejectionReason> {
    this.promise = this.promise.then<ResolveData, RejectionReason>(
      onresolved,
      onrejected
    );
    return this as DeferredPromise<ResolveData | RejectionReason>;
  }

  /**
   * Attaches a callback for only the rejection of the Promise.
   */
  public catch<RejectReason = never>(
    onrejected?: RejectFunction<RejectReason>
  ): DeferredPromise<Data | RejectReason> {
    this.promise = this.promise.catch<RejectReason>(onrejected);
    return this;
  }

  /**
   * Attaches a callback that is invoked when
   * the Promise is settled (fulfilled or rejected). The resolved
   * value cannot be modified from the callback.
   */
  public finally(onfinally?: () => void): DeferredPromise<Data> {
    this.promise = this.promise.finally(onfinally);
    return this;
  }

  static get [Symbol.species]() {
    return Promise;
  }

  get [Symbol.toStringTag]() {
    return "DeferredPromise";
  }
}
