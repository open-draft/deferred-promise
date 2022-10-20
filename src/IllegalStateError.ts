import { type DeferredPromiseState } from "./DeferredPromise";

export class IllegalStateError extends Error {
  constructor(message: string, public readonly state: DeferredPromiseState) {
    super(message);
  }
}
