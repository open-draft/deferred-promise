import { DeferredPromise } from '../../src/deferred-promise'

it('can be resolved without data', async () => {
  const promise = new DeferredPromise<void>()
  expect(promise.state).toBe('pending')
  promise.resolve()

  expect(promise.state).toBe('pending')
  await expect(promise).resolves.toBeUndefined()
  expect(promise.state).toBe('fulfilled')
})

it('can be resolved with data', async () => {
  const promise = new DeferredPromise<number>()
  expect(promise.state).toBe('pending')

  promise.resolve(123)

  expect(promise.state).toBe('pending')
  await expect(promise).resolves.toBe(123)
  expect(promise.state).toBe('fulfilled')
})

it('does nothing when resolving an already resolved promise', async () => {
  const promise = new DeferredPromise<number>()
  expect(promise.state).toBe('pending')

  promise.resolve(123)
  expect(promise.state).toBe('pending')
  await expect(promise).resolves.toBe(123)
  expect(promise.state).toBe('fulfilled')

  // Resolving an already resolved Promise does nothing.
  promise.resolve(456)
  expect(promise.state).toBe('fulfilled')
  await expect(promise).resolves.toBe(123)
})

it('throws when resolving an already rejected promise', async () => {
  const promise = new DeferredPromise()
  expect(promise.state).toBe('pending')
  promise.reject('first reason')

  await expect(promise).rejects.toBe('first reason')
  expect(promise.state).toBe('rejected')
  expect(promise.rejectionReason).toBe('first reason')

  promise.reject('second reason')
  expect(promise.state).toBe('rejected')
  expect(promise.rejectionReason).toBe('first reason')
})
