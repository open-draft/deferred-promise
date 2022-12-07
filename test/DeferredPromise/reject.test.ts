import { DeferredPromise } from '../../src/DeferredPromise'

it('can be rejected without any reason', async () => {
  const promise = new DeferredPromise<void>()
  expect(promise.state).toBe('pending')

  promise.reject()

  expect(promise.state).toBe('pending')

  await expect(promise).rejects.toBeUndefined()
  expect(promise.state).toBe('rejected')
  expect(promise.rejectionReason).toBeUndefined()
})

it('can be rejected with a reason', async () => {
  const promise = new DeferredPromise<void>()
  expect(promise.state).toBe('pending')

  const reason = new Error('hello')
  promise.reject(reason)

  expect(promise.state).toBe('pending')

  await expect(promise).rejects.toThrow(reason)
  expect(promise.state).toBe('rejected')
  expect(promise.rejectionReason).toEqual(reason)
})

it('fulfills the promise with a "catch" block that did not throw', async () => {
  const promise = new DeferredPromise<void>().catch(() => {
    /**
     * @note that attaching a "catch" callback to a rejected promise
     * fulfills it unless this callback throws by itself.
     */
  })
  expect(promise.state).toBe('pending')

  const reason = new Error('hello')
  promise.reject(reason)

  expect(promise.state).toBe('pending')
  expect(await promise).toBeUndefined()
  // The state still remains as rejected.
  expect(promise.state).toBe('fulfilled')
  // But the rejection reason is undefined
  // because the "catch" block above didn't return any.
  expect(promise.rejectionReason).toBeUndefined()
})
