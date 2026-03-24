import { DeferredPromise } from '../src/deferred-promise'

process.on('unhandledRejection', () => {})

export const deferred = () => {
  const promise = new DeferredPromise()
  const { resolve, reject } = promise
  return { promise, resolve, reject }
}
