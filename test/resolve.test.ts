import { DeferredPromise } from '../src'

it('can be resolved without data', () => {
  const promise = new DeferredPromise<void>()
  expect(promise.state).toBe('pending')
  promise.resolve()

  expect(promise.state).toBe('resolved')
  expect(promise.result).toBeUndefined()
})

it('can be resolved with data', () => {
  const promise = new DeferredPromise<number>()
  expect(promise.state).toBe('pending')

  promise.resolve(123)

  expect(promise.state).toBe('resolved')
  expect(promise.result).toBe(123)
})

it('does nothing when resolving an already resolved promise', async () => {
  const promise = new DeferredPromise<number>()
  expect(promise.state).toBe('pending')

  promise.resolve(123)
  expect(promise.state).toBe('resolved')
  expect(promise.result).toBe(123)

  // Resolving an already resolved Promise does nothing.
  promise.resolve(456)
  expect(promise.state).toBe('resolved')
  expect(promise.result).toBe(123)
})

it('throws when resolving an already rejected promise', () => {
  const promise = new DeferredPromise<number>().catch(() => {})
  expect(promise.state).toBe('pending')
  promise.reject('first reason')

  expect(promise.state).toBe('rejected')
  expect(promise.rejectionReason).toBe('first reason')

  promise.reject('second reason')
  expect(promise.state).toBe('rejected')
  expect(promise.rejectionReason).toBe('first reason')
})
