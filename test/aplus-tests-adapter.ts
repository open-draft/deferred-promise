import { DeferredPromise } from '../src/DeferredPromise'

process.on('unhandledRejection', () => {})

export const deferred = () => {
  const promise = new DeferredPromise()
  const { resolve, reject } = promise

  return { promise, resolve, reject }
}
