import { DeferredPromise } from '../../src/_DeferredPromise'

it('can be resolved without data', async () => {
  const promise = new DeferredPromise<void>()
  expect(promise.state).toBe('pending')
  promise.resolve()

  expect(promise.state).toBe('pending')
  expect(await promise).toBeUndefined()
  expect(promise.state).toBe('fulfilled')
})

it('can be resolved with data', async () => {
  const promise = new DeferredPromise<number>()
  expect(promise.state).toBe('pending')

  promise.resolve(123)

  expect(promise.state).toBe('pending')
  expect(await promise).toBe(123)
  expect(promise.state).toBe('fulfilled')
})

it('does nothing when resolving an already resolved promise', async () => {
  const promise = new DeferredPromise<number>()
  expect(promise.state).toBe('pending')

  promise.resolve(123)
  expect(promise.state).toBe('pending')
  expect(await promise).toBe(123)
  expect(promise.state).toBe('fulfilled')

  // Resolving an already resolved Promise does nothing.
  promise.resolve(456)
  expect(promise.state).toBe('fulfilled')
  expect(await promise).toBe(123)
})

it('throws when resolving an already rejected promise', async () => {
  const promise = new DeferredPromise().catch((error) => error)
  expect(promise.state).toBe('pending')
  promise.reject('first reason')

  await promise
  expect(promise.state).toBe('rejected')
  expect(promise.rejectionReason).toBe('first reason')

  promise.reject('second reason')
  expect(promise.state).toBe('rejected')
  expect(promise.rejectionReason).toBe('first reason')
})
